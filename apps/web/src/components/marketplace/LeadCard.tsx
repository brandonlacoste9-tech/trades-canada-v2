import React from "react";
import { formatDistanceToNow } from "date-fns";
import { 
  Building2, 
  MapPin, 
  Clock, 
  DollarSign, 
  Lock,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Lang, useTranslations } from "@/lib/i18n";

interface LeadCardProps {
  id: string;
  title: string;
  source: string;
  location: string;
  projectType: string;
  value?: string | number;
  description?: string;
  createdAt: string | Date;
  isUnlocked?: boolean;
  status?: string;
  email?: string;
  phone?: string;
  lang?: Lang;
}

const LeadCard: React.FC<LeadCardProps> = ({
  title,
  source,
  location,
  projectType,
  value,
  description,
  createdAt,
  isUnlocked = false,
  email,
  phone,
  lang = "en"
}) => {
  const t = useTranslations(lang);
  const relativeTime = typeof createdAt === 'string' 
    ? formatDistanceToNow(new Date(createdAt), { addSuffix: true })
    : formatDistanceToNow(createdAt, { addSuffix: true });

  return (
    <div className={cn(
      "group relative flex flex-col p-6 rounded-2xl border bg-card/50 backdrop-blur-sm transition-all duration-300",
      "hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5",
      isUnlocked ? "border-green-500/30" : "border-border"
    )}>
      {/* Badge Row */}
      <div className="flex justify-between items-center mb-4">
        <span className={cn(
          "px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider",
          source === "Direct Request" || source === "Demande directe"
            ? "bg-amber-100/10 text-amber-500" 
            : "bg-blue-100/10 text-blue-500"
        )}>
          {source}
        </span>
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <Clock size={14} />
          {relativeTime}
        </div>
      </div>

      {/* Title & Core Details */}
      <div className="flex-1">
        <h3 className="text-xl font-bold mb-2 line-clamp-1">{title}</h3>
        
        <div className="grid grid-cols-2 gap-4 my-4">
          <div className="flex items-center gap-2 text-sm text-foreground/80 font-medium">
            <MapPin size={16} className="text-primary" />
            <span className="truncate">{location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground/80 font-medium">
            <Building2 size={16} className="text-primary" />
            <span className="capitalize">{projectType}</span>
          </div>
          {value && (
            <div className="flex items-center gap-2 text-sm text-green-500/80 font-medium">
              <DollarSign size={16} />
              <span>{typeof value === 'number' ? `$${value.toLocaleString()}` : value}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-primary/80 font-medium">
            <ShieldCheck size={16} />
            <span>{t("dashboard.verified")}</span>
          </div>
        </div>

        {description && (
          <p className="text-muted-foreground text-sm line-clamp-3 mb-6 bg-muted/30 p-3 rounded-lg border border-dashed border-border/10">
            {description}
          </p>
        )}
      </div>

      {/* Private Data "Paywall" */}
      <div className="mt-auto pt-6 border-t border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground mb-1 uppercase tracking-tighter">{t("dashboard.verifiedContact")}</span>
            {isUnlocked ? (
              <div className="flex flex-col gap-1 text-green-500 font-medium animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>{t("dashboard.unlocked")}</span>
                </div>
                {email && <span className="text-xs text-foreground/80 font-mono">{email}</span>}
                {phone && <span className="text-xs text-foreground/80 font-mono">{phone}</span>}
              </div>
            ) : (
              <div className="relative overflow-hidden w-24 h-6 rounded flex items-center">
                <div className="absolute inset-0 bg-muted/50 blur-[4px] blur-mask" />
                <span className="relative z-10 text-[10px] text-muted-foreground/50 tracking-widest pl-2 uppercase font-black">
                  {t("dashboard.locked")}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-card/10 to-transparent animate-shimmer" />
              </div>
            )}
          </div>
          
          <button className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all duration-300",
            isUnlocked 
              ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" 
              : "bg-primary text-white hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
          )}>
            {isUnlocked ? t("dashboard.viewDetails") : t("dashboard.unlockLead")}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Unlock Indicator */}
      {!isUnlocked && (
        <div className="absolute top-2 right-2 p-1.5 opacity-20 group-hover:opacity-100 transition-opacity">
          <Lock size={16} className="text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export default LeadCard;
