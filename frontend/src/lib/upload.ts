// ---------------------------------------------------------------------------
// Local file upload helper — posts multipart to the backend
// ---------------------------------------------------------------------------
import api from "@/lib/api";

export interface UploadResult {
  url: string;
}

/**
 * Uploads a file to the backend's /api/upload/receipt endpoint.
 * The file is stored under uploads/receipts/ and served as a static asset.
 */
export async function uploadFile(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);

  const response = await api.post<{ url: string }>(
    "/api/upload/receipt",
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return { url: response.data.url };
}
