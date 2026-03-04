import { Marquee } from '@/components/ui/Marquee'; // Adjust path based on your setup
import { cn } from '@/lib/utils';

const reviews = [
  {
    name: 'Arjun Silva',
    username: 'Data Science Student',
    body: 'Finding a mentor who actually works at a top tech company changed everything for my career path.',
    img: 'https://avatar.vercel.sh/arjun',
  },
  {
    name: 'Sarah Chen',
    username: 'Senior UI Designer',
    body: 'I love mentoring here. The platform makes it so easy to schedule sessions and share my design knowledge.',
    img: 'https://avatar.vercel.sh/sarah',
  },
  {
    name: 'David Kumar',
    username: 'Fullstack Learner',
    body: 'The group sessions are incredibly affordable and the quality of teaching is better than most bootcamps.',
    img: 'https://avatar.vercel.sh/david',
  },
  {
    name: 'Jessica Taylor',
    username: 'Python Mentor',
    body: "Skill Mentor has a great community of eager students. It's rewarding to see them land their first jobs.",
    img: 'https://avatar.vercel.sh/jessica',
  },
  {
    name: 'Malith Perera',
    username: 'DevOps Student',
    body: 'Finally, a platform that connects me with experts in Sri Lanka and abroad. Highly recommended!',
    img: 'https://avatar.vercel.sh/malith',
  },
  {
    name: 'Emily Watson',
    username: 'Marketing Lead',
    body: 'The session notes and recording features help me keep track of everything I learn from my mentor.',
    img: 'https://avatar.vercel.sh/emily',
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
        'relative w-80 shrink-0 cursor-pointer overflow-hidden rounded-xl border p-6',
        'border-zinc-950/[.1] bg-zinc-950/[.01] hover:bg-zinc-950/[.05]',
        'dark:border-zinc-50/[.1] dark:bg-zinc-50/[.10] dark:hover:bg-zinc-50/[.15]'
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <img className="rounded-full" width="40" height="40" alt="" src={img} />
        <div className="flex flex-col">
          <figcaption className="text-sm font-bold text-zinc-900 leading-none">{name}</figcaption>
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
          Loved by Students and Mentors
        </h2>
        <p className="mt-4 text-lg text-zinc-600">
          Join a growing community of learners and industry experts.
        </p>
      </div>

      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
        <Marquee pauseOnHover className="[--duration:30s]">
          {firstRow.map(review => (
            <ReviewCard key={review.username} {...review} />
          ))}
        </Marquee>
        <Marquee reverse pauseOnHover className="[--duration:35s] mt-4">
          {secondRow.map(review => (
            <ReviewCard key={review.username} {...review} />
          ))}
        </Marquee>

        {/* Improved Gradients to match Zinc/White theme */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-white"></div>
      </div>
    </section>
  );
}
