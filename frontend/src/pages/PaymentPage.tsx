import { useParams, Link } from "react-router-dom";
import { useSession, useSubmitReceipt } from "@/hooks/use-queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageSpinner } from "@/components/ui/spinner";
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ImageIcon,
  Upload,
  User,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { uploadFile } from "@/lib/upload";

export default function PaymentPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const id = Number(sessionId);
  const { data: session, isLoading } = useSession(id);
  const submitReceipt = useSubmitReceipt();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (chosen: File | null) => {
    setFile(chosen);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(chosen ? URL.createObjectURL(chosen) : null);
  };

  const handleSubmit = async () => {
    if (!file || !session) {
      toast.error("Please upload your bank slip.");
      return;
    }
    setUploading(true);
    try {
      const result = await uploadFile(file);
      submitReceipt.mutate(
        { id: session.id, data: { receiptUrl: result.url } },
        {
          onSuccess: () => {
            toast.success(
              "Payment slip submitted! Waiting for mentor confirmation.",
            );
            setSubmitted(true);
          },
        },
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Upload failed. Please retry.",
      );
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return <PageSpinner />;
  }

  if (!session) {
    return (
      <div className="py-24 text-center">
        <p className="text-zinc-500">Session not found.</p>
        <Link
          to="/dashboard"
          className="text-blue-600 hover:underline mt-2 inline-block"
        >
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="py-16 bg-zinc-50 min-h-screen">
      <div className="mx-auto max-w-5xl px-6 space-y-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Payment</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Upload your bank payment slip for session #{session.id}.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* ── LEFT COLUMN: session info + upload ── */}
          <div className="space-y-6">
            {/* Session summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <User className="h-4 w-4" /> Mentor
                  </div>
                  <div className="text-zinc-900 font-medium">
                    {session.mentorName}
                  </div>

                  <div className="flex items-center gap-2 text-zinc-500">
                    <CalendarCheck className="h-4 w-4" /> Subject
                  </div>
                  <div className="text-zinc-900 font-medium">
                    {session.subjectName}
                  </div>

                  <div className="flex items-center gap-2 text-zinc-500">
                    <Clock className="h-4 w-4" /> Date & Time
                  </div>
                  <div className="text-zinc-900">
                    {new Date(session.sessionAt).toLocaleString()}
                  </div>

                  <div className="flex items-center gap-2 text-zinc-500">
                    <Clock className="h-4 w-4" /> Duration
                  </div>
                  <div className="text-zinc-900">
                    {session.durationMinutes} minutes
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Status</span>
                  <Badge variant="secondary">{session.sessionStatus}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upload Bank Slip</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {submitted ? (
                  <div className="text-center py-8 space-y-3">
                    <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
                    <p className="text-zinc-900 font-medium">
                      Payment slip submitted!
                    </p>
                    <p className="text-sm text-zinc-500">
                      Your mentor will review your receipt and confirm the
                      session.
                    </p>
                    <Link to="/dashboard">
                      <Button variant="outline" className="mt-4">
                        Back to Dashboard
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Drop zone */}
                    <div
                      className="border-2 border-dashed border-zinc-200 rounded-lg p-8 text-center cursor-pointer hover:border-zinc-400 hover:bg-zinc-50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const dropped = e.dataTransfer.files[0];
                        if (dropped) handleFileChange(dropped);
                      }}
                    >
                      <Upload className="h-8 w-8 text-zinc-400 mx-auto mb-3" />
                      <p className="text-sm text-zinc-600 mb-1">
                        {file ? (
                          <span className="font-medium text-zinc-800">
                            {file.name}
                          </span>
                        ) : (
                          "Drag & drop or click to upload"
                        )}
                      </p>
                      <p className="text-xs text-zinc-400">
                        PNG, JPG, PDF up to 10 MB
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) =>
                          handleFileChange(e.target.files?.[0] ?? null)
                        }
                      />
                    </div>

                    {file && (
                      <div className="flex items-center justify-between text-sm text-zinc-600 bg-zinc-100 rounded px-3 py-2">
                        <span>
                          {file.name}{" "}
                          <span className="text-zinc-400">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </span>
                        <button
                          onClick={() => handleFileChange(null)}
                          className="text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    <Button
                      onClick={handleSubmit}
                      className="w-full"
                      disabled={!file || uploading}
                    >
                      {uploading ? "Uploading…" : "Submit Payment Slip"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── RIGHT COLUMN: slip preview ── */}
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Slip Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {preview ? (
                <div className="space-y-3">
                  {file?.type === "application/pdf" ? (
                    <iframe
                      src={preview}
                      title="PDF Receipt Preview"
                      className="w-full h-125 rounded border border-zinc-200"
                    />
                  ) : (
                    <img
                      src={preview}
                      alt="Payment slip preview"
                      className="w-full rounded-lg border border-zinc-200 object-contain max-h-125"
                    />
                  )}
                  <p className="text-xs text-zinc-400 text-center">
                    This is a local preview — it will be uploaded when you click
                    Submit.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-87.5 text-zinc-300 space-y-3 border-2 border-dashed border-zinc-100 rounded-lg">
                  <ImageIcon className="h-16 w-16" />
                  <p className="text-sm text-zinc-400">
                    Your slip preview will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
