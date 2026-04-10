"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LangError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[lang/error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
          <p className="text-muted-foreground text-sm">
            An unexpected error occurred. Please try again or return home.
          </p>
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded p-3 text-xs font-mono break-all text-left">
            <p className="font-bold mb-1">Error details:</p>
            {error?.message || "Unknown error"}
            {error?.digest && <span className="block mt-1 opacity-70">Ref: {error.digest}</span>}
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
          <Link
            href="/en"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-card border border-border text-foreground rounded-lg font-medium text-sm hover:bg-accent transition-colors"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
