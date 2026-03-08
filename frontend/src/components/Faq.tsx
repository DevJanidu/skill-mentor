// components/Faq.tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Faq() {
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-3xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              Is Skill Mentor only for Sri Lankan students?
            </AccordionTrigger>
            <AccordionContent>
              Skill Mentor is built by Sri Lankans, for Sri Lankans — but it's
              open to everyone in the community, wherever you are in the world.
              Whether you're studying in Colombo or living in the UK, Australia,
              or the Middle East, you can join as a student or mentor. Sessions
              run in Sinhala, Tamil, or English.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>How do I book a session?</AccordionTrigger>
            <AccordionContent>
              Browse subjects and mentors, select an available time slot from
              the mentor's calendar, upload your bank slip as payment
              confirmation, and you're all set.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>
              Can I join with classmates as a group?
            </AccordionTrigger>
            <AccordionContent>
              Absolutely. Group sessions let you split the cost with your
              batchmates. Browse Open Group Sessions or ask your mentor to
              create one for your study group.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>How do I become a Mentor?</AccordionTrigger>
            <AccordionContent>
              Sign up, choose the Mentor role during onboarding, and complete
              your profile with your professional background. Sri Lankan
              students from across the globe will be able to find and book
              sessions with you.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}
