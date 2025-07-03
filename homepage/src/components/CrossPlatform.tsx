
import React, { useState } from 'react';
import { Smartphone, Monitor } from 'lucide-react';

const CrossPlatform = () => {
  const [activeDevice, setActiveDevice] = useState('mobile');

  const devices = [
    { id: 'mobile', name: 'Mobile', icon: Smartphone },
    { id: 'desktop', name: 'Desktop', icon: Monitor }
  ];

  return (
    <section className="py-24 px-4 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            One App, <span className="gradient-text">Every Device</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Seamlessly sync your conversations across all your devices with our unified experience
          </p>
        </div>

        {/* Device Switcher */}
        <div className="flex justify-center mb-12">
          <div className="glass-card p-1 rounded-full inline-flex gap-1">
            {devices.map((device) => (
              <button
                key={device.id}
                onClick={() => setActiveDevice(device.id)}
                className={`flex items-center gap-3 px-8 py-4 rounded-full transition-all duration-300 ${
                  activeDevice === device.id
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                <device.icon className="w-5 h-5" />
                <span className="font-medium whitespace-nowrap">{device.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Device Previews */}
        <div className="relative max-w-4xl mx-auto">
          {activeDevice === 'mobile' && (
            <div className="flex justify-center">
              <div className="w-80 h-[600px] glass-card rounded-3xl p-4 hover-lift">
                <div className="w-full h-full bg-gray-900 rounded-2xl p-6 relative overflow-hidden">
                  {/* Mobile Interface */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"></div>
                      <span className="text-sm font-medium">EnigmaRoom</span>
                    </div>
                    <div className="w-6 h-6 glass rounded-full"></div>
                  </div>

                  <div className="space-y-4">
                    <div className="glass p-4 rounded-2xl">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-6 h-6 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"></div>
                        <span className="text-xs text-muted-foreground">Alice</span>
                      </div>
                      <p className="text-sm">Hey! Ready for the meeting?</p>
                    </div>

                    <div className="flex justify-end">
                      <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 rounded-2xl max-w-xs">
                        <p className="text-sm text-white">Yes, joining now 🔒</p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="glass p-3 rounded-full flex items-center gap-3">
                      <div className="w-6 h-6 glass rounded-full"></div>
                      <span className="text-xs text-muted-foreground flex-1">Type a message...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeDevice === 'desktop' && (
            <div className="glass-card rounded-2xl p-8 hover-lift">
              <div className="bg-gray-900 rounded-xl p-6 h-96 relative overflow-hidden">
                {/* Desktop Interface */}
                <div className="flex h-full">
                  {/* Sidebar */}
                  <div className="w-1/3 border-r border-gray-700 pr-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 glass rounded-lg">
                        <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">Alice Johnson</p>
                          <p className="text-xs text-muted-foreground">Hey! Ready for the...</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg opacity-50">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">Bob Smith</p>
                          <p className="text-xs text-muted-foreground">Thanks for the update</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chat Area */}
                  <div className="flex-1 pl-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-700">
                      <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"></div>
                      <span className="font-medium">Alice Johnson</span>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="glass p-4 rounded-xl max-w-md">
                        <p className="text-sm">Hey! Ready for the meeting?</p>
                      </div>
                      
                      <div className="flex justify-end">
                        <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 rounded-xl max-w-md">
                          <p className="text-sm text-white">Yes, joining now 🔒</p>
                        </div>
                      </div>
                    </div>

                    <div className="glass p-3 rounded-full flex items-center gap-3 mt-4">
                      <span className="text-sm text-muted-foreground flex-1">Type a message...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CrossPlatform;
