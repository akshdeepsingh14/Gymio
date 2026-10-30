// Shrinks a chosen photo in the browser before it is saved, so the demo's
// storage is not filled by a single phone picture. DEMO ONLY: the backend phase
// uploads the original to an image storage service instead.

const MAX_CHARS = 300_000; // about 220 KB of image data

function draw(bitmap, maxSide, quality) {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff"; // JPEG has no transparency, so a see-through PNG would turn black
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * Returns a JPEG data URL. Throws if the browser cannot read the file.
 * `maxSide` is the longest edge in pixels (logos and profile photos use a smaller value).
 */
export async function resizeImage(file, { maxSide = 800 } = {}) {
  const bitmap = await createImageBitmap(file);
  try {
    let result = draw(bitmap, maxSide, 0.72);
    if (result.length > MAX_CHARS) result = draw(bitmap, Math.round(maxSide * 0.75), 0.6);
    return result;
  } finally {
    bitmap.close?.();
  }
}