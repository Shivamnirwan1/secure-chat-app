import React from 'react';
import { Lock, Shield, Users, Smartphone, Monitor, Check, Palette, FileImage } from 'lucide-react';

const FeaturesGrid = () => {
  const features = [
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description: "Military-grade AES-256 encryption ensures your messages stay private",
      color: "text-purple-400"
    },
    {
      icon: Shield,
      title: "Zero-Knowledge Architecture",
      description: "We can't read your messages even if we wanted to",
      color: "text-blue-400"
    },
    {
      icon: Users,
      title: "Self-Destructing Messages",
      description: "Set timers for automatic message deletion",
      color: "text-emerald-400"
    },
    {
      icon: Palette,
      title: "Custom Themes (Light/Dark Mode)",
      description: "Personalize your experience with beautiful themes",
      color: "text-amber-400"
    },
    {
      icon: FileImage,
      title: "Encrypted File & Image Sharing",
      description: "Share files and media with end-to-end encryption",
      color: "text-rose-400"
    },
    {
      icon: Monitor,
      title: "Cross-Platform Sync",
      description: "Seamlessly sync across iOS, Android, and Web",
      color: "text-cyan-400"
    }
  ];

  return (
    <section className="py-24 px-4 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Security Meets <span className="gradient-text">Simplicity</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Experience next-generation privacy features designed for the modern world
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-card p-8 rounded-2xl hover-lift group cursor-pointer"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              
              <h3 className="text-xl font-semibold mb-4 group-hover:gradient-text transition-all">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
