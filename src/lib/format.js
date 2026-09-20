export function uid() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 5) return "Still up?";
  if (h < 12) return "Good morning.";
  if (h < 17) return "Good afternoon.";
  if (h < 22) return "Good evening.";
  return "It's late.";
}

export function timeLabel(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function relativeDay(ts) {
  const today = new Date(new Date().toDateString());
  const day = new Date(new Date(ts).toDateString());
  const diff = Math.round((today - day) / 86400000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return "This week";
  return "Earlier";
}

export function chatToMarkdown(chat) {
  const lines = [`# ${chat.title}`, `_Exported from K.E.V.I.N on ${new Date().toLocaleString()}_`, ""];
  for (const m of chat.messages) {
    lines.push(`**${m.role === "user" ? "You" : "K.E.V.I.N"}** (${timeLabel(m.ts)})`, "", m.content, "");
  }
  return lines.join("\n");
}

export function downloadText(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slug(s) {
  return (s || "conversation").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "conversation";
}
