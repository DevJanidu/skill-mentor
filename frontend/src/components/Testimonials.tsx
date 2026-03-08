import { Marquee } from "@/components/ui/Marquee"; // Adjust path based on your setup
import { cn } from "@/lib/utils";

const reviews = [
  {
    name: "Kasun Perera",
    username: "UOM · Computer Science Student",
    body: "My mentor helped me understand data structures in a way no lecture ever did. Landed my first internship within weeks!",
    img: "https://avatar.vercel.sh/kasun",
  },
  {
    name: "Dilshan Rathnayake",
    username: "Software Engineer · Mentor",
    body: "Mentoring students from SLIIT and UOP has been incredibly rewarding. The platform handles all the scheduling for me.",
    img: "https://avatar.vercel.sh/dilshan",
  },
  {
    name: "Sanduni Fernando",
    username: "UOC · IT Undergraduate",
    body: "Group sessions are so affordable — I split the cost with three classmates and we all improved together.",
    img: "https://avatar.vercel.sh/sanduni",
  },
  {
    name: "Ishara Wickramasinghe",
    username: "Data Engineer · Mentor",
    body: "I teach in Sinhala and English. Students from rural areas finally get access to industry-level guidance.",
    img: "https://avatar.vercel.sh/ishara",
  },
  {
    name: "Malith Jayasinghe",
    username: "NSBM · DevOps Student",
    body: "Found a mentor who works at a leading Sri Lankan tech firm. His real-world advice is priceless.",
    img: "https://avatar.vercel.sh/malith",
  },
  {
    name: "Nethmi Gunawardena",
    username: "USJ · Business Management Student",
    body: "Skill Mentor made it easy to connect with a marketing professional who actually understands the local industry.",
    img: "https://avatar.vercel.sh/nethmi",
  },
];

const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);

const ReviewCard = ({
  img,
  name,
  username,
  body,
}: {
  img: string;
  name: string;
  username: string;
  body: string;
}) => {
  return (
    <figure
      className={cn(
        "relative w-80 shrink-0 cursor-pointer overflow-hidden rounded-xl border p-6",
        "border-zinc-950/10 bg-zinc-950/1 hover:bg-zinc-950/5",
        "dark:border-zinc-50/10 dark:bg-zinc-50/10 dark:hover:bg-zinc-50/15",
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <img className="rounded-full" width="40" height="40" alt="" src={img} />
        <div className="flex flex-col">
          <figcaption className="text-sm font-bold text-zinc-900 leading-none">
            {name}
          </figcaption>
          <p className="text-xs font-medium text-zinc-500 mt-1">{username}</p>
        </div>
      </div>
      <blockquote className="mt-4 text-sm leading-relaxed text-zinc-600 italic">
        "{body}"
      </blockquote>
    </figure>
  );
};

export default function Testimonials() {
  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 mb-12 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Loved by Sri Lankan Students &amp; Mentors
        </h2>
        <p className="mt-4 text-lg text-zinc-600">
          Join a growing community of university students and local industry
          professionals.
        </p>
      </div>

      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
        <Marquee pauseOnHover className="[--duration:30s]">
          {firstRow.map((review) => (
            <ReviewCard key={review.username} {...review} />
          ))}
        </Marquee>
        <Marquee reverse pauseOnHover className="[--duration:35s] mt-4">
          {secondRow.map((review) => (
            <ReviewCard key={review.username} {...review} />
          ))}
        </Marquee>

        {/* Improved Gradients to match Zinc/White theme */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-white"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-linear-to-l from-white"></div>
      </div>
    </section>
  );
}
