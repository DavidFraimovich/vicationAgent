import assert from "node:assert/strict";
import test from "node:test";
import {
  probeTelegramConnection,
  previewTelegramPush,
  sendTelegramPush,
} from "../src/telegram.js";

test("Telegram preview composes a plain-text title and message", () => {
  const preview = previewTelegramPush({
    title: "עדכון טיול",
    message: "התקבלה תשובה חדשה מהמארח.",
    silent: true,
  });

  assert.equal(preview.text, "עדכון טיול\n\nהתקבלה תשובה חדשה מהמארח.");
  assert.equal(preview.destination, "configured_chat");
  assert.equal(preview.format, "plain_text");
  assert.equal(preview.silent, true);
  assert.equal(preview.characterCount, preview.text.length);
});

test("Telegram preview rejects empty and oversized messages", () => {
  assert.throws(
    () => previewTelegramPush({ message: "   " }),
    /must not be empty/,
  );
  assert.throws(
    () => previewTelegramPush({ message: "x".repeat(4097) }),
    /at most 4096/,
  );
});

test("Telegram sender posts only to the configured chat and returns safe metadata", async () => {
  let requestUrl = "";
  let requestBody: Record<string, unknown> = {};
  const fetchImpl: typeof fetch = async (input, init) => {
    requestUrl = String(input);
    requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return new Response(JSON.stringify({
      ok: true,
      result: { message_id: 42, date: 1_785_200_000 },
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  const sent = await sendTelegramPush(
    {
      message: "בדיקת יחידה בלבד",
      messageThreadId: 7,
    },
    {
      config: {
        botToken: "test-token",
        chatId: "-1001234567890",
      },
      fetchImpl,
    },
  );

  assert.equal(requestUrl, "https://api.telegram.org/bottest-token/sendMessage");
  assert.deepEqual(requestBody, {
    chat_id: "-1001234567890",
    text: "בדיקת יחידה בלבד",
    disable_notification: false,
    message_thread_id: 7,
  });
  assert.equal(sent.ok, true);
  assert.equal(sent.messageId, 42);
  assert.equal(sent.destination, "configured_chat");
  assert.equal("botToken" in sent, false);
});

test("Telegram connection probe verifies the bot and configured chat without sending", async () => {
  const calledMethods: string[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    const method = String(input).split("/").pop() ?? "";
    calledMethods.push(method);
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    if (method === "getMe") {
      assert.deepEqual(body, {});
      return new Response(JSON.stringify({
        ok: true,
        result: { id: 123, is_bot: true, username: "travel_push_bot" },
      }), { status: 200 });
    }
    assert.equal(method, "getChat");
    assert.deepEqual(body, { chat_id: "-1001234567890" });
    return new Response(JSON.stringify({
      ok: true,
      result: { id: -1001234567890, type: "supergroup", title: "Travel updates" },
    }), { status: 200 });
  };

  const health = await probeTelegramConnection({
    config: {
      botToken: "test-token",
      chatId: "-1001234567890",
    },
    fetchImpl,
  });

  assert.deepEqual(calledMethods, ["getMe", "getChat"]);
  assert.equal(health.ok, true);
  assert.equal(health.botReachable, true);
  assert.equal(health.destinationReachable, true);
  assert.equal(health.destinationType, "supergroup");
});

test("Telegram sender does not expose the bot token in request failures", async () => {
  const fetchImpl: typeof fetch = async () => {
    throw new Error("network unavailable");
  };

  await assert.rejects(
    sendTelegramPush(
      { message: "עדכון" },
      {
        config: {
          botToken: "super-secret-token",
          chatId: "-1001234567890",
        },
        fetchImpl,
      },
    ),
    (error: Error) => {
      assert.match(error.message, /sendMessage request failed before a response/);
      assert.doesNotMatch(error.message, /super-secret-token/);
      return true;
    },
  );
});
