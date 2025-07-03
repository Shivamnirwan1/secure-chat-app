
import React from 'react';
import { Shield, Users, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const SocialProof = () => {
  const testimonials = [
    {
      name: "Dr. Sarah Chen",
      role: "Cybersecurity Expert",
      company: "Stanford University",
      quote: "EnigmaRoom sets a new standard for encrypted communication. The user experience is phenomenal.",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face"
    },
    {
      name: "Marcus Rodriguez",
      role: "Privacy Advocate",
      company: "EFF",
      quote: "Finally, a messaging app that doesn't compromise on privacy or usability. Highly recommended.",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face"
    },
    {
      name: "Lisa Park",
      role: "Tech Journalist",
      company: "TechCrunch",
      quote: "EnigmaRoom proves that security and beautiful design can coexist perfectly.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face"
    }
  ];

  const stats = [
    { value: "75,000+", label: "Secure Communicators" },
    { value: "99.9%", label: "Uptime Guarantee" },
    { value: "0", label: "Data Breaches" },
    { value: "256-bit", label: "AES Encryption" }
  ];

  const badges = [
    { name: "GDPR Compliant", icon: Shield },
    { name: "HIPAA Certified", icon: Check },
    { name: "SOC 2 Verified", icon: Users },
    { name: "Privacy Shield", icon: Shield }
  ];

  return (
    <section className="py-24 px-4 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Stats Section */}
        <div className="text-center mb-20">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Trusted by <span className="gradient-text">Thousands</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Join the growing community of privacy-conscious users
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="glass-card p-6 rounded-2xl hover-lift">
                <div className="text-3xl lg:text-4xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-center mb-12">
            What Experts Say
          </h3>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="glass-card p-8 rounded-2xl hover-lift">
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role} • {testimonial.company}
                    </p>
                  </div>
                </div>
                
                <blockquote className="text-muted-foreground italic leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="text-center mb-20">
          <h3 className="text-2xl font-bold mb-8">Compliance & Certifications</h3>
          
          <div className="flex flex-wrap justify-center gap-6">
            {badges.map((badge, index) => (
              <div key={index} className="flex items-center gap-3 glass px-6 py-3 rounded-full">
                <badge.icon className="w-5 h-5 text-green-400" />
                <span className="font-medium">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Free to Use CTA */}
        <div className="text-center glass-card p-12 rounded-3xl">
          <h3 className="text-3xl lg:text-4xl font-bold mb-6">
            <span className="gradient-text">Free to Use</span> Forever
          </h3>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            EnigmaRoom is completely free with no hidden costs or premium features
          </p>
          
          <a href="/chat">
            <Button className="btn-primary px-8 py-4 text-lg rounded-full hover-lift">
              Get Started Now
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
