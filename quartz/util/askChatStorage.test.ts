import test from "node:test"
import assert from "node:assert/strict"
import {
  ASK_CHAT_STORAGE_KEY,
  clearPersistedAskChat,
  loadPersistedAskChat,
  prunePersistedMessages,
  savePersistedAskChat,
} from "./askChatStorage"

class MemoryStorage implements Storage {
  private store = new Map<string, string>()

  get length() {
    return this.store.size
  }

  clear() {
    this.store.clear()
  }

  getItem(key: string) {
    return this.store.get(key) ?? null
  }

  key(index: number) {
    return [...this.store.keys()][index] ?? null
  }

  removeItem(key: string) {
    this.store.delete(key)
  }

  setItem(key: string, value: string) {
    this.store.set(key, value)
  }
}

test("save and load round-trips chat messages without secrets", () => {
  const storage = new MemoryStorage()
  savePersistedAskChat(
    [
      { role: "user", content: "Hello" },
      {
        role: "assistant",
        content: "Hi [1]",
        sources: [{ url: "/note", title: "Note", heading: "Intro" }],
      },
    ],
    storage,
  )

  const loaded = loadPersistedAskChat(storage)
  assert.equal(loaded?.messages.length, 2)
  assert.equal(loaded?.messages[1]?.sources?.[0]?.title, "Note")
  assert.equal(storage.getItem(ASK_CHAT_STORAGE_KEY)?.includes("NVIDIA"), false)
})

test("prunePersistedMessages caps message count", () => {
  const many = Array.from({ length: 50 }, (_, index) => ({
    role: "user" as const,
    content: `Message ${index}`,
  }))
  assert.equal(prunePersistedMessages(many).length, 40)
})

test("clearPersistedAskChat removes stored thread", () => {
  const storage = new MemoryStorage()
  savePersistedAskChat([{ role: "user", content: "Test" }], storage)
  clearPersistedAskChat(storage)
  assert.equal(loadPersistedAskChat(storage), null)
})
