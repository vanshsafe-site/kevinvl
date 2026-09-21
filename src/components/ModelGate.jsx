import { MODEL_LABEL } from "../config.js";

/** Explains the model download and shows load progress / errors. */
export default function ModelGate({ kevin, compact = false, onStart }) {
  const { phase, progress, text, detail, error, load } = kevin;
  if (phase === "ready") return null;

  const busy = phase === "checking" || phase === "loading";
  const pct = Math.round(progress);

  return (
    <div className={`gate ${compact ? "gate-compact" : ""}`} aria-live="polite">
      {!busy && (
        <>
          <p className="gate-copy">
            {phase === "error"
              ? "K.E.V.I.N couldn't start."
              : compact
              ? "K.E.V.I.N is asleep. Start it to continue this conversation."
              : `K.E.V.I.N runs entirely on your device using ${MODEL_LABEL}. The first start downloads a few hundred MB; after that it opens from your browser's cache.`}
          </p>
          {phase === "error" && <p className="gate-error">{error}</p>}
          <button type="button" className="btn btn-primary" onClick={onStart ?? load}>
            {phase === "error" ? "Try again" : "Start K.E.V.I.N"}
          </button>
          {phase === "error" && (
            <p className="gate-tip">
              If this keeps happening, check your connection, disable extensions that block huggingface.co or jsdelivr.net, or clear this
              site's data and reload.
            </p>
          )}
        </>
      )}

      {busy && (
        <div className="gate-progress">
          <div className="gate-row">
            <span>{text}</span>
            <span className="tnum">{phase === "loading" ? `${pct}%` : ""}</span>
          </div>
          <div
            className="track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label="Model download progress"
          >
            <div className="track-bar" style={{ width: `${pct}%` }} />
          </div>
          <small>{detail || "Nothing you type is sent anywhere. Only the model files are downloaded."}</small>
        </div>
      )}
    </div>
  );
}
