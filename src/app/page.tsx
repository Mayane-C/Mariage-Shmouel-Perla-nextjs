import { BackgroundMusic } from '@/components/BackgroundMusic';
import { BackgroundVideo } from '@/components/BackgroundVideo';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { FairePart } from '@/components/FairePart';
import { Details } from '@/components/Details';
import { Bracha } from '@/components/Bracha';
import { RSVP } from '@/components/RSVP';
import { Footer } from '@/components/Footer';
import { ScrollHint } from '@/components/ScrollHint';

export default function Home() {
  return (
    <>
      <BackgroundVideo />
      <Header />
      <div className="page">
        <Hero />
        <FairePart />
        <Details />
        <Bracha />
        <RSVP />
      </div>
      <Footer />
      <ScrollHint />
      <BackgroundMusic />
    </>
  );
}
