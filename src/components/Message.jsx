import { memo, useState } from "react";
import { CRISIS_RESOURCES, EMERGENCY_NUMBERS } from "../config.js";
import { timeLabel } from "../lib/format.js";
import Icon from "./Icon.jsx";
import Lantern from "./Lantern.jsx";

/* ---------- tiny, safe markdown (bold, italic, code, lists) ---------- */
const INLINE = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g;

function inline(text) {
  return text.split(INLINE).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) return <code key={i}>{part.slice(1, -1)}</code>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

const BULLET = /^\s*[-*•]\s+/;
const NUMBER = /^\s*\d+[.)]\s+/;

function RichText({ text }) {
  const blocks = text.replace(/\r/g, "").split(/\n{2,}/).filter((b) => b.trim());
  return blocks.map((block, i) => {
    const lines = block.split("\n").filter((l) => l.trim());
    if (lines.length && lines.every((l) => BULLET.test(l)))
      return (
        <ul key={i}>
          {lines.map((l, j) => (
            <li key={j}>{inline(l.replace(BULLET, ""))}</li>
          ))}
        </ul>
      );
    if (lines.length && lines.every((l) => NUMBER.test(l)))
      return (
        <ol key={i}>
          {lines.map((l, j) => (
            <li key={j}>{inline(l.replace(NUMBER, ""))}</li>
          ))}
        </ol>
      );
    return (
      <p key={i}>
        {lines.map((l, j) => (
          <span key={j}>
            {j > 0 && <br />}
            {inline(l.replace(/^#{1,6}\s+/, ""))}
          </span>
        ))}
      </p>
    );
  });
}

function CrisisCard() {
  return (
    <aside className="crisis" role="note" aria-label="Support resources">
      <div className="crisis-head">
        <Icon name="phone" size={16} />
        <strong>If you might be in danger, please reach out now</strong>
      </div>
      <p>
        Emergency services: <b>{EMERGENCY_NUMBERS}</b>. If you can, tell someone who can be physically with you.
      </p>
      <ul>
        {CRISIS_RESOURCES.map((r) => (
          <li key={r.name}>
            <span className="crisis-region">{r.region}</span>
            <span>
              {r.name}:{" "}
              {r.href ? (
                <a href={r.href} target="_blank" rel="noreferrer noopener">
                  {r.contact}
                </a>
              ) : (
                <b>{r.contact}</b>
              )}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function Message({ message, canRegenerate, onRegenerate }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked */
    }
  };

  if (isUser) {
    return (
      <article className="msg msg-user" aria-label="You said">
        <div className="bubble">{message.content}</div>
        <time className="msg-time" dateTime={new Date(message.ts).toISOString()}>
          {timeLabel(message.ts)}
        </time>
      </article>
    );
  }

  const waiting = message.streaming && !message.content;

  return (
    <article className="msg msg-bot" aria-label="K.E.V.I.N said">
      <Lantern size={22} alive={message.streaming} className="msg-mark" />
      <div className="msg-main">
        {waiting ? (
          <div className="typing" aria-label="K.E.V.I.N is thinking">
            <i />
            <i />
            <i />
          </div>
        ) : (
          <div className="prose">
            <RichText text={message.content} />
            {message.streaming && <span className="caret" aria-hidden="true" />}
          </div>
        )}

        {message.error && <p className="msg-error">Something went wrong: {message.error}</p>}
        {message.crisis && <CrisisCard />}

        {!message.streaming && (
          <div className="msg-actions">
            <time className="msg-time" dateTime={new Date(message.ts).toISOString()}>
              {timeLabel(message.ts)}
              {message.stopped ? " · stopped" : ""}
            </time>
            <button type="button" className="icon-btn sm" onClick={copy} aria-label={copied ? "Copied" : "Copy reply"} title="Copy">
              <Icon name={copied ? "check" : "copy"} size={15} />
            </button>
            {canRegenerate && (
              <button type="button" className="icon-btn sm" onClick={onRegenerate} aria-label="Try another reply" title="Try another reply">
                <Icon name="refresh" size={15} />
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default memo(Message);
