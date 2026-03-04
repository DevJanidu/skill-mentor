import { useParams, Link } from "react-router-dom";
import { useSession, useUpdateSession } from "@/hooks/use-queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Upload,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { uploadToCloudinary } from "@/lib/cloudinary";

export default function PaymentPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const id = Number(sessionId);
  const { data: session, isLoading } = useSession(id);
  const updateSession = useUpdateSession();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!file || !session) {
      toast.error("Please upload your bank slip.");
      return;
    }
    setUploading(true);
    try {
      // Upload to Cloudinary
      const result = await uploadToCloudinary(file);

      // Persist the receipt URL on the session
      updateSession.mutate(
        {
          id: session.id,
          data: {
            sessionStatus: session.sessionStatus,
            sessionType: session.sessionType,
            receiptUrl: result.secure_url,
          },
        },
        {
          onSuccess: () => {
            toast.success(
              "Payment slip submitted! Waiting for admin confirmation.",
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
    return (
      <div className="py-16">
        <div className="mx-auto max-w-2xl px-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
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
      <div className="mx-auto max-w-2xl px-6 space-y-6">
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
                  The admin will review and confirm your payment.
                </p>
                <Link to="/dashboard">
                  <Button variant="outline" className="mt-4">
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="border-2 border-dashed border-zinc-200 rounded-lg p-8 text-center">
                  <Upload className="h-8 w-8 text-zinc-400 mx-auto mb-3" />
                  <p className="text-sm text-zinc-600 mb-2">
                    {file ? file.name : "Drag & drop or click to upload"}
                  </p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="w-full opacity-0 absolute inset-0 cursor-pointer"
                    style={{ position: "relative" }}
                  />
                  <Button variant="outline" size="sm" asChild>
                    <label className="cursor-pointer">
                      Choose File
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        className="hidden"
                      />
                    </label>
                  </Button>
                </div>
                {file && (
                  <p className="text-sm text-zinc-600">
                    Selected: <span className="font-medium">{file.name}</span> (
                    {(file.size / 1024).toFixed(1)} KB)
                  </p>
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
    </div>
  );
}
