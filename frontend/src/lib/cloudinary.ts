// ---------------------------------------------------------------------------
// Cloudinary unsigned upload helper
// ---------------------------------------------------------------------------
// Uses unsigned upload preset configured in Cloudinary dashboard.
// Set these env vars in .env:
//   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
//   VITE_CLOUDINARY_UPLOAD_PRESET=skill_mentor_unsigned
// ---------------------------------------------------------------------------

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? "";
const UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? "skill_mentor_unsigned";

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  width?: number;
  height?: number;
}

/**
 * Uploads a file to Cloudinary using an unsigned upload preset.
 * Works directly from the browser – no backend proxy required.
 */
export async function uploadToCloudinary(
  file: File,
): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME) {
    throw new Error(
      "Cloudinary cloud name is not configured. Set VITE_CLOUDINARY_CLOUD_NAME in .env",
    );
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "skill-mentor/receipts");

  const res = await fetch(url, { method: "POST", body: formData });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Cloudinary upload failed: ${body}`);
  }

  return res.json();
}
