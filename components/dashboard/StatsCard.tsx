import { Card } from "@/components/ui/card";

export default function StatsCard({ title, value, icon: Icon, color = "blue", subtitle }) {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-emerald-50 text-emerald-600",
        orange: "bg-amber-50 text-amber-600",
        purple: "bg-violet-50 text-violet-600",
        red: "bg-rose-50 text-rose-600"
    };

    return (
        <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">{title}</p>
                    <p className="text-3xl font-bold bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent mt-2">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>
                    )}
                </div>
                <div className={`p-3 rounded-xl shadow-md ${colorClasses[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </Card>
    );
}
