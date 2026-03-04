import { useState } from "react";
import { useUpdateSession } from "@/hooks/use-queries";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star } from "lucide-react";
import type { SessionDTO } from "@/types";

interface ReviewDialogProps {
  session: SessionDTO | null;
  onClose: () => void;
}

export default function ReviewDialog({ session, onClose }: ReviewDialogProps) {
  const updateSession = useUpdateSession();
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [hovered, setHovered] = useState(0);

  const handleSubmit = () => {
    if (!session) return;
    updateSession.mutate(
      {
        id: session.id,
        data: {
          sessionStatus: session.sessionStatus,
          sessionType: session.sessionType,
          studentRating: rating,
          studentReview: review,
        },
      },
      {
        onSuccess: () => {
          setRating(5);
          setReview("");
          onClose();
        },
      },
    );
  };

  return (
    <Dialog
      open={!!session}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review Session</DialogTitle>
          <DialogDescription>
            How was your session for{" "}
            <span className="font-medium">{session?.subjectName}</span> with{" "}
            <span className="font-medium">{session?.mentorName}</span>?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Star rating */}
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-7 w-7 transition-colors ${
                      star <= (hovered || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-zinc-200"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-zinc-500 self-center">
                {rating}/5
              </span>
            </div>
          </div>

          {/* Review text */}
          <div className="space-y-2">
            <Label>Review</Label>
            <Textarea
              rows={4}
              placeholder="Share your experience…"
              value={review}
              onChange={(e) => setReview(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!review || updateSession.isPending}
          >
            {updateSession.isPending ? "Submitting…" : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
