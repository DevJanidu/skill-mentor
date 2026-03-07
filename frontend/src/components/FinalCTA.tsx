// components/FinalCTA.tsx
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function FinalCTA() {
  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-5xl bg-zinc-900 rounded-3xl p-8 md:p-16 text-center text-white">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          Ready to accelerate your career?
        </h2>
        <p className="text-zinc-400 text-lg mb-10 max-w-2xl mx-auto">
          Join thousands of students who are already learning from industry
          experts. Become a student today or share your knowledge as a mentor.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/subjects">
            <Button
              size="lg"
              className="bg-white text-zinc-900 hover:bg-zinc-300 px-8"
            >
              Get Started for Free
            </Button>
          </Link>
          <Link to="/mentors">
            <Button
              size="lg"
              variant="secondary"
              className="border-zinc-700 hover:bg-zinc-300 px-8"
            >
              View Mentors
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
