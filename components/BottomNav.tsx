import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/lib/utils";
import {
    Calendar,
    Users,
    CreditCard,
    LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { name: "Início", href: "Dashboard", icon: LayoutDashboard },
    { name: "Agenda", href: "Agenda", icon: Calendar },
    { name: "Pacientes", href: "Patients", icon: Users },
    { name: "Financeiro", href: "Financial", icon: CreditCard },
];

export default function BottomNav() {
    const location = useLocation();

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-6 pb-6 pt-2 h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 flex items-center justify-between pointer-events-auto">
            {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.includes(item.href);

                return (
                    <Link
                        key={item.name}
                        to={createPageUrl(item.href)}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 transition-all duration-300 relative px-4",
                            isActive ? "text-blue-600 dark:text-blue-400 scale-110" : "text-slate-400 hover:text-slate-600 dark:text-slate-500"
                        )}
                    >
                        {isActive && (
                            <div className="absolute -top-1 w-1 h-1 bg-current rounded-full" />
                        )}
                        <Icon className={cn("w-6 h-6", isActive && "stroke-[2.5px]")} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{item.name}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
