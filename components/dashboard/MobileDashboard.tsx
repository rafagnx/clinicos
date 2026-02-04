import React, { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Bell,
    MapPin,
    Search,
    TrendingUp,
    Users,
    DollarSign,
    MessageSquare,
    Menu,
    Activity,
    CheckCircle2,
    AlertCircle,
    Clock,
    Zap,
    Star,
    ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Whimsical Illustration Component
const PlayfulIllustration = ({ type }: { type: 'robot' | 'health' | 'chart' }) => {
    if (type === 'robot') {
        return (
            <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-24 h-24 flex items-center justify-center bg-white/20 rounded-full backdrop-blur-sm"
            >
                <div className="absolute inset-0 bg-pale-yellow/20 rounded-full animate-pulse" />
                <Zap className="w-12 h-12 text-pale-yellow fill-pale-yellow/20" />
                <motion.div
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-2 -right-2 bg-soft-red text-[10px] text-white px-2 py-1 rounded-lg font-bold"
                >
                    IA ON
                </motion.div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ scale: 0.8, rotate: -5 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-24 h-24 bg-white/30 rounded-3xl flex items-center justify-center border-2 border-dashed border-white/50"
        >
            <Activity className="w-12 h-12 text-white/50" />
        </motion.div>
    );
};

// Types
interface MobileDashboardProps {
    user: any;
    stats: {
        todayAppointments: number;
        totalPatients: number;
        pendingConfirmations: number;
        activeProfessionals: number;
    };
    appointments: any[];
}

export default function MobileDashboard({ user, stats, appointments }: MobileDashboardProps) {
    const [activeTab, setActiveTab] = useState("overview");

    // Mock data for the chart (Clinic Occupancy)
    const occupancyData = [
        { time: "08:00", value: 20 },
        { time: "10:00", value: 65 },
        { time: "12:00", value: 45 },
        { time: "14:00", value: 80 },
        { time: "16:00", value: 55 },
        { time: "18:00", value: 30 },
    ];

    // Animation container variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 24
            }
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="min-h-screen bg-sage pb-24 font-sans text-off-black"
        >
            {/* Top Navigation Bar */}
            <motion.header variants={itemVariants} className="px-6 pt-12 pb-6 flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
                        <AvatarImage src={user?.avatar_url || "/rafa-avatar.png"} />
                        <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-sm font-medium text-off-black/70">Olá, {user?.name?.split(' ')[0] || 'Rafa'}!</h1>
                        <div className="flex items-center gap-1 text-off-black font-bold text-lg">
                            <MapPin className="w-4 h-4 text-soft-red" />
                            <span>Clínica Matriz, SP</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button size="icon" variant="ghost" className="bg-white/50 rounded-full text-off-black">
                        <Search className="w-5 h-5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="bg-white/50 rounded-full text-off-black relative">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-soft-red rounded-full" />
                    </Button>
                </div>
            </motion.header>

            {/* Main Content Scroll */}
            <div className="space-y-8">

                {/* Welcome Card with Illustration */}
                <motion.section variants={itemVariants} className="px-6">
                    <div className="bg-dark-gray rounded-[2.5rem] p-6 text-white relative overflow-hidden flex items-center justify-between shadow-xl">
                        <div className="space-y-2 z-10">
                            <h2 className="text-2xl font-bold font-display leading-tight">Relatórios de<br /><span className="text-pale-yellow">Performance</span></h2>
                            <p className="text-white/60 text-sm">Atualizado agora</p>
                            <Button className="bg-pale-yellow text-off-black hover:bg-white font-bold rounded-xl mt-4 h-10">
                                Abrir Análise
                            </Button>
                        </div>
                        <div className="z-10 relative">
                            <motion.img
                                src="/mobile-hero.png"
                                alt="Robot Assistant"
                                className="w-28 h-28 object-contain drop-shadow-2xl"
                                animate={{ y: [0, -8, 0], rotate: [0, 2, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            />
                        </div>
                        {/* Abstract background blobs */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-pale-yellow/10 rounded-full blur-[40px] translate-x-10 -translate-y-10" />
                    </div>
                </motion.section>

                {/* Quick Actions Search */}
                <motion.section variants={itemVariants} className="px-6">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-off-black/30 group-focus-within:text-off-black transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar paciente ou procedimento..."
                            className="w-full h-14 bg-white/50 rounded-2xl pl-12 pr-6 text-off-black font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-off-black/10 transition-all placeholder:text-off-black/30 shadow-inner"
                        />
                    </div>
                </motion.section>

                {/* Reports Section (Horizontal Scroll) */}
                <motion.section variants={itemVariants} className="pl-6">
                    <div className="flex items-center justify-between pr-6 mb-4">
                        <h2 className="text-xl font-display font-bold text-off-black">Relatórios Rápidos</h2>
                        <span className="text-xs font-bold text-off-black/50 uppercase tracking-wider">Ver todos</span>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4 pr-6 scrollbar-hide">
                        {/* Financial Card */}
                        <motion.div
                            whileTap={{ scale: 0.95 }}
                            className="min-w-[160px] bg-pale-yellow rounded-3xl p-5 flex flex-col justify-between h-40 shadow-sm"
                        >
                            <div className="bg-white/30 w-10 h-10 rounded-full flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-off-black" />
                            </div>
                            <div>
                                <span className="text-sm font-medium text-off-black/70">Consultas Hoje</span>
                                <p className="text-2xl font-bold text-off-black mt-1">{stats.todayAppointments}</p>
                            </div>
                        </motion.div>

                        {/* Patients Card */}
                        <motion.div
                            whileTap={{ scale: 0.95 }}
                            className="min-w-[160px] bg-pastel-pink rounded-3xl p-5 flex flex-col justify-between h-40 shadow-sm"
                        >
                            <div className="bg-white/30 w-10 h-10 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-off-black" />
                            </div>
                            <div>
                                <span className="text-sm font-medium text-off-black/70">Total Pacientes</span>
                                <p className="text-2xl font-bold text-off-black mt-1">{stats.totalPatients}</p>
                            </div>
                        </motion.div>

                        {/* Satisfaction Card */}
                        <motion.div
                            whileTap={{ scale: 0.95 }}
                            className="min-w-[160px] bg-cool-blue rounded-3xl p-5 flex flex-col justify-between h-40 shadow-sm"
                        >
                            <div className="bg-white/30 w-10 h-10 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <span className="text-sm font-medium text-white/90">Aguardando</span>
                                <p className="text-2xl font-bold text-white mt-1">{stats.pendingConfirmations}</p>
                            </div>
                        </motion.div>
                    </div>
                </motion.section>

                {/* Clinic Occupancy Chart */}
                <motion.section variants={itemVariants} className="px-6">
                    <div className="bg-white rounded-3xl p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-off-black">Ocupação da Clínica</h3>
                                <p className="text-sm text-gray-500">Capacidade horária</p>
                            </div>
                            <div className="bg-status-success/20 text-status-success text-xs font-bold px-3 py-1 rounded-full">
                                ALTA
                            </div>
                        </div>

                        <div className="h-[180px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={occupancyData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#5A7BEF" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#5A7BEF" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#5A7BEF"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorValue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </motion.section>

                {/* Integrations / Status */}
                <motion.section variants={itemVariants} className="px-6 space-y-4">
                    <h3 className="text-lg font-bold text-off-black">Integrações & Status</h3>

                    <div className="bg-dark-gray rounded-3xl p-5 text-white flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-status-success" />
                            </div>
                            <div>
                                <p className="font-bold">QuickBooks</p>
                                <p className="text-xs text-white/50">Sincronizado há 2m</p>
                            </div>
                        </div>
                        <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full text-status-success">
                            Conectado
                        </span>
                    </div>

                    <div className="bg-white rounded-3xl p-5 flex items-center justify-between shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-bright-orange" />
                            </div>
                            <div>
                                <p className="font-bold text-off-black">Estoque</p>
                                <p className="text-xs text-gray-400">3 itens acabando</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-bright-orange font-bold hover:bg-orange-50">
                            Verificar
                        </Button>
                    </div>
                </motion.section>

                {/* AI Assistant Teaser */}
                <motion.section variants={itemVariants} className="px-6">
                    <div className="bg-cool-blue rounded-3xl p-6 relative overflow-hidden">
                        <div className="relative z-10 text-white">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                                    <MessageSquare className="w-4 h-4 text-cool-blue" />
                                </div>
                                <h3 className="font-bold">Assistente IA</h3>
                            </div>
                            <p className="text-white/80 text-sm mb-4">
                                "Parece que sua agenda de amanhã está 90% cheia. Quer que eu envie lembretes extras?"
                            </p>
                            <Button className="w-full bg-white text-cool-blue hover:bg-white/90 font-bold rounded-xl h-12 shadow-md">
                                Responder
                            </Button>
                        </div>
                        {/* Background Decorations */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />
                    </div>
                </motion.section>

                {/* Operational Timing & Categories */}
                <motion.section variants={itemVariants} className="px-6 grid grid-cols-2 gap-4">
                    {/* Timing Gauge */}
                    <div className="bg-white rounded-3xl p-5 shadow-sm text-center">
                        <h4 className="text-xs font-bold text-off-black/40 uppercase mb-4">Horário Operacional</h4>
                        <div className="relative w-24 h-24 mx-auto mb-4">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
                                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset="62.8" className="text-bright-orange" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xs font-bold">14:30</span>
                                <span className="text-[8px] text-gray-400">UTC-3</span>
                            </div>
                        </div>
                        <p className="text-[10px] font-bold text-gray-500">CLÍNICA ATIVA</p>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="space-y-4">
                        <div className="bg-pale-yellow rounded-2xl p-4 shadow-sm h-1/2">
                            <p className="text-[10px] font-bold opacity-50 uppercase">Ticket Médio</p>
                            <p className="font-bold text-lg">R$ 280</p>
                        </div>
                        <div className="bg-pastel-pink rounded-2xl p-4 shadow-sm h-1/2">
                            <p className="text-[10px] font-bold opacity-50 uppercase">Profissionais</p>
                            <p className="font-bold text-lg">{stats.activeProfessionals}</p>
                        </div>
                    </div>
                </motion.section>

                {/* Categories Section */}
                <motion.section variants={itemVariants} className="pl-6 pb-12">
                    <h3 className="text-lg font-bold text-off-black mb-4">Categorias de Serviço</h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 pr-6 scrollbar-hide">
                        {['Alta Demanda', 'Estética Facial', 'Corporal', 'Protocolos VIP'].map((cat, i) => (
                            <motion.div
                                key={cat}
                                whileTap={{ scale: 0.95 }}
                                className={cn(
                                    "min-w-[140px] p-5 rounded-3xl flex flex-col gap-4 shadow-sm",
                                    i === 0 ? "bg-soft-red text-white" : "bg-white text-off-black"
                                )}
                            >
                                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", i === 0 ? "bg-white/20" : "bg-sage/20")}>
                                    {i === 0 ? <Zap className="w-5 h-5 text-white" /> : <Star className="w-5 h-5 text-off-black" />}
                                </div>
                                <div>
                                    <p className="font-bold leading-tight">{cat}</p>
                                    <p className={cn("text-[10px] lowercase", i === 0 ? "text-white/60" : "text-gray-400")}>12 procedimentos</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>
            </div>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-6 left-6 right-6 bg-dark-gray rounded-3xl p-2 shadow-2xl flex justify-between items-center z-50">
                <Button variant="ghost" className="rounded-2xl h-12 w-12 text-sage hover:bg-white/10">
                    <Activity className="w-6 h-6" />
                </Button>
                <Button variant="ghost" className="rounded-2xl h-12 w-12 text-gray-400 hover:text-white hover:bg-white/10">
                    <Users className="w-6 h-6" />
                </Button>
                <div className="w-14 h-14 bg-bright-orange rounded-full -mt-8 border-4 border-sage flex items-center justify-center shadow-lg transform active:scale-95 transition-transform">
                    <Search className="w-6 h-6 text-white" />
                </div>
                <Button variant="ghost" className="rounded-2xl h-12 w-12 text-gray-400 hover:text-white hover:bg-white/10">
                    <MessageSquare className="w-6 h-6" />
                </Button>
                <Button variant="ghost" className="rounded-2xl h-12 w-12 text-gray-400 hover:text-white hover:bg-white/10">
                    <Menu className="w-6 h-6" />
                </Button>
            </nav>
        </motion.div>
    );
}
