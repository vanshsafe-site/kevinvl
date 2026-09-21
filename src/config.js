export const MODEL_ID = "HuggingFaceTB/SmolLM2-360M-Instruct";
export const MODEL_LABEL = "SmolLM2 360M";
export const OWNER_REPLY = "K.E.V.I.N's owner is Vansh Garg.";

/** Shown when a message looks like it may involve self-harm or danger. Edit for your audience. */
export const CRISIS_RESOURCES = [
  { region: "India", name: "Tele-MANAS", contact: "14416 or 1-800-891-4416" },
  { region: "United States", name: "988 Suicide & Crisis Lifeline", contact: "Call or text 988" },
  { region: "UK & Ireland", name: "Samaritans", contact: "116 123" },
  { region: "Anywhere else", name: "Find a helpline", contact: "findahelpline.com", href: "https://findahelpline.com" },
];
export const EMERGENCY_NUMBERS = "112 (India / EU) · 911 (US) · 999 (UK)";

const BASE_PROMPT = `You are K.E.V.I.N, which stands for "Keeping Every Voice in Need".

You are a warm, patient, emotionally supportive AI companion. Listen carefully and respond with empathy, validation, and gentle encouragement. Use natural, calm, non-judgmental language. Ask a gentle follow-up question when useful. Keep responses manageable when someone is distressed.

You are not a human, therapist, doctor, or emergency service. Never claim professional credentials or promise more privacy than the application actually provides.

If someone expresses immediate danger or intent to seriously hurt themselves or someone else, respond supportively and encourage contacting local emergency services or a trusted person who can be physically present. Do not provide instructions for self-harm or violence.

If asked who owns or created you, answer exactly:
"${OWNER_REPLY}"

Do not invent additional ownership information.`;

export const STYLES = {
  gentle: {
    label: "Gentle listener",
    hint: "Reflects feelings and asks softly.",
    prompt: "Style: mostly listen and reflect back what you hear. Offer at most one gentle question.",
  },
  practical: {
    label: "Practical friend",
    hint: "Adds one small, doable next step.",
    prompt:
      "Style: after acknowledging the feeling, offer one small, concrete coping step (such as a grounding exercise, a short walk, or writing things down). Never lecture.",
  },
  brief: {
    label: "Short and calm",
    hint: "Two or three sentences at most.",
    prompt: "Style: reply in two or three short sentences. Be calm and kind.",
  },
};

export const CRISIS_ADDENDUM = `IMPORTANT: The person may be in serious distress or danger. Respond with calm, direct care. Tell them you are glad they said something, encourage them to contact local emergency services or a crisis line right now, and to reach out to someone who can be physically with them. Do not give any instructions for self-harm. Keep it short and steady.`;

export function buildSystemPrompt(styleKey, crisis) {
  const style = STYLES[styleKey] ?? STYLES.gentle;
  return [BASE_PROMPT, style.prompt, crisis ? CRISIS_ADDENDUM : ""].filter(Boolean).join("\n\n");
}

export const DEFAULT_SETTINGS = {
  theme: "dark",
  style: "gentle",
  temperature: 0.7,
  maxNewTokens: 256,
  contextMessages: 12,
  saveChats: true,
  autoLoad: false,
  preferredDevice: "gpu",
};

export const MOODS = [
  { key: "low", label: "Low", text: "I've been feeling really low lately and I'm not sure why." },
  { key: "anxious", label: "Anxious", text: "My mind won't stop racing and I feel anxious." },
  { key: "stressed", label: "Overwhelmed", text: "I feel overwhelmed by everything I have to do." },
  { key: "lonely", label: "Lonely", text: "I've been feeling lonely and I just want someone to talk to." },
  { key: "numb", label: "Numb", text: "I feel kind of numb and disconnected today." },
  { key: "okay", label: "Okay, just chatting", text: "I'm doing okay today, I just wanted to talk." },
];

export const BREATHING_PATTERNS = [
  {
    key: "box",
    label: "Box",
    note: "Box breathing: steady and grounding. 4 in, 4 hold, 4 out, 4 hold.",
    steps: [
      { label: "Breathe in", secs: 4, scale: 1 },
      { label: "Hold", secs: 4, scale: 1 },
      { label: "Breathe out", secs: 4, scale: 0.55 },
      { label: "Hold", secs: 4, scale: 0.55 },
    ],
  },
  {
    key: "478",
    label: "4-7-8",
    note: "4-7-8 breathing: a long exhale to help you wind down.",
    steps: [
      { label: "Breathe in", secs: 4, scale: 1 },
      { label: "Hold", secs: 7, scale: 1 },
      { label: "Breathe out", secs: 8, scale: 0.55 },
    ],
  },
  {
    key: "calm",
    label: "Even",
    note: "Even breathing: 5 seconds in, 5 seconds out. Easy to start with.",
    steps: [
      { label: "Breathe in", secs: 5, scale: 1 },
      { label: "Breathe out", secs: 5, scale: 0.55 },
    ],
  },
];
