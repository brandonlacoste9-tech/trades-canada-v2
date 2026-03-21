"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Globe, LogIn, ChevronRight } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";

interface NavbarProps {
  lang: Lang;
}

export default function Navbar({ lang }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const otherLang = lang === "en" ? "fr" : "en";
  const otherPath = pathname.replace(`/${lang}`, `/${otherLang}`);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: `/${lang}#features`, label: t("nav.features", lang) },
    { href: `/${lang}#pricing`, label: t("nav.pricing", lang) },
    { href: `/${lang}/booking`, label: t("nav.bookCall", lang) },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-black/80 backdrop-blur-xl border-b border-white/[0.06] shadow-glass"
            : "bg-transparent"
        }`}
      >
        <div className="section-container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href={`/${lang}`} className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shadow-amber-sm group-hover:shadow-amber transition-shadow duration-300">
                <span className="text-black font-bold text-sm font-display">TC</span>
              </div>
              <span className="font-display font-bold text-base tracking-tight text-foreground group-hover:text-amber-400 transition-colors duration-200">
                TRADES-CANADA
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="btn-ghost text-sm"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              {/* Language Toggle */}
              <Link
                href={otherPath}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-muted-foreground text-xs font-display font-semibold hover:border-amber-500/30 hover:text-amber-400 transition-all duration-200"
              >
                <Globe className="w-3.5 h-3.5" />
                {otherLang.toUpperCase()}
              </Link>

              <Link href={`/${lang}/auth`} className="btn-ghost text-sm">
                <LogIn className="w-4 h-4" />
                {t("nav.login", lang)}
              </Link>

              <Link href={`/${lang}/booking`} className="btn-amber text-sm">
                {t("nav.getQuote", lang)}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-all"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 bg-black/95 backdrop-blur-xl border-b border-white/[0.06] md:hidden"
          >
            <div className="section-container py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.05] font-display text-sm transition-all"
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-white/[0.06] mt-2 pt-3 flex flex-col gap-2">
                <Link href={otherPath} onClick={() => setMobileOpen(false)} className="btn-ghost text-sm justify-start">
                  <Globe className="w-4 h-4" />
                  {otherLang === "fr" ? "Français" : "English"}
                </Link>
                <Link href={`/${lang}/auth`} onClick={() => setMobileOpen(false)} className="btn-outline-amber text-sm">
                  <LogIn className="w-4 h-4" />
                  {t("nav.login", lang)}
                </Link>
                <Link href={`/${lang}/booking`} onClick={() => setMobileOpen(false)} className="btn-amber text-sm">
                  {t("nav.getQuote", lang)}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
