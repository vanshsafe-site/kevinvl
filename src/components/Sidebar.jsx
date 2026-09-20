import { memo, useEffect, useState } from "react";
import { relativeDay } from "../lib/format.js";
import Icon from "./Icon.jsx";
import Lantern from "./Lantern.jsx";

function ChatItem({ chat, active, onSelect, onDelete }) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(t);
  }, [confirming]);

  return (
    <li className={`chat-item ${active ? "is-active" : ""}`}>
      <button type="button" className="chat-open" onClick={() => onSelect(chat.id)} aria-current={active ? "true" : undefined}>
        <span className="chat-title">{chat.title}</span>
      </button>
      <button
        type="button"
        className={`icon-btn sm chat-del ${confirming ? "is-confirm" : ""}`}
        onClick={() => (confirming ? onDelete(chat.id) : setConfirming(true))}
        aria-label={confirming ? `Confirm delete ${chat.title}` : `Delete ${chat.title}`}
        title={confirming ? "Click again to delete" : "Delete"}
      >
        {confirming ? <span className="confirm-text">Delete?</span> : <Icon name="trash" size={15} />}
      </button>
    </li>
  );
}

function Sidebar({ chats, activeId, open, saveChats, onNew, onSelect, onDelete, onClose }) {
  const groups = [];
  for (const chat of [...chats].sort((a, b) => b.updatedAt - a.updatedAt)) {
    const label = relativeDay(chat.updatedAt);
    const g = groups.find((x) => x.label === label);
    g ? g.items.push(chat) : groups.push({ label, items: [chat] });
  }

  return (
    <>
      <div className={`scrim ${open ? "is-open" : ""}`} onClick={onClose} aria-hidden="true" />
      <aside className={`sidebar ${open ? "is-open" : ""}`} aria-label="Conversations">
        <div className="side-head">
          <div className="brand">
            <Lantern size={26} />
            <div>
              <div className="brand-name">K.E.V.I.N</div>
              <div className="brand-tag">Keeping Every Voice in Need</div>
            </div>
          </div>
          <button type="button" className="icon-btn side-close" onClick={onClose} aria-label="Close menu">
            <Icon name="x" />
          </button>
        </div>

        <button type="button" className="btn btn-new" onClick={onNew}>
          <Icon name="plus" size={16} /> New conversation
        </button>

        <nav className="side-list">
          {groups.length === 0 && <p className="side-empty">Your conversations will appear here.</p>}
          {groups.map((g) => (
            <section key={g.label}>
              <h2 className="side-group">{g.label}</h2>
              <ul>
                {g.items.map((c) => (
                  <ChatItem key={c.id} chat={c} active={c.id === activeId} onSelect={onSelect} onDelete={onDelete} />
                ))}
              </ul>
            </section>
          ))}
        </nav>

        <p className="side-foot">
          {saveChats
            ? "Conversations are saved only on this device. Nothing is uploaded."
            : "Saving is off. Conversations disappear when you close this tab."}
        </p>
      </aside>
    </>
  );
}

export default memo(Sidebar);
