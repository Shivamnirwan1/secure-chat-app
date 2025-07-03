
import React from 'react';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const TopNavigation = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">EnigmaRoom</span>
          </Link>

          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('features')}
              className="text-foreground hover:text-purple-400 transition-colors"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('security')}
              className="text-foreground hover:text-purple-400 transition-colors"
            >
              Security
            </button>
            <button 
              onClick={() => scrollToSection('platforms')}
              className="text-foreground hover:text-purple-400 transition-colors"
            >
              Platforms
            </button>
            <button 
              onClick={() => scrollToSection('about')}
              className="text-foreground hover:text-purple-400 transition-colors"
            >
              About
            </button>
          </nav>

          {/* Get Started Button */}
          <a href="/chat">
            <Button className="btn-primary px-6 py-2 rounded-full">
              Get Started
            </Button>
          </a>

        </div>
      </div>
    </header>
  );
};

export default TopNavigation;
