import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
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

export default function BottomNav({ isDark }) {
    const location = useLocation();

    return (
        <nav
            id="mobile-bottom-nav"
            className={cn(
                "lg:hidden fixed bottom-0 left-0 right-0 z-[100] px-6 pb-6 pt-2 h-20 flex items-center justify-between pointer-events-auto border-t transition-colors duration-300",
                isDark
                    ? "bg-slate-900/90 backdrop-blur-xl border-white/10"
                    : "bg-white/90 backdrop-blur-xl border-slate-200"
            )}
        >
            {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.toLowerCase().includes(item.href.toLowerCase());

                return (
                    <Link
                        key={item.name}
                        to={createPageUrl(item.href)}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 transition-all duration-300 relative px-2 min-w-[64px]",
                            isActive
                                ? "text-blue-600 dark:text-blue-400 scale-110"
                                : isDark ? "text-slate-500" : "text-slate-400"
                        )}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="bottomNavDot"
                                className="absolute -top-1 w-1 h-1 bg-current rounded-full"
                            />
                        )}
                        <Icon className={cn("w-6 h-6", isActive && "stroke-[2.5px]")} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{item.name}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
