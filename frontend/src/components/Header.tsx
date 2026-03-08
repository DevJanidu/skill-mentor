import { Images } from "@/assets/assets";
import { Button } from "@/components/ui/button";
import HeroBg from "./layouts/HeroBg";
import TrustedCompanies from "./TrustedCompanies";
import { Link } from "react-router-dom";

function Header() {
  return (
    <HeroBg>
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-12 md:py-20 md:grid-cols-2">
        {/* LEFT CONTENT */}
        <div className="text-center md:text-left mt-20">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-zinc-500 bg-zinc-100 rounded-full px-4 py-1.5 mb-4">
            🇱🇰 Built for Sri Lankan Students
          </span>
          <h1 className="text-4xl font-bold leading-tight text-zinc-900 md:text-5xl lg:text-6xl">
            Learn from the Best{" "}
            <span className="text-zinc-600">Local Mentors</span>
          </h1>

          <p className="mt-6 mx-auto md:mx-0 max-w-xl text-lg text-zinc-600">
            Sri Lanka's first dedicated mentoring platform — connecting
            university students with experienced professionals for 1-on-1 and
            group learning sessions in your own language and time zone.
          </p>

          <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-4">
            <Link to="/subjects">
              <Button className="px-6 py-5 text-base w-full sm:w-auto">
                Explore Subjects
              </Button>
            </Link>
            <Link to="/mentors">
              <Button
                variant="outline"
                className="px-6 py-5 text-base w-full sm:w-auto"
              >
                Find a Mentor
              </Button>
            </Link>
          </div>
        </div>

        {/* RIGHT IMAGES */}
        <div className="relative flex justify-center h-105 md:h-137.5 mt-10 md:mt-20">
          {/* Image 1 (Center - Stays at top) */}
          <div className="relative z-10">
            <img
              src={Images.HERO1}
              alt="Online learning"
              className="h-48 w-36 md:h-72 md:w-56 rounded-2xl object-cover shadow-lg border-2 border-white"
            />
          </div>

          {/* Image 2 (Bottom Left) */}
          <div className="absolute left-2 sm:left-10 md:-left-4 top-24 md:top-44 z-20">
            <img
              src={Images.HERO2}
              alt="Mentor session"
              className="h-48 w-36 md:h-72 md:w-56 rounded-2xl object-cover shadow-xl border-2 border-white"
            />
          </div>

          {/* Image 3 (Bottom Right - Now moved down to match Image 2) */}
          <div className="absolute right-2 sm:right-10 md:-right-4 top-24 md:top-44 z-20">
            <img
              src={Images.HERO3}
              alt="Student studying"
              className="h-48 w-36 md:h-72 md:w-56 rounded-2xl object-cover shadow-md border-2 border-white"
            />
          </div>
        </div>
      </div>
      <TrustedCompanies />
    </HeroBg>
  );
}

export default Header;
