import Icon from "./Icon.jsx";

const PHASE_LABEL = {
  idle: "Asleep",
  checking: "Waking up…",
  loading: "Waking up…",
  ready: "Ready",
  error: "Couldn't start",
};

export default function TopBar({ title, kevin, hasMessages, onMenu, onBreathe, onExport, onSettings, onStart }) {
  const { phase, device, tps, load } = kevin;
  const label =
    phase === "ready"
      ? `Ready · ${device === "webgpu" ? "GPU" : "CPU"}${tps ? ` · ${tps.toFixed(0)} tok/s` : ""}`
      : PHASE_LABEL[phase];

  return (
    <header className="topbar">
      <button type="button" className="icon-btn menu-btn" onClick={onMenu} aria-label="Open conversations">
        <Icon name="menu" />
      </button>
      <div className="topbar-title">{title}</div>

      <div className="topbar-actions">
        <button
          type="button"
          className={`status status-${phase}`}
          onClick={phase === "idle" || phase === "error" ? (onStart ?? load) : undefined}
          disabled={phase !== "idle" && phase !== "error"}
          title={phase === "idle" || phase === "error" ? "Start K.E.V.I.N" : undefined}
        >
          <span className="status-dot" />
          {label}
        </button>
        <button type="button" className="icon-btn" onClick={onBreathe} aria-label="Breathing exercise" title="Breathing exercise">
          <Icon name="breath" />
        </button>
        <button type="button" className="icon-btn" onClick={onExport} disabled={!hasMessages} aria-label="Export conversation" title="Export conversation">
          <Icon name="download" />
        </button>
        <button type="button" className="icon-btn" onClick={onSettings} aria-label="Settings" title="Settings">
          <Icon name="sliders" />
        </button>
      </div>
    </header>
  );
}
