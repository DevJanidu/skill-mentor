// components/Faq.tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function Faq() {
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>How do I book a session?</AccordionTrigger>
            <AccordionContent>
              Once you find a mentor and subject you like, you can view their available sessions and
              click "Enroll". If it's a private session, the mentor will confirm the schedule.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Is the mentorship 1-on-1?</AccordionTrigger>
            <AccordionContent>
              We offer both INDIVIDUAL (1-on-1) and GROUP sessions. You can filter sessions by
              "Session Type" in your student dashboard.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>How do I join as a Mentor?</AccordionTrigger>
            <AccordionContent>
              Simply sign up and complete the onboarding process by selecting the "Mentor" role.
              You'll need to provide your professional background and experience years.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}
