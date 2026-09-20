// A deliberately simple, transparent check. It never blocks a message and is not a
// diagnosis — it only decides whether to show crisis resources next to K.E.V.I.N's reply.
const PATTERNS = [
  /\bkill(ing)?\s+(my\s?self|me)\b/i,
  /\bsuicid(e|al)\b/i,
  /\bend(ing)?\s+my\s+life\b/i,
  /\b(want|wanna|going|plan(ning)?)\s+(to\s+)?die\b/i,
  /\bdon'?t\s+want\s+to\s+(live|be\s+alive|be\s+here|exist)\b/i,
  /\bbetter\s+off\s+(dead|without\s+me)\b/i,
  /\b(hurt|harm|cut|cutting)\s+(my\s?self|me)\b/i,
  /\bself[-\s]?harm\b/i,
  /\bno\s+reason\s+to\s+(live|go\s+on)\b/i,
  /\b(hurt|kill)\s+(someone|somebody|him|her|them|people)\b/i,
];

export function detectCrisis(text) {
  return PATTERNS.some((re) => re.test(text || ""));
}

const OWNER_RE =
  /\b(who\s+(is\s+)?(your\s+)?(owner|creator|maker|developer)|who\s+(owns|created|made|built|developed)\s+you|owned\s+by|your\s+(owner|creator))\b/i;

export function isOwnerQuestion(text) {
  return OWNER_RE.test(text || "");
}
