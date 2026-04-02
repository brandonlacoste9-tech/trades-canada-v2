import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-2">
            <p className="text-8xl font-black text-primary/20">404</p>
            <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
            <p className="text-muted-foreground text-sm">
              The page you are looking for does not exist or has been moved.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Link
              href="/en"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              <Home className="w-4 h-4" />
              Go home
            </Link>
            <Link
              href="/en/auth"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-card border border-border text-foreground rounded-lg font-medium text-sm hover:bg-accent transition-colors"
            >
              Contractor Login
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
