import Faq from "@/components/Faq";
import FinalCTA from "@/components/FinalCTA";
import Header from "@/components/Header";
import HowItWorks from "@/components/HowItWorks";
import MentorPreview from "@/components/MentorPreview";
import StatsBar from "@/components/StatsBar";
import SubjectGrid from "@/components/SubjectGrid";
import Testimonials from "@/components/Testimonials";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function Home() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div>
      <Header />
      <StatsBar />
      <SubjectGrid />
      <HowItWorks />
      <MentorPreview />
      <Testimonials />
      <Faq />
      <FinalCTA />

      {/* Scroll-to-top button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg hover:bg-zinc-700 transition-colors"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
