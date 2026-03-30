"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X } from "lucide-react";
import { type Lang } from "@/lib/i18n";

interface VideoSectionProps {
  lang: Lang;
}

export default function VideoSection({ lang }: VideoSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const title = lang === "en" ? "See How It Works" : "Voir comment ça marche";
  const subtitle = lang === "en" 
    ? "Watch a quick walkthrough of the Trades-Canada lead generation engine." 
    : "Regardez une présentation rapide du moteur de génération de leads Trades-Canada.";

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden bg-black/40 backdrop-blur-sm border-y border-white/[0.04]">
      <div className="absolute inset-0 bg-amber-glow-xs opacity-50 pointer-events-none" />
      
      <div className="section-container relative z-10 text-center max-w-4xl mx-auto">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.6 }}
        >
          <div className="section-label mb-4 mx-auto">Demo</div>
          <h2 className="heading-lg mb-4">{title}</h2>
          <p className="text-muted-foreground text-lg mb-12 max-w-2xl mx-auto">
            {subtitle}
          </p>

          <div className="relative group cursor-pointer" onClick={() => setIsOpen(true)}>
            {/* Video Thumbnail Placeholder */}
            <div 
              className="aspect-video rounded-3xl overflow-hidden border border-white/[0.1] bg-black/60 relative shadow-2xl group-hover:scale-[1.01] transition-transform duration-500 bg-cover bg-center"
              style={{ backgroundImage: 'url("/video-thumbnail.png")' }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/20 to-amber-500/20 group-hover:opacity-40 transition-opacity" />
              
              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="w-24 h-24 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-amber group-hover:scale-110 transition-transform duration-300">
                  <Play size={40} className="fill-current ml-1" />
                </div>
                <span className="text-white font-bold tracking-widest uppercase text-sm drop-shadow-md">Watch Demo</span>
              </div>

              {/* Fake UI Elements for "Demo" feel */}
               <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Platform Preview</span>
              </div>
            </div>

            {/* Decorative Glow */}
            <div className="absolute -inset-4 bg-amber-500/5 blur-3xl rounded-full -z-10 group-hover:bg-amber-500/10 transition-all" />
          </div>
        </motion.div>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-xl"
            onClick={() => setIsOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden shadow-infinite border border-white/[0.08] bg-black"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-white/10 transition-all border border-white/10"
              >
                <X size={20} />
              </button>

              {/* The Video embed */}
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/ScMzIvxBSi4?autoplay=1&mute=0" 
                title="Trades-Canada Platform Walkthrough" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen
                className="w-full h-full"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
