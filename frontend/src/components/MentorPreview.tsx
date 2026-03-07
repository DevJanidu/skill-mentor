import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  GraduationCap,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";

const mentors = [
  {
    name: "Alexa Rivera",
    title: "Senior Software Engineer",
    company: "Google",
    rating: "4.9",
    reviews: 124,
    experience: "8+ Years",
    subjects: ["System Design", "React", "Go"],
    img: "https://i.pravatar.cc/150?u=1",
  },
  {
    name: "Marcus Dais",
    title: "Senior Product Designer",
    company: "Meta",
    rating: "5.0",
    reviews: 89,
    experience: "6+ Years",
    subjects: ["UX Research", "Figma", "Strategy"],
    img: "https://i.pravatar.cc/150?u=2",
  },
  {
    name: "Ananya Patel",
    title: "Backend Engineering Lead",
    company: "Netflix",
    rating: "4.8",
    reviews: 210,
    experience: "10+ Years",
    subjects: ["Node.js", "AWS", "Microservices"],
    img: "https://i.pravatar.cc/150?u=3",
  },
];

export default function MentorPreview() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <Badge
              variant="secondary"
              className="mb-4 bg-zinc-100 text-zinc-900 hover:bg-zinc-100 border-none px-3 py-1"
            >
              Expert Mentors
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
              Learn from the world's best talent.
            </h2>
            <p className="mt-4 text-lg text-zinc-600">
              Direct access to mentors from top-tier companies to help you
              navigate your career and technical challenges.
            </p>
          </div>
          <Link to="/mentors">
            <Button variant="outline" className="group border-zinc-200">
              View all mentors
              <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
          </Link>
        </div>

        {/* Mentor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mentors.map((m, i) => (
            <Card
              key={i}
              className="group border-zinc-100 bg-zinc-50/30 hover:bg-white hover:border-zinc-200 transition-all duration-300 shadow-sm hover:shadow-xl"
            >
              <CardContent className="p-8">
                {/* Profile Info */}
                <div className="flex items-start justify-between mb-6">
                  <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                    <AvatarImage src={m.img} />
                    <AvatarFallback>{m.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-full border border-zinc-100 shadow-sm">
                    <Star
                      size={14}
                      className="fill-yellow-400 text-yellow-400"
                    />
                    <span className="text-sm font-bold text-zinc-900">
                      {m.rating}
                    </span>
                    <span className="text-xs text-zinc-400">({m.reviews})</span>
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xl text-zinc-900">
                      {m.name}
                    </h3>
                    <CheckCircle2
                      size={18}
                      className="text-blue-600 fill-blue-50"
                    />
                  </div>
                  <p className="text-zinc-600 font-medium flex items-center gap-2">
                    <Briefcase size={14} />
                    {m.title} at {m.company}
                  </p>
                </div>

                {/* Experience & Subject Tags */}
                <div className="flex items-center gap-3 mb-6 text-sm text-zinc-500">
                  <div className="flex items-center gap-1">
                    <GraduationCap size={14} />
                    {m.experience}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                  {m.subjects.map((s) => (
                    <span
                      key={s}
                      className="text-[11px] font-semibold uppercase tracking-wider bg-white border border-zinc-100 px-2 py-1 rounded text-zinc-500"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <Link to="/mentors">
                  <Button className="w-full bg-zinc-900 hover:bg-zinc-800 text-white shadow-md group">
                    Book a free session
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
