
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Lock, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import ChatDemo from './ChatDemo';

const HeroSection = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 z-10">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="text-center lg:text-left space-y-8">
          {/* 3D Logo and Title */}
          <div className="flex items-center justify-center lg:justify-start gap-4 mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-2xl transform rotate-12 hover:rotate-0 transition-transform duration-300">
                <Shield className="w-8 h-8 text-white" />
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent rounded-xl blur-lg"></div>
              </div>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold gradient-text">EnigmaRoom</h1>
          </div>

          <div className="space-y-4">
            <h2 className="text-5xl lg:text-7xl font-bold leading-tight">
              Private Conversations,{' '}
              <span className="gradient-text">Reinvented</span>
            </h2>
            <p className="text-xl lg:text-2xl text-muted-foreground max-w-2xl">
              Military-grade encryption wrapped in intuitive, aesthetic design
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <a href="/chat">
              <Button size="lg" className="btn-primary text-lg px-8 py-4 rounded-full">
                Get Started
              </Button>
            </a>
            <Button variant="outline" size="lg" className="glass border-2 border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:border-purple-400/50 text-lg px-8 py-4 rounded-full backdrop-blur-sm">
              See How It Works
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center lg:justify-start gap-6 pt-8">
            <div className="flex items-center gap-2 glass px-4 py-2 rounded-full">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="text-sm">Military Grade</span>
            </div>
            <div className="flex items-center gap-2 glass px-4 py-2 rounded-full">
              <Lock className="w-5 h-5 text-blue-400" />
              <span className="text-sm">Zero Knowledge</span>
            </div>
            <div className="flex items-center gap-2 glass px-4 py-2 rounded-full">
              <Eye className="w-5 h-5 text-purple-400" />
              <span className="text-sm">End-to-End</span>
            </div>
          </div>
        </div>

        {/* Right Content - 3D Chat Demo */}
        <div 
          className="relative"
          style={{
            transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`
          }}
        >
          <ChatDemo />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
