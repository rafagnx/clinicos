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
            "p-6 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 duration-300 group",
            isDark ? "bg-slate-900/50 border-slate-800" : "bg-white/80 border-slate-200/60"
        )}>
            <div className="flex items-start justify-between">
                <div>
                    <p className={cn(
                        "text-sm font-semibold uppercase tracking-wide transition-colors",
                        isDark ? "text-slate-400 group-hover:text-indigo-400" : "text-slate-500 group-hover:text-indigo-600"
                    )}>
                        {title}
                    </p>
                    <div className="flex items-end gap-3 mt-2">
                        <p className={cn(
                            "text-3xl font-bold bg-clip-text text-transparent",
                            isDark ? "bg-gradient-to-br from-white to-slate-400" : "bg-gradient-to-br from-slate-800 to-slate-600"
                        )}>
                            {value}
                        </p>
                        {trend && (
                            <div className={cn(
                                "flex items-center text-xs font-bold px-1.5 py-0.5 rounded mb-1",
                                trendUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                            )}>
                                {trendUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                                {trend}
                            </div>
                        )}
                    </div>
                </div>
                <div className={cn(
                    "p-3 rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-110",
                    colorClasses[color] || colorClasses.blue
                )}>
                    {Icon && <Icon className="w-6 h-6" />}
                </div>
            </div>
            {/* Ambient Glow */}
            <div className={cn(
                "absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none blur-2xl",
                colorClasses[color]?.split(" ")[0].replace("bg-", "bg-")
            )} />
        </Card>
    );
}
