import { ContentCalendar } from "@/components/marketing/ContentCalendar";
import { cn } from "@/lib/utils";
import { useOutletContext } from "react-router-dom";
import { Megaphone, Calendar } from "lucide-react";

export default function MarketingPage() {
    const { isDark } = useOutletContext<{ isDark: boolean }>();

    return (
        <div className={cn("p-4 lg:p-6 max-w-[100vw] mx-auto min-h-screen relative overflow-hidden flex flex-col space-y-4")}>

            {/* Header Liquid Scale */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[8px] font-black uppercase tracking-widest mb-1 backdrop-blur-md">
                        <Megaphone className="w-2.5 h-2.5 animate-pulse" /> ESTRATÉGIA DIGITAL
                    </div>
                    <h1 className={cn("text-3xl md:text-5xl font-black mb-1 tracking-tighter leading-[0.85] filter drop-shadow-sm", isDark ? "text-white" : "text-slate-900")}>
                        MARKETING & <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400 animate-gradient-x select-none">CONTEÚDO</span>
                    </h1>
                    <p className={cn("text-xs md:text-sm font-bold tracking-tight opacity-60 flex items-center gap-2", isDark ? "text-slate-400" : "text-slate-600")}>
                        <span className="h-1.5 w-1.5 rounded-full bg-pink-500 animate-pulse" />
                        Planejamento de campanhas e calendário editorial.
                    </p>
                </div>
            </div>

            {/* Content Calendar Wrapper */}
            <div className={cn(
                "rounded-[2.5rem] glass-premium border-white/5 relative z-10 overflow-hidden shadow-2xl transition-all",
                isDark ? "bg-slate-950/20" : "bg-white/40"
            )}>
                <ContentCalendar />
            </div>
        </div>
    );
}
