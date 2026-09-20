import { useEffect, useRef } from "react";
import Icon from "./Icon.jsx";

export default function Composer({ value, onChange, onSend, onStop, ready, generating, focusSignal }) {
  const ref = useRef(null);

  // Auto-grow.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [value]);

  useEffect(() => {
    if (focusSignal) ref.current?.focus();
  }, [focusSignal]);

  const canSend = ready && !generating && value.trim().length > 0;

  const submit = (e) => {
    e.preventDefault();
    if (canSend) onSend(value);
  };

  return (
    <form className="composer" onSubmit={submit}>
      <label className="sr-only" htmlFor="message">
        Message to K.E.V.I.N
      </label>
      <textarea
        id="message"
        ref={ref}
        rows={1}
        value={value}
        maxLength={4000}
        placeholder={ready ? "Say what's on your mind…" : "You can start typing while K.E.V.I.N wakes up…"}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (canSend) onSend(value);
          }
        }}
      />
      {generating ? (
        <button type="button" className="send send-stop" onClick={onStop} aria-label="Stop reply" title="Stop">
          <Icon name="stop" size={16} />
        </button>
      ) : (
        <button type="submit" className="send" disabled={!canSend} aria-label="Send message" title={ready ? "Send" : "Start K.E.V.I.N first"}>
          <Icon name="send" size={18} />
        </button>
      )}
    </form>
  );
}
