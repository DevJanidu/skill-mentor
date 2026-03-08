import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Images } from "@/assets/assets";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 text-center gap-8">
      <img
        src={Images.HERO3}
        alt="Page not found"
        className="w-72 sm:w-96 object-contain"
      />
      <div className="space-y-2">
        <h1 className="text-7xl font-bold text-zinc-900">404</h1>
        <p className="text-zinc-500">
          The page you're looking for doesn't exist.
        </p>
      </div>
      <Link to="/">
        <Button>Back to Home</Button>
      </Link>
    </div>
  );
}
