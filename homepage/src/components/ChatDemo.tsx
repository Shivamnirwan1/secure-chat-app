
import React, { useState, useEffect } from 'react';
import { Lock, Shield, Check } from 'lucide-react';

const ChatDemo = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hey, can you send me those documents?", encrypted: false, sender: "user" },
    { id: 2, text: "🔒 Message encrypted...", encrypted: true, sender: "contact" },
    { id: 3, text: "Sure! Sending securely now.", encrypted: false, sender: "contact" }
  ]);

  const [encryptionStep, setEncryptionStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setEncryptionStep((prev) => (prev + 1) % 4);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative max-w-md mx-auto">
      {/* Main Chat Interface */}
      <div className="glass-card rounded-3xl p-6 hover-lift">
        {/* Chat Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">Secure Chat</h3>
              <p className="text-xs text-muted-foreground">End-to-end encrypted</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">Active</span>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-4 mb-6">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-3 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                    : 'glass text-foreground'
                } ${message.encrypted ? 'animate-pulse' : ''}`}
              >
                <div className="flex items-center gap-2">
                  {message.encrypted && <Lock className="w-4 h-4" />}
                  <span className="text-sm">{message.text}</span>
                  {!message.encrypted && message.sender === 'user' && (
                    <Check className="w-4 h-4 ml-1" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Encryption Indicator */}
        <div className="flex items-center justify-center gap-2 py-3 glass rounded-full">
          <div className={`w-2 h-2 rounded-full transition-colors ${
            encryptionStep >= 1 ? 'bg-green-400' : 'bg-gray-600'
          }`}></div>
          <div className={`w-2 h-2 rounded-full transition-colors ${
            encryptionStep >= 2 ? 'bg-green-400' : 'bg-gray-600'
          }`}></div>
          <div className={`w-2 h-2 rounded-full transition-colors ${
            encryptionStep >= 3 ? 'bg-green-400' : 'bg-gray-600'
          }`}></div>
          <span className="text-xs text-muted-foreground ml-2">
            {encryptionStep === 0 && "Initializing..."}
            {encryptionStep === 1 && "Encrypting..."}
            {encryptionStep === 2 && "Sending..."}
            {encryptionStep === 3 && "Delivered"}
          </span>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute -top-4 -right-4 w-8 h-8 glass rounded-full flex items-center justify-center float-animation">
        <Lock className="w-4 h-4 text-purple-400" />
      </div>
      <div className="absolute -bottom-4 -left-4 w-6 h-6 glass rounded-full flex items-center justify-center float-animation" style={{ animationDelay: '2s' }}>
        <Shield className="w-3 h-3 text-blue-400" />
      </div>
    </div>
  );
};

export default ChatDemo;
