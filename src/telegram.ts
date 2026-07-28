import fs from "node:fs";
import { loadEnvFile } from "node:process";
import path from "node:path";
import { projectRoot } from "./paths.js";

const TELEGRAM_MESSAGE_MAX_LENGTH = 4096;
const TELEGRAM_TITLE_MAX_LENGTH = 160;

export type TelegramPushInput = {
  message: string;
  title?: string;
  silent?: boolean;
  messageThreadId?: number;
};

type TelegramRuntimeConfig = {
  botToken: string;
  chatId: string;
};

type TelegramApiResponse<TResult = unknown> = {
  ok: boolean;
  description?: string;
  result?: TResult;
};

let localEnvLoaded = false;

function loadLocalEnv(): void {
  if (localEnvLoaded) return;
  localEnvLoaded = true;
  const envPath = path.join(projectRoot, ".env");
  if (fs.existsSync(envPath)) loadEnvFile(envPath);
}

function requiredEnv(name: "TELEGRAM_BOT_TOKEN" | "TELEGRAM_CHAT_ID"): string {
  loadLocalEnv();
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured in the project environment.`);
  return value;
}

function runtimeConfig(): TelegramRuntimeConfig {
  return {
    botToken: requiredEnv("TELEGRAM_BOT_TOKEN"),
    chatId: requiredEnv("TELEGRAM_CHAT_ID"),
  };
}

function composeText(input: TelegramPushInput): string {
  const message = input.message.trim();
  const title = input.title?.trim();

  if (!message) throw new Error("Telegram message must not be empty.");
  if (title && title.length > TELEGRAM_TITLE_MAX_LENGTH) {
    throw new Error(`Telegram title must be at most ${TELEGRAM_TITLE_MAX_LENGTH} characters.`);
  }

  const text = title ? `${title}\n\n${message}` : message;
  if (text.length > TELEGRAM_MESSAGE_MAX_LENGTH) {
    throw new Error(
      `Telegram message must be at most ${TELEGRAM_MESSAGE_MAX_LENGTH} characters including the title.`,
    );
  }
  return text;
}

export function telegramConfigured(): boolean {
  loadLocalEnv();
  return Boolean(
    process.env.TELEGRAM_BOT_TOKEN?.trim()
    && process.env.TELEGRAM_CHAT_ID?.trim(),
  );
}

export function previewTelegramPush(input: TelegramPushInput) {
  const text = composeText(input);
  return {
    provider: "telegram",
    destination: "configured_chat",
    format: "plain_text",
    text,
    characterCount: text.length,
    maxCharacters: TELEGRAM_MESSAGE_MAX_LENGTH,
    silent: input.silent ?? false,
    messageThreadId: input.messageThreadId,
  };
}

async function callTelegramApi<TResult>(
  method: string,
  body: Record<string, unknown>,
  config: TelegramRuntimeConfig,
  fetchImpl: typeof fetch,
): Promise<TResult> {
  const endpoint = `https://api.telegram.org/bot${config.botToken}/${method}`;
  let response: Response;
  try {
    response = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error(`Telegram ${method} request failed before a response was received.`);
  }

  let payload: TelegramApiResponse<TResult>;
  try {
    payload = await response.json() as TelegramApiResponse<TResult>;
  } catch {
    throw new Error(`Telegram returned an invalid response for ${method} (HTTP ${response.status}).`);
  }

  if (!response.ok || !payload.ok || payload.result === undefined) {
    const description = payload.description?.trim() || `HTTP ${response.status}`;
    throw new Error(`Telegram rejected ${method}: ${description}`);
  }
  return payload.result;
}

export async function probeTelegramConnection(
  options?: {
    config?: TelegramRuntimeConfig;
    fetchImpl?: typeof fetch;
  },
) {
  const config = options?.config ?? runtimeConfig();
  const fetchImpl = options?.fetchImpl ?? fetch;
  const bot = await callTelegramApi<{
    id: number;
    is_bot: boolean;
    username?: string;
  }>("getMe", {}, config, fetchImpl);
  const chat = await callTelegramApi<{
    id: number;
    type: string;
    title?: string;
  }>("getChat", { chat_id: config.chatId }, config, fetchImpl);

  return {
    ok: true,
    provider: "telegram",
    botReachable: bot.is_bot,
    botUsername: bot.username,
    destination: "configured_chat",
    destinationReachable: true,
    destinationType: chat.type,
    destinationTitle: chat.title,
  };
}

export async function sendTelegramPush(
  input: TelegramPushInput,
  options?: {
    config?: TelegramRuntimeConfig;
    fetchImpl?: typeof fetch;
  },
) {
  const preview = previewTelegramPush(input);
  const config = options?.config ?? runtimeConfig();
  const fetchImpl = options?.fetchImpl ?? fetch;
  const body: Record<string, unknown> = {
    chat_id: config.chatId,
    text: preview.text,
    disable_notification: preview.silent,
  };
  if (input.messageThreadId !== undefined) {
    if (!Number.isSafeInteger(input.messageThreadId) || input.messageThreadId <= 0) {
      throw new Error("Telegram messageThreadId must be a positive integer.");
    }
    body.message_thread_id = input.messageThreadId;
  }

  const sentMessage = await callTelegramApi<{
    message_id?: number;
    date?: number;
  }>("sendMessage", body, config, fetchImpl);

  return {
    ok: true,
    provider: "telegram",
    destination: "configured_chat",
    messageId: sentMessage.message_id,
    sentAt: sentMessage.date
      ? new Date(sentMessage.date * 1000).toISOString()
      : new Date().toISOString(),
    characterCount: preview.characterCount,
    silent: preview.silent,
    messageThreadId: preview.messageThreadId,
  };
}
