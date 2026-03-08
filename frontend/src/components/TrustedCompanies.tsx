const universities = [
  "UOC",
  "UOP",
  "UOM",
  "USJ",
  "UOK",
  "SLIIT",
  "UOR",
  "SUSL",
  "NSBM",
];

// Double for seamless loop
const marqueeItems = [...universities, ...universities];

export default function TrustedCompanies() {
  return (
    <section className="py-12 border-y border-zinc-100 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-8">
          Trusted by Students from Leading Sri Lankan Universities
        </p>

        {/* MARQUEE CONTAINER */}
        <div className="relative flex overflow-hidden group">
          {/* Left/Right Fades */}
          <div className="absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-white to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-white to-transparent pointer-events-none" />

          <div className="flex animate-marquee whitespace-nowrap py-4">
            {marqueeItems.map((uni, index) => (
              <div
                key={index}
                className="mx-10 flex items-center gap-2.5 cursor-default select-none"
              >
                <span className="text-xl font-extrabold tracking-widest text-zinc-300 hover:text-zinc-500 transition-colors duration-300">
                  {uni}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
