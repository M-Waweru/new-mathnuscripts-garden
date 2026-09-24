export const ASK_CHAT_STORAGE_KEY = "mathnuscripts:ask-chat:v1"
export const MAX_PERSISTED_MESSAGES = 40
export const MAX_PERSISTED_BYTES = 400_000

export type PersistedAskSource = {
  url: string
  title: string
  heading?: string
  text?: string
}

export type PersistedAskMessage = {
  role: "user" | "assistant"
  content: string
  sources?: PersistedAskSource[]
}

export type PersistedAskChat = {
  version: 1
  updatedAt: number
  messages: PersistedAskMessage[]
}

export function prunePersistedMessages(messages: PersistedAskMessage[]): PersistedAskMessage[] {
  const trimmed = messages.slice(-MAX_PERSISTED_MESSAGES)
  let payload = JSON.stringify(trimmed)
  while (payload.length > MAX_PERSISTED_BYTES && trimmed.length > 1) {
    trimmed.shift()
    payload = JSON.stringify(trimmed)
  }
  return trimmed
}

export function loadPersistedAskChat(storage: Storage = localStorage): PersistedAskChat | null {
  try {
    const raw = storage.getItem(ASK_CHAT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedAskChat
    if (parsed?.version !== 1 || !Array.isArray(parsed.messages)) return null
    return {
      version: 1,
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
      messages: prunePersistedMessages(parsed.messages),
    }
  } catch {
    return null
  }
}

export function savePersistedAskChat(
  messages: PersistedAskMessage[],
  storage: Storage = localStorage,
): void {
  const payload: PersistedAskChat = {
    version: 1,
    updatedAt: Date.now(),
    messages: prunePersistedMessages(messages),
  }
  try {
    storage.setItem(ASK_CHAT_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Quota exceeded or private mode — chat still works for this session.
  }
}

export function clearPersistedAskChat(storage: Storage = localStorage): void {
  try {
    storage.removeItem(ASK_CHAT_STORAGE_KEY)
  } catch {
    // ignore
  }
}
