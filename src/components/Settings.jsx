import { useEffect, useRef, useState } from "react";
import { STYLES } from "../config.js";
import Icon from "./Icon.jsx";

function Toggle({ id, checked, onChange, label, hint }) {
  return (
    <label className="toggle" htmlFor={id}>
      <span className="toggle-text">
        <span>{label}</span>
        {hint && <small>{hint}</small>}
      </span>
      <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch" aria-hidden="true" />
    </label>
  );
}

function Range({ id, label, value, min, max, step, onChange, format, hint }) {
  return (
    <div className="field">
      <div className="field-row">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} className="tnum">
          {format ? format(value) : value}
        </output>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      {hint && <small>{hint}</small>}
    </div>
  );
}

export default function Settings({ settings, update, onDevicePreferenceChange, onClose, onDeleteAll, chatCount }) {
  const [confirm, setConfirm] = useState(false);
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="overlay overlay-right" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="drawer-head">
          <h2 id="settings-title">Settings</h2>
          <button ref={closeRef} type="button" className="icon-btn" onClick={onClose} aria-label="Close settings">
            <Icon name="x" />
          </button>
        </div>

        <div className="drawer-body">
          <fieldset className="group">
            <legend>Appearance</legend>
            <div className="seg" role="radiogroup" aria-label="Theme">
              {["dark", "light", "system"].map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={settings.theme === t}
                  className={`seg-btn ${settings.theme === t ? "is-on" : ""}`}
                  onClick={() => update({ theme: t })}
                >
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="group">
            <legend>How K.E.V.I.N replies</legend>
            {Object.entries(STYLES).map(([key, s]) => (
              <label key={key} className={`radio ${settings.style === key ? "is-on" : ""}`}>
                <input type="radio" name="style" value={key} checked={settings.style === key} onChange={() => update({ style: key })} />
                <span>
                  <b>{s.label}</b>
                  <small>{s.hint}</small>
                </span>
              </label>
            ))}
            <Range
              id="len"
              label="Reply length"
              min={64}
              max={512}
              step={32}
              value={settings.maxNewTokens}
              onChange={(v) => update({ maxNewTokens: v })}
              format={(v) => (v <= 128 ? "Short" : v <= 288 ? "Medium" : "Long")}
              hint="The most K.E.V.I.N will write in one reply."
            />
            <Range
              id="temp"
              label="Variety"
              min={0.2}
              max={1}
              step={0.1}
              value={settings.temperature}
              onChange={(v) => update({ temperature: Math.round(v * 10) / 10 })}
              format={(v) => (v < 0.5 ? "Steady" : v < 0.8 ? "Balanced" : "Free-flowing")}
              hint="Lower is more predictable. Higher is more varied."
            />
            <Range
              id="ctx"
              label="Conversation memory"
              min={4}
              max={24}
              step={2}
              value={settings.contextMessages}
              onChange={(v) => update({ contextMessages: v })}
              format={(v) => `Last ${v} messages`}
              hint="This is a small model. Remembering fewer messages keeps replies faster and more focused."
            />
          </fieldset>

          <fieldset className="group">
            <legend>Processing</legend>
            <div className="seg" role="radiogroup" aria-label="Model processor">
              {[
                { key: "auto", label: "Auto" },
                { key: "gpu", label: "GPU" },
                { key: "cpu", label: "CPU" },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  role="radio"
                  aria-checked={settings.preferredDevice === option.key}
                  className={`seg-btn ${settings.preferredDevice === option.key ? "is-on" : ""}`}
                  onClick={() => onDevicePreferenceChange(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="group">
            <legend>Privacy and startup</legend>
            <Toggle
              id="save"
              checked={settings.saveChats}
              onChange={(v) => update({ saveChats: v })}
              label="Save conversations on this device"
              hint="Turn off to keep chats in memory only. Turning it off also erases what is saved."
            />
            <Toggle
              id="auto"
              checked={settings.autoLoad}
              onChange={(v) => update({ autoLoad: v })}
              label="Start K.E.V.I.N automatically"
              hint="Loads the model when the app opens. Best once it has been downloaded."
            />
          </fieldset>

          <fieldset className="group">
            <legend>Your data</legend>
            {!confirm ? (
              <button type="button" className="btn btn-danger" disabled={chatCount === 0} onClick={() => setConfirm(true)}>
                <Icon name="trash" size={16} /> Delete all conversations
              </button>
            ) : (
              <div className="confirm-box">
                <p>Delete all {chatCount} conversation{chatCount === 1 ? "" : "s"} from this device? This can't be undone.</p>
                <div className="row">
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      onDeleteAll();
                      setConfirm(false);
                    }}
                  >
                    Delete everything
                  </button>
                  <button type="button" className="btn" onClick={() => setConfirm(false)}>
                    Keep them
                  </button>
                </div>
              </div>
            )}
          </fieldset>
        </div>
      </aside>
    </div>
  );
}
