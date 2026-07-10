import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { FairePart } from '@/components/FairePart';
import { Details } from '@/components/Details';
import { Bracha } from '@/components/Bracha';
import { RSVP } from '@/components/RSVP';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Header />
      <div className="page">
        <Hero />
        <FairePart />
        <Details />
        <Bracha />
        <RSVP />
      </div>
      <Footer />
    </>
  );
}
