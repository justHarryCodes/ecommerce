"use client";

// Client-side resize/recompress before upload — runs in the browser via
// <canvas>, purely so a multi-MB phone photo never leaves the browser at
// full size. Cuts bandwidth three times over: the visitor's upload, our
// server's incoming request, and our server's re-upload to Cloudinary.
const MAX_DIMENSION = 1600;
const QUALITY = 0.82;
const SKIP_BELOW_BYTES = 200 * 1024; // already small enough — compressing would only cost time

export async function compressImage(
  file: File,
  maxDim = MAX_DIMENSION,
  quality = QUALITY
): Promise<File> {
  // SVGs aren't helped by canvas re-encoding. Everything else is worth
  // *attempting* even when the browser reports no/an odd MIME type — many
  // phone photos (HEIC especially) come through with file.type === "" or
  // something unexpected, and skipping compression on those is exactly how
  // an uncompressed multi-MB original used to slip through. createImageBitmap
  // below still fails safely (falls back to the original) if it truly can't
  // decode the file.
  if (file.type === "image/svg+xml") return file;
  if (file.size < SKIP_BELOW_BYTES) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    // Only use the compressed version if it's actually smaller — a tiny/
    // already-optimized source can re-encode larger than the original.
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", {
      type: "image/jpeg",
    });
  } catch {
    // Any failure (unsupported source format, browser quirk, etc.) — just
    // upload the original rather than block the admin.
    return file;
  }
}
