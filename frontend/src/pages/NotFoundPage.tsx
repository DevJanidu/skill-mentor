import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 text-center">
      <h1 className="text-6xl font-bold text-zinc-900">404</h1>
      <p className="mt-4 text-lg text-zinc-600">
        The page you're looking for doesn't exist.
      </p>
      <Link to="/" className="mt-6">
        <Button>Back to Home</Button>
      </Link>
    </div>
  );
}
