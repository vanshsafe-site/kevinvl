// Regenerates the social image and app icons from SVG:  npm run icons
const sharp = require("sharp");
const path = require("path");
const out = (f) => path.join(__dirname, "..", "public", f);

const lantern = (cx, cy, r) => `
  <defs>
    <radialGradient id="l" cx="50%" cy="38%" r="62%">
      <stop offset="0" stop-color="#fff3d2"/><stop offset="0.42" stop-color="#f2bf6b"/><stop offset="1" stop-color="#e3903a"/>
    </radialGradient>
    <radialGradient id="g" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#f2bf6b" stop-opacity="0.45"/><stop offset="1" stop-color="#f2bf6b" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="${cx}" cy="${cy}" r="${r * 2.6}" fill="url(#g)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#l)"/>`;

const icon = (size, scale = 0.27, rounded = true) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${rounded ? size * 0.22 : 0}" fill="#0d1220"/>
  ${lantern(size / 2, size / 2, size * scale)}
</svg>`;

const og = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0d1220"/>
  ${lantern(300, 315, 120)}
  <g font-family="Georgia, 'Iowan Old Style', 'DejaVu Serif', serif" fill="#e8ebf7">
    <text x="520" y="290" font-size="104" font-weight="600" letter-spacing="2">K.E.V.I.N</text>
    <text x="524" y="352" font-size="36" fill="#f2bf6b">Keeping Every Voice in Need</text>
  </g>
  <g font-family="Helvetica, Arial, 'DejaVu Sans', sans-serif" fill="#98a2c3" font-size="30">
    <text x="524" y="430">A private emotional-support chat that</text>
    <text x="524" y="472">runs entirely in your browser.</text>
  </g>
</svg>`;

(async () => {
  await sharp(Buffer.from(og)).png().toFile(out("og-image.png"));
  await sharp(Buffer.from(icon(512))).png().toFile(out("icon-512.png"));
  await sharp(Buffer.from(icon(512))).resize(192, 192).png().toFile(out("icon-192.png"));
  await sharp(Buffer.from(icon(512, 0.2, false))).png().toFile(out("icon-maskable-512.png"));
  await sharp(Buffer.from(icon(512, 0.27, false))).resize(180, 180).png().toFile(out("apple-touch-icon.png"));
  await sharp(Buffer.from(icon(512))).resize(32, 32).png().toFile(out("favicon-32.png"));
  console.log("Icons and social image written to public/");
})();
