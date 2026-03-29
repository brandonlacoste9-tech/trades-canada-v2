import React from "react";
import LeadMarketplace from "@/components/marketplace/LeadMarketplace";

export default function ContractorDashboardPage() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome & Notification Bar */}
      <div className="mb-12 p-6 rounded-3xl bg-gradient-to-br from-primary/10 via-amber-glow-xs to-transparent border border-primary/10 relative overflow-hidden group">
        <div className="absolute inset-0 bg-shimmer-fast opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-foreground tracking-tight">Bonjour, Brandon! 👋</h2>
            <p className="text-muted-foreground font-medium">
              You have <span className="text-primary font-bold">12 new opportunities</span> matching your plumbing specialty in Quebec.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-card/40 p-2 rounded-2xl border border-border/50 backdrop-blur-md">
            <div className="flex -space-x-3 overflow-hidden p-1">
               <img
                className="inline-block h-8 w-8 rounded-full ring-2 ring-background grayscale hover:grayscale-0 transition-all cursor-pointer"
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt="Member"
              />
              <img
                className="inline-block h-8 w-8 rounded-full ring-2 ring-background grayscale hover:grayscale-0 transition-all cursor-pointer"
                src="https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt="Member"
              />
              <img
                className="inline-block h-8 w-8 rounded-full ring-2 ring-background grayscale hover:grayscale-0 transition-all cursor-pointer"
                src="https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt="Member"
              />
            </div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-2">
              Competitive Intel
            </div>
          </div>
        </div>
      </div>

      {/* Main Marketplace Content */}
      <LeadMarketplace lang="en" />
    </div>
  );
}
