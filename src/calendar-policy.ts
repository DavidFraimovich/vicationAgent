type CalendarLikeItem = {
  itemType?: unknown;
  title?: unknown;
  source?: unknown;
  metadata?: unknown;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isProviderManagedLodgingItem(item: CalendarLikeItem): boolean {
  const itemType = text(item.itemType);
  const title = text(item.title);
  const source = text(item.source);
  const metadata = item.metadata && typeof item.metadata === "object"
    ? item.metadata as Record<string, unknown>
    : {};
  const calendarSource = text(metadata.calendarSource);

  if (calendarSource === "provider" || calendarSource === "airbnb_email") return true;
  if (itemType === "lodging") return true;
  if (source.includes("airbnb") && /(stay|lodging|check[\s-]?(?:in|out))/.test(title)) return true;

  if (itemType === "base") {
    return /(check[\s-]?(?:in|out)|last night near|lodging|accommodation)/.test(title);
  }

  return itemType === "logistics"
    && /^(check[\s-]?(?:in|out)|lodging|accommodation|airbnb|hotel stay|hostel stay)/.test(title);
}

export function isLikelyLodgingCalendarEvent(input: {
  summary?: unknown;
  itineraryItem?: CalendarLikeItem;
}): boolean {
  if (input.itineraryItem && isProviderManagedLodgingItem(input.itineraryItem)) return true;
  return /(check[\s-]?(?:in|out)|airbnb|lodging|accommodation|hotel stay|hostel stay)/.test(
    text(input.summary),
  );
}
