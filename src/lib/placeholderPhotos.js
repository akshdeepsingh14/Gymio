// Plain gradient pictures with a label, drawn as SVG. They stand in for real gym
// photos in the demo data, so no image files or internet are needed.
// The label must be plain text (no < > or &).

export function makePlaceholder(label, from, to) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>` +
    `</linearGradient></defs>` +
    `<rect width="800" height="600" fill="url(#g)"/>` +
    `<text x="40" y="548" font-family="Arial, sans-serif" font-size="44" font-weight="700" fill="#ffffff" fill-opacity="0.88">${label}</text>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}