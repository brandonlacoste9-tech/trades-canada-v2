import React from "react";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

export default function ContractorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar lang="en" /> {/* Default to EN for dashboard for now */}
      <main className="flex-1 container py-8 mt-16 pb-24">
        {children}
      </main>
      <Footer lang="en" />
    </div>
  );
}
