"use client";

import { compressImage } from "./image-compress";

// Hard ceiling on what we'll actually send over the wire, well under the
// request-body limits serverless hosts (Vercel et al.) enforce. If an image
// is still over this after compression (compression failed, or it's an
// unusually dense image), we stop and say so — rather than letting the
// platform silently reject the request with an HTML error page that then
// fails to parse as JSON on the client (the "unexpected token/type" class
// of error this replaces).
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

// Shared upload path for every image field in the dashboard (product
// photos, blog/project/service covers, etc.) — compresses client-side,
// posts to /api/upload, and safely handles a non-JSON response instead of
// throwing a cryptic parse error.
export async function uploadImage(file: File): Promise<string> {
  const compressed = await compressImage(file);
  if (compressed.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      "This image is too large even after compression — try a smaller photo."
    );
  }

  const fd = new FormData();
  fd.append("file", compressed);
  const res = await fetch("/api/upload", { method: "POST", body: fd });

  // A platform- or proxy-level rejection (request too large, gateway
  // error, etc.) returns an HTML/plain-text error page, not JSON — never
  // blindly call res.json() on that.
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      res.status === 413
        ? "Image is too large for the server to accept. Try a smaller photo."
        : `Upload failed (server returned an unexpected response, HTTP ${res.status}). Please try again.`
    );
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.url as string;
}
