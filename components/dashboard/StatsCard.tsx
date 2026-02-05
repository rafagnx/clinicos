import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StatsCard({
    title,
    value,
    icon: Icon,
    trend,
    trendUp,
    color = "blue",
    delay = 0,
    isDark = false
}) {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600",
        emerald: "bg-emerald-50 text-emerald-600",
        green: "bg-emerald-50 text-emerald-600",
        amber: "bg-amber-50 text-amber-600",
        orange: "bg-orange-50 text-orange-600",
        indigo: "bg-indigo-50 text-indigo-600",
        purple: "bg-violet-50 text-violet-600",
        violet: "bg-violet-50 text-violet-600",
        rose: "bg-rose-50 text-rose-600",
        red: "bg-red-50 text-red-600",
        cyan: "bg-cyan-50 text-cyan-600",
    };

    return (
        <Card className={cn(
            "p-6 glass-premium border-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-2 group relative overflow-hidden",
            isDark ? "bg-slate-950/40" : "bg-white/40"
        )}>
            {/* Scintillating Light Overlay */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(255,255,255,0.1),transparent_70%)] pointer-events-none"></div>

            <div className="flex items-start justify-between relative z-10">
                <div>
                    <p className={cn(
                        "text-[10px] font-black uppercase tracking-[0.15em] transition-colors mb-1",
                        isDark ? "text-slate-500 group-hover:text-blue-400" : "text-slate-400 group-hover:text-blue-600"
                    )}>
                        {title}
                    </p>
                    <div className="flex items-end gap-2 mt-1">
                        <p className={cn(
                            "text-4xl font-black tracking-tighter",
                            isDark ? "text-white" : "text-slate-900"
                        )}>
                            {value}
                        </p>
                        {trend && (
                            <div className={cn(
                                "flex items-center text-[10px] font-black px-2 py-0.5 rounded-full mb-1 border",
                                trendUp
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            )}>
                                {trendUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                                {trend}
                            </div>
                        )}
                    </div>
                </div>
                <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-all duration-500 group-hover:scale-110 group-hover:rotate-6",
                    isDark ? "bg-white/5 text-white border border-white/10" : "bg-slate-900 text-white shadow-xl"
                )}>
                    {Icon && <Icon className="w-5 h-5" />}
                </div>
            </div>

            {/* Kinetic Bottom Line */}
            <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-blue-500 to-purple-600 group-hover:w-full transition-all duration-700"></div>
        </Card>
    );
}
