import Faq from '@/components/Faq';
import FinalCTA from '@/components/FinalCTA';
import Header from '@/components/Header';
import HowItWorks from '@/components/HowItWorks';
import MentorPreview from '@/components/MentorPreview';
import StatsBar from '@/components/StatsBar';
import SubjectGrid from '@/components/SubjectGrid';
import Testimonials from '@/components/Testimonials';

export default function Home() {
  return (
    <div>
      <Header />
      <StatsBar />
      <SubjectGrid />
      <HowItWorks />
      <MentorPreview />
      <Testimonials />
      <Faq />
      <FinalCTA />
    </div>
  );
}
