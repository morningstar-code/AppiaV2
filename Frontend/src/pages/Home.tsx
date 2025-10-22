import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { FeaturesSection } from '../components/FeaturesSection';
import { FaqSection } from '../components/FaqSection';
import { Footer } from '../components/Footer';
import { BackgroundElements } from '../components/BackgroundElements';
import HowitWork from '@/components/Works';

export function Home() {
  const { prompt, setPrompt } = useAppContext();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollY]);

  return (
    <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 min-h-screen relative">
      <BackgroundElements />

      <Navbar scrollY={scrollY} />

      <HeroSection prompt={prompt} setPrompt={setPrompt} />

      <FeaturesSection />
      
      <HowitWork/>

      <FaqSection />

      <Footer />
    </div>
  );
}
