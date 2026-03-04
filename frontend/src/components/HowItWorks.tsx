// components/HowItWorks.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, GraduationCap, Search } from 'lucide-react';

const steps = [
  {
    title: 'Find Your Subject',
    description:
      'Browse through our wide range of expert-led subjects tailored to your learning goals.',
    icon: Search,
  },
  {
    title: 'Schedule a Session',
    description:
      'Book 1-on-1 or group sessions with verified mentors at a time that suits you best.',
    icon: CalendarDays,
  },
  {
    title: 'Grow Your Skills',
    description:
      'Join the live session via the platform and start learning from industry professionals.',
    icon: GraduationCap,
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Mastering a new skill is easy
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            A simple process designed to get you from student to expert.
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
                <CardTitle className="text-xl font-bold text-zinc-900">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-600 leading-relaxed">{step.description}</p>
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
