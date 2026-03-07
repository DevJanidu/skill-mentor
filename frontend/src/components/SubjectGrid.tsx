import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  BarChart3,
  ChevronRight,
  Code2,
  Database,
  Globe2,
  Palette,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

const subjects = [
  {
    name: "Development",
    icon: Code2,
    count: "120+ Mentors",
    description: "Web, Mobile, and Game Dev",
  },
  {
    name: "Design",
    icon: Palette,
    count: "80+ Mentors",
    description: "UI/UX, Graphics, and Brand",
  },
  {
    name: "Marketing",
    icon: Globe2,
    count: "45+ Mentors",
    description: "SEO, Ads, and Social Media",
  },
  {
    name: "Business",
    icon: BarChart3,
    count: "60+ Mentors",
    description: "Startup, Finance, and Ops",
  },
  {
    name: "Data Science",
    icon: Database,
    count: "30+ Mentors",
    description: "AI, ML, and Data Analysis",
  },
  {
    name: "Soft Skills",
    icon: Zap,
    count: "50+ Mentors",
    description: "Leadership and Communication",
  },
];

export default function SubjectGrid() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              What do you want to learn?
            </h2>
            <p className="text-zinc-500 text-lg">
              Explore categories and find the mentor that fits your career path.
            </p>
          </div>
          <Link
            to="/subjects"
            className="flex items-center gap-2 text-sm font-bold text-zinc-900 hover:gap-3 transition-all"
          >
            Browse all categories <ArrowRight size={18} />
          </Link>
        </div>

        {/* The Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((s, i) => (
            <Link key={i} to="/subjects">
              <Card
                key={i}
                className="group relative overflow-hidden border-zinc-100 bg-white hover:border-zinc-900 transition-all duration-300"
              >
                <CardContent className="p-8">
                  {/* Icon logic: Using Lucide React with a soft styling */}
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white transition-colors duration-300">
                    <s.icon size={26} strokeWidth={1.5} />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-zinc-900">
                      {s.name}
                    </h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">
                      {s.description}
                    </p>
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t border-zinc-50 pt-6">
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                      {s.count}
                    </span>
                    <div className="rounded-full bg-zinc-50 p-2 text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                      <ChevronRight size={16} />
                    </div>
                  </div>

                  {/* Subtle background decoration that appears on hover */}
                  <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-zinc-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Mobile Suggestion Badge */}
        <div className="mt-12 flex flex-wrap justify-center gap-2 md:hidden">
          <Badge variant="secondary" className="bg-zinc-100 text-zinc-600">
            Product Management
          </Badge>
          <Badge variant="secondary" className="bg-zinc-100 text-zinc-600">
            Cyber Security
          </Badge>
          <Badge variant="secondary" className="bg-zinc-100 text-zinc-600">
            Photography
          </Badge>
        </div>
      </div>
    </section>
  );
}
