
import React from 'react';
import TopNavigation from '../components/TopNavigation';
import HeroSection from '../components/HeroSection';
import FeaturesGrid from '../components/FeaturesGrid';
import SecurityShowcase from '../components/SecurityShowcase';
import CrossPlatform from '../components/CrossPlatform';
import SocialProof from '../components/SocialProof';
import ParticleBackground from '../components/ParticleBackground';

const Index = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />
      <TopNavigation />
      <div className="pt-16">
        <HeroSection />
        <div id="features">
          <FeaturesGrid />
        </div>
        <div id="security">
          <SecurityShowcase />
        </div>
        <div id="platforms">
          <CrossPlatform />
        </div>
        <div id="about">
          <SocialProof />
        </div>
      </div>
    </div>
  );
};

export default Index;
