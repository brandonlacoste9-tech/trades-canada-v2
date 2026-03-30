"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, Search, Star, Lock, CheckCircle, ArrowRight, User, Phone, MapPin } from "lucide-react";

export default function VideoMockup() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 5);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full h-full bg-[#050505] flex items-center justify-center overflow-hidden font-display p-6 sm:p-12">
      <div className="relative w-full max-w-2xl aspect-[16/10] bg-black/40 rounded-3xl border border-white/10 shadow-infinite-sm backdrop-blur-2xl overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-blue-500/5" />
        
        {/* Fake Browser Toolbar */}
        <div className="absolute top-0 left-0 right-0 h-10 border-b border-white/5 bg-white/5 flex items-center px-4 gap-2 z-20">
          <div className="flex gap-1.5 mr-4">
            <div className="w-2 h-2 rounded-full bg-white/10" />
            <div className="w-2 h-2 rounded-full bg-white/10" />
            <div className="w-2 h-2 rounded-full bg-white/10" />
          </div>
          <div className="bg-white/10 h-5 px-3 rounded-md text-[10px] text-white/40 flex items-center gap-2 flex-1 max-w-[200px]">
            <Search size={8} /> trades-canada.com/dashboard
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 top-10 p-6 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="login"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex flex-col items-center gap-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center shadow-amber">
                  <LogIn className="text-black" size={32} />
                </div>
                <div className="text-center">
                  <h4 className="text-xl font-bold mb-1">Contractor Login</h4>
                  <p className="text-white/40 text-sm">Accessing your lead engine...</p>
                </div>
                <div className="w-full max-w-xs h-10 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center gap-2 text-amber-500 font-bold text-sm">
                  Logging in...
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-bold">Scanning Marketplace</h4>
                    <p className="text-white/40 text-[10px]">Filtering high-intent leads in Vancouver...</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-24 h-6 bg-white/5 rounded-full border border-white/10 animate-pulse" />
                    <div className="w-6 h-6 bg-white/5 rounded-md border border-white/10 animate-spin-slow" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-3 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-2"
                    >
                      <div className="w-1/2 h-2.5 bg-white/20 rounded-full" />
                      <div className="w-3/4 h-2 bg-white/10 rounded-full" />
                      <div className="flex justify-between items-center mt-2">
                        <div className="w-10 h-4 bg-amber-500/20 rounded-full" />
                        <div className="w-4 h-4 bg-white/10 rounded-full" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="found"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="flex flex-col gap-4"
              >
                <div className="text-center mb-2">
                   <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
                     Match Found!
                   </span>
                </div>
                <div className="p-6 bg-gradient-to-br from-amber-500/20 to-transparent border border-amber-500/40 rounded-3xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4">
                    <Star className="text-amber-400 fill-amber-400 animate-pulse" size={20} />
                  </div>
                  
                  <h4 className="text-xl font-bold mb-1">Commercial HVAC Upgrade</h4>
                  <p className="flex items-center gap-1.5 text-white/60 text-sm mb-4">
                    <MapPin size={14} className="text-white/40" /> Downtown, Vancouver
                  </p>
                  
                  <div className="flex gap-4 mb-6">
                    <div className="bg-white/5 border border-white/10 p-2 rounded-xl flex-1 text-center">
                      <div className="text-[10px] text-white/40 uppercase mb-1">Budget</div>
                      <div className="text-sm font-bold">$12k - $15k</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-2 rounded-xl flex-1 text-center">
                      <div className="text-[10px] text-white/40 uppercase mb-1">Impact</div>
                      <div className="text-sm font-bold text-amber-500">9.8/10</div>
                    </div>
                  </div>

                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="w-full h-12 bg-amber-500 text-black font-black rounded-xl flex items-center justify-center gap-2 shadow-amber"
                  >
                    Select Lead <ArrowRight size={18} />
                  </motion.div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="unlocking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-8"
              >
                <div className="relative">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="w-24 h-24 rounded-full border-2 border-dashed border-amber-500/50 flex items-center justify-center"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock size={32} className="text-amber-500" />
                  </div>
                </div>
                <div className="text-center">
                  <h4 className="text-xl font-bold mb-2">Unlocking Business Info</h4>
                  <p className="text-white/40 text-sm mb-4">Verifying contact data d&apos;ocean à l&apos;ocean...</p>
                  
                  <div className="flex flex-col gap-2 w-64 mx-auto">
                    <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2.5 }}
                        className="h-full bg-amber-500 shadow-amber"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex flex-col items-center gap-6"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10 }}
                  className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center shadow-green"
                >
                  <CheckCircle className="text-black" size={40} />
                </motion.div>
                <div className="text-center">
                  <h4 className="text-2xl font-black mb-1">Lead Claimed!</h4>
                  <p className="text-white/40 text-sm mb-6">Details unlocked and synced to your CRM.</p>
                </div>
                
                <div className="w-full max-w-sm p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <User className="text-white/60" size={20} />
                    </div>
                    <div>
                      <div className="text-xs text-white/40">Project Lead</div>
                      <div className="text-sm font-bold">Robert D. (Propriétaire)</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <Phone className="text-white/60" size={20} />
                    </div>
                    <div>
                      <div className="text-xs text-white/40">Direct Line</div>
                      <div className="text-sm font-bold">+1 (604) 555-0199</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Background Particles */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <motion.div 
            animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-32 h-32 bg-amber-500/20 blur-[60px] rounded-full"
          />
          <motion.div 
            animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
            transition={{ duration: 7, repeat: Infinity }}
            className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-blue-500/20 blur-[60px] rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
