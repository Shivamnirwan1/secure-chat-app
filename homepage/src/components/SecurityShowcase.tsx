
import React, { useState } from 'react';
import { Shield, Lock, Eye, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SecurityShowcase = () => {
  const [activeStep, setActiveStep] = useState(0);

  const encryptionSteps = [
    {
      title: "Message Input",
      description: "Your message is typed in plain text",
      icon: Eye,
      color: "text-gray-400"
    },
    {
      title: "Key Generation",
      description: "Unique encryption keys are generated",
      icon: Shield,
      color: "text-yellow-400"
    },
    {
      title: "AES-256 Encryption",
      description: "Message is encrypted with military-grade security",
      icon: Lock,
      color: "text-purple-400"
    },
    {
      title: "Secure Transmission",
      description: "Encrypted data is sent safely to recipient",
      icon: Check,
      color: "text-green-400"
    }
  ];

  const certifications = [
    { name: "ISO 27001", status: "Certified" },
    { name: "SOC 2 Type II", status: "Compliant" },
    { name: "OWASP", status: "Verified" },
    { name: "TLS 1.3", status: "Enabled" }
  ];

  return (
    <section className="py-24 px-4 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            <span className="gradient-text">Bank-Level</span> Security
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Watch how your messages are protected with industry-leading encryption
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Encryption Visualizer */}
          <div className="space-y-8">
            <h3 className="text-2xl font-semibold mb-8">Encryption Process</h3>
            
            {encryptionSteps.map((step, index) => (
              <div
                key={index}
                className={`flex items-start gap-6 p-6 rounded-2xl cursor-pointer transition-all ${
                  activeStep === index ? 'glass-card' : 'hover:glass'
                }`}
                onClick={() => setActiveStep(index)}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  activeStep === index ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'glass'
                }`}>
                  <step.icon className={`w-6 h-6 ${activeStep === index ? 'text-white' : step.color}`} />
                </div>
                
                <div className="flex-1">
                  <h4 className={`text-lg font-semibold mb-2 ${
                    activeStep === index ? 'gradient-text' : ''
                  }`}>
                    {step.title}
                  </h4>
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </div>

                <div className={`w-3 h-3 rounded-full transition-all ${
                  activeStep === index ? 'bg-green-400' : 'bg-gray-600'
                }`}></div>
              </div>
            ))}
          </div>

          {/* Live Demo */}
          <div className="space-y-8">
            <div className="glass-card p-8 rounded-2xl">
              <h3 className="text-xl font-semibold mb-6">Live Encryption Demo</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Original Message:</p>
                  <p className="font-mono">"Meet me at the coffee shop at 3pm"</p>
                </div>
                
                <div className="flex justify-center">
                  <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
                
                <div className="p-4 bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Encrypted Output:</p>
                  <p className="font-mono text-green-400 break-all">
                    aGk5NzM4ZjQxNWE2Y2M5ZGY4YjVhOWI4ZjQxNWE2Y2M5ZGY4YjVhOWI4ZjQxNWE2Y2M5ZGY4YjVhOWI4ZjQxNWE2Y2M5ZGY4YjVhOWI=
                  </p>
                </div>
              </div>

              <Button className="w-full mt-6 btn-primary">
                Try Interactive Demo
              </Button>
            </div>

            {/* Certifications */}
            <div className="glass-card p-8 rounded-2xl">
              <h3 className="text-xl font-semibold mb-6">Security Certifications</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {certifications.map((cert, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <span className="font-medium">{cert.name}</span>
                    <span className="text-green-400 text-sm">{cert.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecurityShowcase;
