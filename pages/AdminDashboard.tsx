import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Activity,
    Users,
    ShoppingCart,
    Eye,
    TrendingUp,
    TrendingDown,
    DollarSign,
    MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAdminTheme } from "./admin/AdminLayout";

export default function AdminDashboard() {
    const { isDark } = useAdminTheme();

    // Stats Configuration
    const stats = [
        {
            title: "Total Revenue",
            value: "$124,563",
            trend: "+12.5%",
            trendUp: true,
            icon: DollarSign,
            color: "text-emerald-500",
            bgColor: "bg-emerald-500/10",
            barColor: "bg-emerald-500",
            progress: 75
        },
        {
            title: "Active Users",
            value: "8,549",
            trend: "+8.2%",
            trendUp: true,
            icon: Users,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
            barColor: "bg-blue-500",
            progress: 60
        },
        {
            title: "Total Orders",
            value: "2,847",
            trend: "+15.3%",
            trendUp: true,
            icon: ShoppingCart,
            color: "text-purple-500",
            bgColor: "bg-purple-500/10",
            barColor: "bg-purple-500",
            progress: 45
        },
        {
            title: "Page Views",
            value: "45,892",
            trend: "-2.1%",
            trendUp: false,
            icon: Eye,
            color: "text-orange-500",
            bgColor: "bg-orange-500/10",
            barColor: "bg-orange-500",
            progress: 30
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header / Welcome */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                        Welcome back, Alex! Here's what's happening today.
                    </p>
                </div>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Card
                        key={i}
                        className={cn(
                            "border-none shadow-lg relative overflow-hidden transition-all duration-300",
                            isDark ? "bg-[#1C2333]" : "bg-white"
                        )}
                    >
                        <CardContent className="p-6 relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-1">
                                    <p className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                                        {stat.title}
                                    </p>
                                    <h3 className={cn("text-3xl font-bold", isDark ? "text-white" : "text-slate-900")}>
                                        {stat.value}
                                    </h3>
                                </div>
                                <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <span className={stat.trendUp ? "text-emerald-500" : "text-red-500"}>
                                        {stat.trend}
                                    </span>
                                    <span className={isDark ? "text-slate-500" : "text-slate-400"}>vs last month</span>
                                </div>
                            </div>

                            {/* Progress Bar visual at bottom */}
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800/50">
                                <div
                                    className={cn("h-full transition-all duration-1000 ease-out", stat.barColor)}
                                    style={{ width: `${stat.progress}%` }}
                                ></div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Section Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Overview (Bar Chart Simulation) */}
                <Card className={cn("lg:col-span-2 border-none shadow-lg", isDark ? "bg-[#1C2333]" : "bg-white")}>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className={cn("text-lg font-semibold", isDark ? "text-white" : "text-slate-900")}>
                                Revenue Overview
                            </CardTitle>
                            <p className="text-sm text-slate-500">Monthly revenue and expenses</p>
                        </div>
                        <div className="flex gap-4 text-xs font-medium">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                <span className={isDark ? "text-slate-300" : "text-slate-600"}>Revenue</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                                <span className={isDark ? "text-slate-300" : "text-slate-600"}>Expenses</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full flex items-end justify-between gap-2 pt-8 px-2">
                            {[40, 65, 45, 70, 50, 60, 55, 80, 75, 85, 90, 60].map((h, i) => (
                                <div key={i} className="flex-1 flex gap-1 h-full items-end group">
                                    <div
                                        className="flex-1 bg-indigo-500 rounded-t-sm hover:bg-indigo-400 transition-all cursor-pointer relative"
                                        style={{ height: `${h}%` }}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            ${h}k
                                        </div>
                                    </div>
                                    <div
                                        className="flex-1 bg-slate-700/50 rounded-t-sm hover:bg-slate-600 transition-all cursor-pointer"
                                        style={{ height: `${h * 0.6}%` }}
                                    ></div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-4 text-xs text-slate-500 px-2 uppercase font-medium">
                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                                <span key={m}>{m}</span>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Categories (Donut Chart Simulation) */}
                <Card className={cn("lg:col-span-1 border-none shadow-lg", isDark ? "bg-[#1C2333]" : "bg-white")}>
                    <CardHeader>
                        <CardTitle className={cn("text-lg font-semibold", isDark ? "text-white" : "text-slate-900")}>
                            Sales by Category
                        </CardTitle>
                        <p className="text-sm text-slate-500">Product distribution</p>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center pt-8">
                        <div className="relative w-48 h-48 rounded-full border-[1.5rem] border-transparent"
                            style={{
                                backgroundImage: `conic-gradient(#6366f1 0deg 162deg, #8b5cf6 162deg 270deg, #10b981 270deg 324deg, #f59e0b 324deg 360deg)`
                            }}
                        >
                            <div className={cn("absolute inset-0 m-auto w-32 h-32 rounded-full", isDark ? "bg-[#1C2333]" : "bg-white")}></div>
                        </div>

                        <div className="w-full mt-8 space-y-4">
                            {[
                                { label: 'Electronics', val: '45%', color: 'bg-indigo-500' },
                                { label: 'Clothing', val: '30%', color: 'bg-purple-500' },
                                { label: 'Books', val: '15%', color: 'bg-emerald-500' },
                                { label: 'Other', val: '10%', color: 'bg-amber-500' }
                            ].map((c, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-3 h-3 rounded-full", c.color)}></div>
                                        <span className={isDark ? "text-slate-300" : "text-slate-600"}>{c.label}</span>
                                    </div>
                                    <span className={cn("font-medium", isDark ? "text-white" : "text-slate-900")}>{c.val}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
