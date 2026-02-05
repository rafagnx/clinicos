import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function ScintillatingClock({ isDark }: { isDark: boolean }) {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const hoursMinutes = time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const seconds = time.toLocaleTimeString('pt-BR', { second: '2-digit' });

    return (
        <div className="relative cursor-default select-none group">
            <div className="relative flex items-baseline gap-1">
                {/* Clock Body (Hours, Minutes, Seconds) */}
                <div className="relative flex items-baseline gap-1">
                    {/* Main Gradient Text */}
                    <div className="flex items-baseline gap-1">
                        <span
                            className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 animate-gradient-x filter drop-shadow-sm"
                        >
                            {hoursMinutes}
                        </span>
                        <span className="text-xl md:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 animate-gradient-x opacity-80 tabular-nums">
                            {seconds}
                        </span>
                    </div>

                    {/* Overlay for Green Flash Pulse (Whole Clock) */}
                    <div
                        key={time.getTime()}
                        className="absolute inset-0 flex items-baseline gap-1 pointer-events-none opacity-0 animate-[flash-green_1s_ease-out]"
                        aria-hidden="true"
                    >
                        <span className="text-4xl md:text-5xl font-black tracking-tighter text-emerald-400 filter blur-[1px]">
                            {hoursMinutes}
                        </span>
                        <span className="text-xl md:text-2xl font-black text-emerald-400 filter blur-[1px] tabular-nums">
                            {seconds}
                        </span>
                    </div>
                </div>
            </div>

            {/* Inline Style for Custom Flash Animation */}
            <style>{`
                @keyframes flash-green {
                    0% { opacity: 0.6; transform: scale(1.01); }
                    100% { opacity: 0; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
