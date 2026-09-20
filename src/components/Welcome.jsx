import { MOODS } from "../config.js";
import { greeting } from "../lib/format.js";
import Lantern from "./Lantern.jsx";
import ModelGate from "./ModelGate.jsx";
import Icon from "./Icon.jsx";
import About from "./About.jsx";

export default function Welcome({ kevin, onPickMood, onBreathe }) {
  return (
    <section className="welcome">
      <h1 className="sr-only">K.E.V.I.N — a private emotional-support AI chat that runs in your browser</h1>
      <button type="button" className="welcome-lantern" onClick={onBreathe} aria-label="Open the breathing exercise">
        <Lantern size={120} breathing />
      </button>
      <p className="welcome-title">{greeting()}</p>
      <p className="welcome-sub">This is a quiet place to talk. What's on your mind?</p>

      <ModelGate kevin={kevin} />

      <div className="moods" role="group" aria-label="How are you arriving today?">
        <p className="moods-label">How are you arriving today?</p>
        <div className="moods-list">
          {MOODS.map((m) => (
            <button key={m.key} type="button" className="chip" onClick={() => onPickMood(m.text)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="link-btn" onClick={onBreathe}>
        <Icon name="breath" size={16} /> Take a minute to breathe first
      </button>

      <p className="welcome-fineprint">
        K.E.V.I.N is an AI, not a person, therapist or emergency service. If you are in danger or thinking about harming yourself, contact
        your local emergency number or a crisis line right away.
      </p>

      <About />
    </section>
  );
}
