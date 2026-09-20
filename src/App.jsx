import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { DEFAULT_SETTINGS, OWNER_REPLY, buildSystemPrompt } from "./config.js";
import { chatToMarkdown, downloadText, slug, uid } from "./lib/format.js";
import { detectCrisis, isOwnerQuestion } from "./lib/safety.js";
import { useChats } from "./hooks/useChats.js";
import { useKevin } from "./hooks/useKevin.js";
import { useLocalStorage } from "./hooks/useLocalStorage.js";
import Breathing from "./components/Breathing.jsx";
import Composer from "./components/Composer.jsx";
import Icon from "./components/Icon.jsx";
import Message from "./components/Message.jsx";
import ModelGate from "./components/ModelGate.jsx";
import Settings from "./components/Settings.jsx";
import Sidebar from "./components/Sidebar.jsx";
import TopBar from "./components/TopBar.jsx";
import Welcome from "./components/Welcome.jsx";

export default function App() {
  const [settings, updateSettings] = useLocalStorage("kevin.settings.v2", DEFAULT_SETTINGS);
  const kevin = useKevin();
  const chats = useChats(settings.saveChats);
  const { active, newChat: chatNew, selectChat: chatSelect, deleteChat: chatDelete } = chats;

  const [draft, setDraft] = useState("");
  const [focusSignal, setFocusSignal] = useState(0);
  const [gen, setGen] = useState(null); // { chatId, botId } while a reply is streaming
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);

  const ready = kevin.phase === "ready";
  const messages = active?.messages ?? [];
  const isEmpty = messages.length === 0;

  /* ---------- theme ---------- */
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const t = settings.theme === "system" ? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : settings.theme;
      root.setAttribute("data-theme", t);
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t === "light" ? "#f1f3f9" : "#0d1220");
    };
    apply();
    if (settings.theme !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: light)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [settings.theme]);

  /* ---------- optional auto-start ---------- */
  useEffect(() => {
    if (settings.autoLoad) kevin.load(settings.preferredDevice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDevicePreferenceChange = useCallback(
    (preferredDevice) => {
      updateSettings({ preferredDevice });
      kevin.load(preferredDevice);
    },
    [kevin, updateSettings]
  );

  /* ---------- scrolling ---------- */
  const scroller = useRef(null);
  const stick = useRef(true);
  const [showJump, setShowJump] = useState(false);
  const last = messages[messages.length - 1];

  const scrollDown = useCallback((smooth = false) => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  useLayoutEffect(() => {
    if (isEmpty) scroller.current?.scrollTo({ top: 0 });
    else if (stick.current) scrollDown();
  }, [last?.content, messages.length, isEmpty, scrollDown]);

  useLayoutEffect(() => {
    stick.current = true;
    if (isEmpty) scroller.current?.scrollTo({ top: 0 });
    else scrollDown();
    setShowJump(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, scrollDown]);

  const onScroll = () => {
    const el = scroller.current;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    stick.current = near;
    setShowJump(!near);
  };

  /* ---------- generating ---------- */
  const run = useCallback(
    (chatId, botId, history, crisis) => {
      const context = history
        .filter((m) => m.content.trim())
        .slice(-settings.contextMessages)
        .map(({ role, content }) => ({ role, content }));
      while (context.length && context[0].role !== "user") context.shift();

      setGen({ chatId, botId });
      kevin.generate(
        {
          system: buildSystemPrompt(settings.style, crisis),
          messages: context,
          options: { maxNewTokens: settings.maxNewTokens, temperature: settings.temperature },
        },
        {
          onToken: (t) => chats.patchMessage(chatId, botId, (m) => ({ content: m.content + t })),
          onDone: (d) => {
            const text = (d.text || "").trim();
            if (!text && d.stopped) {
              chats.dropMessage(chatId, botId);
            } else {
              chats.patchMessage(chatId, botId, {
                streaming: false,
                stopped: d.stopped,
                content: text || "I didn't manage to find the words that time. Could you try sending that again?",
              });
            }
            setGen(null);
          },
          onError: (message) => {
            chats.patchMessage(chatId, botId, (m) => ({ streaming: false, error: message || "Unknown error", content: m.content }));
            setGen(null);
          },
        }
      );
    },
    [kevin, chats, settings.contextMessages, settings.style, settings.maxNewTokens, settings.temperature]
  );

  const send = useCallback(
    (raw) => {
      const text = raw.trim();
      if (!text || gen || !ready) return;

      const chatId = chats.ensureChat();
      const now = Date.now();
      const crisis = detectCrisis(text);
      const userMsg = { id: uid(), role: "user", content: text, ts: now, ...(crisis && { crisis: true }) };
      setDraft("");
      stick.current = true;

      if (isOwnerQuestion(text)) {
        chats.addMessages(chatId, [userMsg, { id: uid(), role: "assistant", content: OWNER_REPLY, ts: now, owner: true }]);
        return;
      }

      const bot = { id: uid(), role: "assistant", content: "", ts: now, streaming: true, ...(crisis && { crisis: true }) };
      const history = [...(active?.messages ?? []), userMsg];
      chats.addMessages(chatId, [userMsg, bot]);
      const recentCrisis = history.slice(-6).some((m) => m.role === "user" && m.crisis);
      run(chatId, bot.id, history, recentCrisis);
    },
    [gen, ready, chats, active, run]
  );

  const regenerate = useCallback(() => {
    if (!active || gen || !ready) return;
    const lastMsg = active.messages[active.messages.length - 1];
    if (lastMsg?.role !== "assistant" || lastMsg.owner) return;
    const history = active.messages.slice(0, -1);
    if (!history.some((m) => m.role === "user")) return;

    chats.dropMessage(active.id, lastMsg.id);
    const bot = { id: uid(), role: "assistant", content: "", ts: Date.now(), streaming: true, ...(lastMsg.crisis && { crisis: true }) };
    chats.addMessages(active.id, [bot]);
    stick.current = true;
    run(active.id, bot.id, history, history.slice(-6).some((m) => m.role === "user" && m.crisis));
  }, [active, gen, ready, chats, run]);

  /* ---------- small handlers ---------- */
  const focusComposer = () => setFocusSignal((n) => n + 1);

  const newChat = useCallback(() => {
    chatNew();
    setDraft("");
    setSidebarOpen(false);
    setFocusSignal((n) => n + 1);
  }, [chatNew]);

  const selectChat = useCallback(
    (id) => {
      chatSelect(id);
      setSidebarOpen(false);
    },
    [chatSelect]
  );

  const stopGeneration = kevin.stop;
  const deleteChat = useCallback(
    (id) => {
      if (gen?.chatId === id) stopGeneration();
      chatDelete(id);
    },
    [gen, stopGeneration, chatDelete]
  );

  const pickMood = (text) => {
    setDraft(text);
    focusComposer();
  };

  const exportChat = () => {
    if (active) downloadText(`kevin-${slug(active.title)}.md`, chatToMarkdown(active));
  };

  const closeSettings = useCallback(() => setShowSettings(false), []);
  const closeBreathing = useCallback(() => setShowBreathing(false), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);

  const lastIsBot = last?.role === "assistant" && !last.owner && !gen;

  return (
    <div className="app">
      <Sidebar
        chats={chats.chats}
        activeId={active?.id}
        open={sidebarOpen}
        saveChats={settings.saveChats}
        onNew={newChat}
        onSelect={selectChat}
        onDelete={deleteChat}
        onClose={closeSidebar}
      />

      <div className="stage">
        <TopBar
          title={isEmpty ? "New conversation" : active.title}
          kevin={kevin}
          hasMessages={!isEmpty}
          onMenu={openSidebar}
          onBreathe={() => setShowBreathing(true)}
          onExport={exportChat}
          onSettings={() => setShowSettings(true)}
        />

        <main className="scroll" ref={scroller} onScroll={onScroll}>
          <div className="column">
            {isEmpty ? (
              <Welcome kevin={kevin} onPickMood={pickMood} onBreathe={() => setShowBreathing(true)} />
            ) : (
              <div className="thread" role="log" aria-live="polite" aria-label="Conversation">
                {messages.map((m, i) => (
                  <Message
                    key={m.id}
                    message={m}
                    canRegenerate={lastIsBot && i === messages.length - 1}
                    onRegenerate={i === messages.length - 1 ? regenerate : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </main>

        {showJump && (
          <button type="button" className="jump" onClick={() => scrollDown(true)} aria-label="Jump to latest message">
            <Icon name="down" size={16} />
          </button>
        )}

        <div className="dock">
          <div className="column">
            {!isEmpty && !ready && <ModelGate kevin={kevin} compact />}
            <Composer
              value={draft}
              onChange={setDraft}
              onSend={send}
              onStop={stopGeneration}
              ready={ready}
              generating={!!gen}
              focusSignal={focusSignal}
            />
            {!isEmpty && <p className="dock-note">K.E.V.I.N is an AI, not a therapist or emergency service. It can make mistakes.</p>}
          </div>
        </div>
      </div>

      {showSettings && (
        <Settings
          settings={settings}
          update={updateSettings}
          onDevicePreferenceChange={handleDevicePreferenceChange}
          onClose={closeSettings}
          onDeleteAll={chats.clearAll}
          chatCount={chats.chats.length}
        />
      )}
      {showBreathing && <Breathing onClose={closeBreathing} />}
    </div>
  );
}
