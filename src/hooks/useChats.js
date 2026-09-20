import { useCallback, useEffect, useRef, useState } from "react";
import { uid } from "../lib/format.js";

const KEY = "kevin.chats.v2";
const TITLE = "New conversation";

function readStored() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!data?.chats) return { chats: [], activeId: null };
    // A tab closed mid-reply can leave a half-written message behind; tidy it up.
    const chats = data.chats.map((c) => ({
      ...c,
      messages: c.messages
        .map((m) => (m.streaming ? { ...m, streaming: false, stopped: true } : m))
        .filter((m) => m.role !== "assistant" || m.content.trim()),
    }));
    return { chats, activeId: chats.some((c) => c.id === data.activeId) ? data.activeId : chats[0]?.id ?? null };
  } catch {
    return { chats: [], activeId: null };
  }
}

export function useChats(saveChats) {
  const [state, setState] = useState(() => (saveChats ? readStored() : { chats: [], activeId: null }));
  const timer = useRef(null);

  // Persist (debounced so streaming tokens don't hammer storage).
  useEffect(() => {
    clearTimeout(timer.current);
    if (!saveChats) {
      try {
        localStorage.removeItem(KEY);
      } catch {
        /* ignore */
      }
      return;
    }
    timer.current = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch {
        /* storage full or blocked */
      }
    }, 400);
    return () => clearTimeout(timer.current);
  }, [state, saveChats]);

  const active = state.chats.find((c) => c.id === state.activeId) ?? null;

  const newChat = useCallback(() => {
    const id = uid();
    setState((s) => {
      const current = s.chats.find((c) => c.id === s.activeId);
      if (current && current.messages.length === 0) return s; // reuse the empty one
      const now = Date.now();
      return { chats: [{ id, title: TITLE, createdAt: now, updatedAt: now, messages: [] }, ...s.chats], activeId: id };
    });
  }, []);

  /** Returns a chat id to write into, creating a chat if none is active. */
  const ensureChat = useCallback(() => {
    if (active) return active.id;
    const id = uid();
    const now = Date.now();
    setState((s) => ({ chats: [{ id, title: TITLE, createdAt: now, updatedAt: now, messages: [] }, ...s.chats], activeId: id }));
    return id;
  }, [active]);

  const selectChat = useCallback((id) => setState((s) => ({ ...s, activeId: id })), []);

  const deleteChat = useCallback((id) => {
    setState((s) => {
      const chats = s.chats.filter((c) => c.id !== id);
      return { chats, activeId: s.activeId === id ? chats[0]?.id ?? null : s.activeId };
    });
  }, []);

  const clearAll = useCallback(() => setState({ chats: [], activeId: null }), []);

  const addMessages = useCallback((chatId, msgs) => {
    setState((s) => ({
      ...s,
      chats: s.chats.map((c) => {
        if (c.id !== chatId) return c;
        const firstUser = msgs.find((m) => m.role === "user");
        const flat = firstUser ? firstUser.content.replace(/\s+/g, " ").trim() : "";
        const title = c.title === TITLE && flat ? (flat.length > 44 ? `${flat.slice(0, 44).trimEnd()}…` : flat) : c.title;
        return { ...c, title, updatedAt: Date.now(), messages: [...c.messages, ...msgs] };
      }),
    }));
  }, []);

  const patchMessage = useCallback((chatId, msgId, patch) => {
    setState((s) => ({
      ...s,
      chats: s.chats.map((c) =>
        c.id !== chatId
          ? c
          : {
              ...c,
              messages: c.messages.map((m) =>
                m.id === msgId ? { ...m, ...(typeof patch === "function" ? patch(m) : patch) } : m
              ),
            }
      ),
    }));
  }, []);

  const dropMessage = useCallback((chatId, msgId) => {
    setState((s) => ({
      ...s,
      chats: s.chats.map((c) => (c.id === chatId ? { ...c, messages: c.messages.filter((m) => m.id !== msgId) } : c)),
    }));
  }, []);

  return { chats: state.chats, active, newChat, ensureChat, selectChat, deleteChat, clearAll, addMessages, patchMessage, dropMessage };
}
