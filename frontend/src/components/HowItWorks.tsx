// components/HowItWorks.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, GraduationCap, Search } from "lucide-react";

const steps = [
  {
    title: "Pick a Subject",
    description:
      "Browse subjects taught by verified Sri Lankan professionals — from IT and engineering to business and design.",
    icon: Search,
  },
  {
    title: "Book a Local Mentor",
    description:
      "Schedule 1-on-1 or group sessions with mentors who understand the local university curriculum and industry.",
    icon: CalendarDays,
  },
  {
    title: "Level Up Your Career",
    description:
      "Learn live, ask questions in Sinhala or English, and get the guidance you need to excel in your career — whether you're in Sri Lanka or anywhere in the world.",
    icon: GraduationCap,
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Getting started is simple
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Designed for Sri Lankans everywhere — straightforward, affordable,
            and effective.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <Card
              key={index}
              className="relative overflow-hidden border-zinc-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-4">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-900 text-white">
                  <step.icon size={24} />
                </div>
                <CardTitle className="text-xl font-bold text-zinc-900">
                  {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-600 leading-relaxed">
                  {step.description}
                </p>
                {/* Step Number Badge */}
                <div className="absolute top-4 right-4 text-4xl font-black text-zinc-50">
                  0{index + 1}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
