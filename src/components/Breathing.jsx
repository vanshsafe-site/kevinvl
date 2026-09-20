import { useEffect, useRef, useState } from "react";
import { BREATHING_PATTERNS } from "../config.js";
import Icon from "./Icon.jsx";

export default function Breathing({ onClose }) {
  const [patternKey, setPatternKey] = useState(BREATHING_PATTERNS[0].key);
  const [running, setRunning] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [cycles, setCycles] = useState(0);
  const closeRef = useRef(null);

  const pattern = BREATHING_PATTERNS.find((p) => p.key === patternKey);
  const step = pattern.steps[stepIdx];

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!running) return;
    setRemaining(step.secs);
    const tick = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    const next = setTimeout(() => {
      if (stepIdx === pattern.steps.length - 1) setCycles((c) => c + 1);
      setStepIdx((stepIdx + 1) % pattern.steps.length);
    }, step.secs * 1000);
    return () => {
      clearInterval(tick);
      clearTimeout(next);
    };
  }, [running, stepIdx, pattern, step.secs]);

  const choose = (key) => {
    setPatternKey(key);
    setRunning(false);
    setStepIdx(0);
    setCycles(0);
  };

  const toggle = () => {
    if (running) {
      setRunning(false);
      setStepIdx(0);
    } else {
      setStepIdx(0);
      setRunning(true);
    }
  };

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal breathe" role="dialog" aria-modal="true" aria-labelledby="breathe-title">
        <button ref={closeRef} type="button" className="icon-btn modal-close" onClick={onClose} aria-label="Close">
          <Icon name="x" />
        </button>

        <h2 id="breathe-title" className="modal-title">
          Breathe with me
        </h2>
        <p className="modal-note">{pattern.note}</p>

        <div className="orb-wrap" aria-live="polite">
          <div
            className="orb"
            style={{
              transform: `scale(${running ? step.scale : 0.55})`,
              transitionDuration: running ? `${step.secs}s` : "0.8s",
            }}
          />
          <div className="orb-text">
            <span className="orb-label">{running ? step.label : "Ready when you are"}</span>
            {running && <span className="orb-count tnum">{remaining}</span>}
          </div>
        </div>

        <div className="seg" role="radiogroup" aria-label="Breathing pattern">
          {BREATHING_PATTERNS.map((p) => (
            <button
              key={p.key}
              type="button"
              role="radio"
              aria-checked={p.key === patternKey}
              className={`seg-btn ${p.key === patternKey ? "is-on" : ""}`}
              onClick={() => choose(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="modal-foot">
          <button type="button" className="btn btn-primary" onClick={toggle}>
            {running ? "Stop" : "Begin"}
          </button>
          <span className="modal-count tnum">{cycles > 0 ? `${cycles} ${cycles === 1 ? "round" : "rounds"} complete` : ""}</span>
        </div>
      </div>
    </div>
  );
}
