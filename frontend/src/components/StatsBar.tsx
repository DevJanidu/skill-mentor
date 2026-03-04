// components/StatsBar.tsx
import { Card, CardContent } from '@/components/ui/card';

const stats = [
  { label: 'Expert Mentors', value: '500+' },
  { label: 'Sessions Completed', value: '1.2k+' },
  { label: 'Active Subjects', value: '50+' },
  { label: 'Satisfaction Rate', value: '99%' },
];

export default function StatsBar() {
  return (
    <section className="py-12 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <Card className="border-none shadow-none bg-zinc-50/50">
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-8 p-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center space-y-2">
                <h3 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
                  {stat.value}
                </h3>
                <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
