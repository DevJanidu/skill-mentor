// ---------------------------------------------------------------------------
// Receipt upload helper — posts multipart to the backend's combined
// Cloudinary upload + submit-receipt endpoint
// ---------------------------------------------------------------------------
import api from "@/lib/api";
import type { SessionDTO } from "@/types";

export interface UploadResult {
  session: SessionDTO;
}

/**
 * Uploads a payment receipt file to:
 *   POST /api/sessions/{sessionId}/receipt-upload
 * The backend stores it on Cloudinary and immediately marks the
 * receipt as SUBMITTED — all in one request.
 */
export async function uploadFile(
  file: File,
  sessionId: number,
): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);

  const response = await api.post<SessionDTO>(
    `/api/sessions/${sessionId}/receipt-upload`,
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return { session: response.data };
}
