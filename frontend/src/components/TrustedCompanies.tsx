import { Chrome, Figma, Github, Linkedin, Slack, Twitter } from 'lucide-react';

const companies = [
  { name: 'Google', icon: Chrome },
  { name: 'Git Hub', icon: Github }, // Using Github as placeholder
  { name: 'Linked In', icon: Linkedin },
  { name: 'Slack', icon: Slack },
  { name: 'Figma', icon: Figma },
  { name: 'Twitter', icon: Twitter },
];

// We double the array to ensure a seamless loop
const marqueeCompanies = [...companies, ...companies];

export default function TrustedCompanies() {
  return (
    <section className="py-12 border-y border-zinc-100 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-8">
          Our Mentors Come From World-Class Companies
        </p>

        {/* MARQUEE CONTAINER */}
        <div className="relative flex overflow-hidden group">
          {/* Left/Right Fades for professional look */}
          <div className="absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-white to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-white to-transparent pointer-events-none" />

          <div className="flex animate-marquee whitespace-nowrap py-4">
            {marqueeCompanies.map((company, index) => (
              <div
                key={index}
                className="mx-8 flex items-center gap-2 text-zinc-400 grayscale hover:grayscale-0 transition-all duration-300 cursor-default"
              >
                <company.icon size={28} />
                <span className="text-xl font-bold tracking-tight">{company.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
