import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLang, type Lang } from "@/lib/i18n";
import AuthForm from "@/components/dashboard/AuthForm";
import Link from "next/link";

interface AuthPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ plan?: string; mode?: string }>;
}

export async function generateMetadata({ params }: AuthPageProps): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === "fr" ? "Connexion | Trades-Canada" : "Sign In | Trades-Canada",
    robots: { index: false, follow: false },
  };
}

export default async function AuthPage({ params, searchParams }: AuthPageProps) {
  const { lang } = await params;
  const { plan, mode } = await searchParams;
  if (!isValidLang(lang)) notFound();
  const l = lang as Lang;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-black/40 backdrop-blur-sm">
        <div className="section-container h-16 flex items-center justify-between">
          <Link href={`/${l}`} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <span className="text-black font-bold text-sm font-display">TC</span>
            </div>
            <span className="font-display font-bold text-base tracking-tight text-foreground group-hover:text-amber-400 transition-colors">
              TRADES-CANADA
            </span>
          </Link>
          <Link href={`/${l}`} className="text-muted-foreground text-sm hover:text-foreground transition-colors font-display">
            {l === "en" ? "← Back to site" : "← Retour au site"}
          </Link>
        </div>
      </header>

      {/* Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Ambient glow */}
          <div className="absolute inset-0 bg-amber-glow pointer-events-none" />
          <div className="relative z-10">
            <AuthForm lang={l} planId={plan} initialMode={(mode as "login" | "signup" | "reset") ?? "login"} />
          </div>
        </div>
      </div>
    </div>
  );
}
