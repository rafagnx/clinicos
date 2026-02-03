import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, Check, Star, Zap, BarChart3, Users,
    Calendar, FileText, Smartphone, MessageCircle, ShieldCheck, HeartPulse,
    Activity, DollarSign, ChevronDown, Quote, TrendingUp, Award, ImageIcon
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from 'react-router-dom';

// --- Components ---

const CountUp = ({ end, duration = 2 }: { end: number; duration?: number }) => {
    const [count, setCount] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        if (hasAnimated) return;
        setHasAnimated(true);

        let start = 0;
        const increment = end / (duration * 60);
        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 1000 / 60);
        return () => clearInterval(timer);
    }, [end, duration, hasAnimated]);

    return <span>{count}</span>;
};





const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={cn(
            "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
            scrolled ? "bg-slate-950/80 backdrop-blur-md border-slate-800 py-4 shadow-lg shadow-purple-900/10" : "bg-transparent py-6"
        )}>
            <div className="container mx-auto px-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img src="/logo-clinica.png" alt="Logo" className="w-8 h-8 rounded-lg bg-white p-1" />
                    <div className="text-2xl font-black tracking-tighter text-white">
                        Clinic<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">OS</span>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
                    <a href="#recursos" className="hover:text-white transition-colors">Recursos</a>
                    <a href="#depoimentos" className="hover:text-white transition-colors">Depoimentos</a>
                    <a href="#galeria" className="hover:text-white transition-colors">Galeria</a>
                    <a href="#planos" className="hover:text-white transition-colors">Planos</a>
                    <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
                    <Link to="/register">
                        <Button className="bg-white text-slate-950 hover:bg-slate-200 font-bold rounded-full px-6 transition-all hover:scale-105">
                            Criar Conta Grátis
                        </Button>
                    </Link>
                </div>
            </div>
        </nav>
    );
};

const Hero = () => {
    return (
        <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-slate-950">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(59,130,246,0.15),rgba(15,23,42,1))]"></div>
            <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]"></div>

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>

            <div className="container mx-auto px-6 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/50 text-blue-400 text-xs font-bold uppercase tracking-wider mb-8 hover:border-blue-500/50 transition-colors cursor-default backdrop-blur-sm shadow-xl">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        O Sistema O.S. nº 1 para Estética
                    </div>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1.1] mb-8"
                >
                    Sua Clínica <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-gradient-x">
                        High Ticket
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed font-light"
                >
                    O único sistema com <strong>CRM Comportamental</strong> integrado. Identifique o perfil do paciente, rastreie o ROI dos Ads e transforme consultas em <span className="text-white font-medium border-b border-blue-500/30">experiências premium</span>.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-5"
                >
                    <Link to="/register">
                        <Button size="lg" className="h-16 px-10 text-lg font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:shadow-[0_0_50px_rgba(37,99,235,0.6)] transition-all transform hover:-translate-y-1">
                            Testar Grátis Agora <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </Link>
                    <Link to="/login">
                        <Button size="lg" variant="outline" className="h-16 px-8 text-lg font-medium border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white rounded-full backdrop-blur-sm">
                            Já tenho conta
                        </Button>
                    </Link>
                </motion.div>
            </div>

            {/* Floating High Ticket Cards - "Nuvem de Inteligência" */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                {/* 1. Card Faturamento (Center Bottom - Lowered base) */}
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2"
                >
                    <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-4 pl-6 pr-8 rounded-2xl shadow-2xl shadow-blue-500/30 flex items-center gap-4 hover:scale-105 transition-transform cursor-default ring-1 ring-white/20">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Faturamento Hoje</div>
                            <div className="text-2xl font-black text-white tracking-tight">R$ 18.250,00</div>
                        </div>
                        <div className="ml-4 flex flex-col items-end">
                            <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Activity className="w-3 h-3" /> +24%
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 2. Card Behavioral (Lower Left) */}
                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                    className="absolute bottom-20 left-[5%] lg:left-[10%] hidden md:block"
                >
                    <div className="bg-slate-800/60 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-xl shadow-purple-500/10 flex items-center gap-3 -rotate-6 hover:rotate-0 transition-transform">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-xl">🧠</div>
                        <div>
                            <div className="text-[10px] text-purple-300 font-bold">Perfil Identificado</div>
                            <div className="text-sm font-bold text-white">Analítico</div>
                        </div>
                    </div>
                </motion.div>

                {/* 3. Card ADS (Lower Right) */}
                <motion.div
                    animate={{ y: [0, -15, 0] }}
                    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-16 right-[5%] lg:right-[10%] hidden md:block"
                >
                    <div className="bg-slate-800/60 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-xl shadow-emerald-500/10 flex items-center gap-3 rotate-3 hover:rotate-0 transition-transform">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <div className="text-[10px] text-emerald-300 font-bold">ROI Tráfego (Ads)</div>
                            <div className="text-sm font-bold text-white">840% Retorno</div>
                        </div>
                    </div>
                </motion.div>

                {/* 4. WOW FACTOR: Card WhatsApp (Upper Left - Floating High) */}
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 0.5 }}
                    className="absolute top-32 left-[5%] lg:left-[15%] hidden lg:block opacity-60 hover:opacity-100 transition-opacity"
                >
                    <div className="bg-slate-800/40 backdrop-blur-sm border border-white/5 p-2 rounded-lg flex items-center gap-2 rotate-12">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                            <MessageCircle className="w-4 h-4 text-green-400" />
                        </div>
                        <div className="text-[10px] text-slate-300 max-w-[80px] leading-tight">Confirmado via WhatsApp</div>
                    </div>
                </motion.div>

                {/* 5. WOW FACTOR: Security (Upper Right - Floating High) */}
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 1.5 }}
                    className="absolute top-40 right-[5%] lg:right-[15%] hidden lg:block opacity-60 hover:opacity-100 transition-opacity"
                >
                    <div className="bg-slate-800/40 backdrop-blur-sm border border-white/5 p-2 rounded-lg flex items-center gap-2 -rotate-12">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <ShieldCheck className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="text-[10px] text-slate-300 max-w-[80px] leading-tight">Backup Realizado</div>
                    </div>
                </motion.div>

                {/* Ambient Glows */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[200px] bg-blue-600/10 blur-[80px] rounded-full pointer-events-none"></div>
            </div>
        </section>
    );
};

const Features = () => {
    const features = [
        { icon: Calendar, title: "Agenda Raio-X", desc: "Veja a origem (Ads/Indicação) e o perfil do paciente (Analítico/Emocional) direto no agendamento." },
        { icon: Users, title: "CRM Comportamental", desc: "Mapeie temperamentos e dores emocionais. Venda a transformação, não o procedimento." },
        { icon: BarChart3, title: "Gestão Financeira & ROI", desc: "Saiba exatamente quanto retorna de cada campanha de tráfego pago." },
        { icon: Zap, title: "Automação de Vendas", desc: "Recuperação automática de leads e follow-up inteligente via WhatsApp." },
        { icon: FileText, title: "Prontuário High Ticket", desc: "Anamnese que foca nos sonhos e na consciência de compra do paciente." },
        { icon: ShieldCheck, title: "Segurança Total", desc: "Seus dados blindados com backups diários e acesso hierárquico." }
    ];

    return (
        <section id="recursos" className="py-32 bg-slate-950 relative z-10">
            <div className="container mx-auto px-6">
                <div className="text-center mb-20 animate-on-scroll">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Tudo em <span className="text-blue-500">Um Lugar</span></h2>
                    <p className="text-slate-400 max-w-xl mx-auto text-lg">Substitua 5 ferramentas desconexas pelo ClinicOS.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            className="group p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/30 transition-all duration-300 hover:bg-slate-900 hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden backdrop-blur-sm"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 text-blue-400 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                <item.icon className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
                            <p className="text-slate-400 leading-relaxed text-sm">
                                {item.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const MockupSection = () => {
    return (
        <section className="py-32 bg-slate-950 overflow-hidden relative">
            {/* Background Light */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-[100px] -z-10"></div>

            <div className="container mx-auto px-6">
                <div className="flex flex-col lg:flex-row items-center gap-20">
                    <div className="lg:w-1/2 order-2 lg:order-1">
                        <div className="relative">
                            {/* Phone Mockup */}
                            <motion.div
                                initial={{ y: 0 }}
                                animate={{ y: [0, -15, 0] }}
                                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                                className="relative z-10 mx-auto w-64"
                            >
                                {/* Phone Frame */}
                                <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] border-8 border-slate-900 shadow-2xl shadow-purple-900/50 overflow-hidden">
                                    {/* Screen */}
                                    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 p-6 aspect-[9/19.5] flex flex-col">
                                        {/* Status Bar */}
                                        <div className="flex justify-between items-center mb-8 text-white/60 text-xs">
                                            <span>9:41</span>
                                            <div className="flex gap-1">
                                                <div className="w-4 h-4 rounded-full bg-white/20"></div>
                                                <div className="w-4 h-4 rounded-full bg-white/20"></div>
                                                <div className="w-4 h-4 rounded-full bg-white/40"></div>
                                            </div>
                                        </div>

                                        {/* ClinicOS Logo & Title */}
                                        <div className="text-center mb-6">
                                            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg">
                                                <Activity className="w-8 h-8 text-white" strokeWidth={2.5} />
                                            </div>
                                            <h3 className="text-white font-bold text-lg">ClinicOS</h3>
                                            <p className="text-slate-400 text-xs">Painel de Controle</p>
                                        </div>

                                        {/* Mini Stats */}
                                        <div className="grid grid-cols-2 gap-2 mt-auto">
                                            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-3">
                                                <div className="text-xs text-slate-400">Hoje</div>
                                                <div className="text-white font-bold">12 Consultas</div>
                                            </div>
                                            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-3">
                                                <div className="text-xs text-slate-400">Agenda</div>
                                                <div className="text-white font-bold">100% Livre</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Cascading Notification Cards */}
                            <motion.div
                                initial={{ x: -30, opacity: 0 }}
                                whileInView={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3, duration: 0.6 }}
                                className="hidden md:block absolute top-8 -left-6 md:-left-16 bg-gradient-to-br from-violet-500/10 to-purple-500/10 backdrop-blur-xl p-3 rounded-2xl border border-violet-500/20 shadow-2xl shadow-violet-500/20 max-w-[200px]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center text-2xl">
                                        🧠
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-violet-300 font-bold uppercase tracking-wider">Novo Lead</div>
                                        <div className="text-sm font-bold text-white">Perfil Analítico</div>
                                        <div className="text-[10px] text-slate-400">Veio do Google Ads</div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ x: -30, opacity: 0 }}
                                whileInView={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.6 }}
                                className="hidden md:block absolute top-32 -left-4 md:-left-12 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl p-3 rounded-2xl border border-blue-500/20 shadow-2xl shadow-blue-500/20 max-w-[170px]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                        <HeartPulse className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-blue-400 font-semibold">Prontuário</div>
                                        <div className="text-sm font-bold text-white">Atualizado</div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ x: 30, opacity: 0 }}
                                whileInView={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.7, duration: 0.6 }}
                                className="hidden md:block absolute bottom-24 -right-4 md:-right-12 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl p-3 rounded-2xl border border-purple-500/20 shadow-2xl shadow-purple-500/20 max-w-[170px]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                        <MessageCircle className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-purple-400 font-semibold">WhatsApp</div>
                                        <div className="text-sm font-bold text-white">Nova Mensagem</div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ x: 30, opacity: 0 }}
                                whileInView={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.9, duration: 0.6 }}
                                className="hidden md:block absolute bottom-8 -right-6 md:-right-16 bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-xl p-2.5 rounded-2xl border border-amber-500/20 shadow-2xl shadow-amber-500/20 max-w-[150px]"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                                        <DollarSign className="w-4 h-4 text-amber-400" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-amber-400 font-semibold">Pagamento</div>
                                        <div className="text-xs font-bold text-white">R$ 350,00</div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    <div className="lg:w-1/2 order-1 lg:order-2">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                            A Clínica na <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Palma da Mão</span>
                        </h2>
                        <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                            Liberdade geográfica real. Acompanhe o desempenho da sua equipe, financeiro e agenda através do nosso aplicativo mobile otimizado (PWA).
                        </p>

                        <ul className="space-y-4 mb-8">
                            {[
                                "Acesso 100% Mobile e Tablet",
                                "Modo Offline Inteligente",
                                "Notificações Push em Tempo Real"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                                        <Check className="w-3 h-3" strokeWidth={3} />
                                    </div>
                                    <span className="text-slate-300 font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>

                        {/* Trust Badges */}
                        <div className="flex flex-wrap gap-3 mb-6">
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                whileInView={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg shadow-green-500/30 flex items-center gap-2"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                Sem Cartão de Crédito
                            </motion.div>

                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                whileInView={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.3, type: "spring" }}
                                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2"
                            >
                                <Zap className="w-4 h-4" />
                                Garantia 7 Dias
                            </motion.div>
                        </div>

                        {/* Social Proof - Support */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-4 inline-block mb-6"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
                                    <MessageCircle className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-white">
                                        Suporte Humanizado
                                    </div>
                                    <div className="text-xs text-slate-400">Atendimento Especializado</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Testimonial */}
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-4 max-w-md mb-8"
                        >
                            <div className="flex items-start gap-3">
                                <img
                                    src="https://i.pravatar.cc/150?img=12"
                                    alt="Dr. Carlos"
                                    className="w-12 h-12 rounded-full border-2 border-purple-500"
                                />
                                <div>
                                    <p className="text-sm text-slate-300 italic mb-2">
                                        "Economizei 15h/semana. Sem mais planilhas!"
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <div className="text-xs text-white font-semibold">Dr. Carlos Mendes</div>
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <Button className="h-12 px-8 bg-slate-800 hover:bg-slate-700 text-white rounded-full">
                            Conhecer o App
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
};

// --- NEW SECTIONS ---

const Testimonials = () => {
    const testimonials = [
        {
            name: "Dra. Amanda Silva",
            role: "Harmonização Orofacial - SP",
            image: "https://i.pravatar.cc/150?img=5",
            quote: "O ClinicOS mudou completamente minha rotina. Antes eu perdia horas com planilhas, agora tudo está automatizado. Meu faturamento cresceu 40% em 3 meses.",
            rating: 5
        },
        {
            name: "Dr. Ricardo Mendes",
            role: "Dermatologista - RJ",
            image: "https://i.pravatar.cc/150?img=8",
            quote: "A integração com WhatsApp é fantástica! Reduzimos os no-shows em 70% com as confirmações automáticas. Recomendo demais.",
            rating: 5
        },
        {
            name: "Dra. Fernanda Costa",
            role: "Clínica de Estética - MG",
            image: "https://i.pravatar.cc/150?img=9",
            quote: "O CRM Comportamental é um diferencial. Consigo entender melhor minhas pacientes e oferecer o procedimento certo. Vendas aumentaram 60%!",
            rating: 5
        },
        {
            name: "Dr. Paulo Andrade",
            role: "Implantodontia - PR",
            image: "https://i.pravatar.cc/150?img=11",
            quote: "Finalmente um sistema que entende clínicas de alto padrão. Prontuários completos, gestão financeira robusta. Vale cada centavo.",
            rating: 5
        }
    ];

    return (
        <section id="depoimentos" className="py-32 bg-slate-950 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>

            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider mb-6">
                            <Star className="w-3 h-3 fill-current" />
                            Depoimentos Reais
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                            O Que Nossos <span className="text-purple-500">Clientes</span> Dizem
                        </h2>
                        <p className="text-slate-400 max-w-xl mx-auto text-lg">
                            Mais de 500 clínicas já transformaram sua gestão com o ClinicOS.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                    {testimonials.map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 hover:border-purple-500/30 transition-all group"
                        >
                            <div className="flex gap-1 mb-4">
                                {[...Array(item.rating)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                ))}
                            </div>
                            <Quote className="w-8 h-8 text-purple-500/30 mb-3" />
                            <p className="text-slate-300 mb-6 leading-relaxed italic">
                                "{item.quote}"
                            </p>
                            <div className="flex items-center gap-4">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-12 h-12 rounded-full border-2 border-purple-500/50"
                                />
                                <div>
                                    <div className="font-bold text-white">{item.name}</div>
                                    <div className="text-sm text-slate-500">{item.role}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const ScreenshotsGallery = () => {
    const screenshots = [
        { title: "Agenda Inteligente", desc: "Visualize consultas, origem do lead e perfil comportamental", img: "/screenshots/agenda.png" },
        { title: "Prontuário Completo", desc: "Fotos antes/depois, anamnese e histórico clínico", img: "/screenshots/prontuario.png" },
        { title: "Dashboard Financeiro", desc: "Faturamento, ROI de campanhas e métricas em tempo real", img: "/screenshots/dashboard.png" },
        { title: "CRM de Retenção", desc: "Pacientes inativos e oportunidades de retorno", img: "/screenshots/retencao.png" },
    ];

    return (
        <section id="galeria" className="py-32 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
                            <ImageIcon className="w-3 h-3" />
                            Galeria
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                            Veja o <span className="text-blue-500">Sistema</span> em Ação
                        </h2>
                        <p className="text-slate-400 max-w-xl mx-auto text-lg">
                            Interface moderna, intuitiva e pensada para clínicas de alto padrão.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                    {screenshots.map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="group relative rounded-2xl overflow-hidden border border-slate-800 hover:border-blue-500/50 transition-all bg-slate-900"
                        >
                            {/* Placeholder for screenshot */}
                            <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                                <div className="text-center p-8">
                                    <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                                        <ImageIcon className="w-8 h-8 text-blue-400" />
                                    </div>
                                    <div className="text-white font-bold text-lg mb-2">{item.title}</div>
                                    <div className="text-slate-500 text-sm">{item.desc}</div>
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const faqs = [
        {
            q: "Preciso de cartão de crédito para testar?",
            a: "Não! O teste de 7 dias é 100% gratuito e não requer nenhuma forma de pagamento. Você só paga se decidir continuar após o período de teste."
        },
        {
            q: "Posso migrar meus dados de outro sistema?",
            a: "Sim! Nossa equipe de suporte auxilia na importação de dados de planilhas ou outros sistemas. A migração é gratuita para novos assinantes."
        },
        {
            q: "Existe limite de pacientes ou profissionais?",
            a: "Não existe nenhum limite. Você pode cadastrar quantos pacientes e profissionais precisar, sem custos adicionais."
        },
        {
            q: "O sistema funciona no celular?",
            a: "Sim! O ClinicOS é 100% responsivo e funciona em qualquer dispositivo. Também oferecemos app progressivo (PWA) para instalação no celular."
        },
        {
            q: "Como funciona a integração com WhatsApp?",
            a: "Integramos via API oficial e Evolution API. Confirmações automáticas, lembretes 24h antes, e campanhas de retorno são enviados automaticamente."
        },
        {
            q: "Meus dados estão seguros?",
            a: "Absolutamente. Usamos criptografia SSL, backups diários automáticos, e hospedagem em servidores certificados. Conformidade total com LGPD."
        }
    ];

    return (
        <section id="faq" className="py-32 bg-slate-950 relative">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6">
                            Dúvidas Frequentes
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                            Perguntas <span className="text-emerald-500">Frequentes</span>
                        </h2>
                    </motion.div>
                </div>

                <div className="max-w-3xl mx-auto space-y-4">
                    {faqs.map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                                className="w-full text-left bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-emerald-500/30 transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-white">{item.q}</span>
                                    <ChevronDown className={cn(
                                        "w-5 h-5 text-slate-400 transition-transform",
                                        openIndex === idx && "rotate-180 text-emerald-400"
                                    )} />
                                </div>
                                <AnimatePresence>
                                    {openIndex === idx && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <p className="text-slate-400 mt-4 text-sm leading-relaxed">
                                                {item.a}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const CaseStudies = () => {
    const cases = [
        {
            clinic: "Clínica Harmonize",
            location: "São Paulo - SP",
            image: "https://i.pravatar.cc/150?img=25",
            stats: [
                { label: "Aumento no Faturamento", value: "+127%" },
                { label: "Redução de No-Shows", value: "-68%" },
                { label: "Tempo Economizado/Semana", value: "12h" }
            ],
            quote: "Em 6 meses, triplicamos nossa capacidade de atendimento sem contratar mais funcionários.",
            owner: "Dra. Juliana Martins"
        },
        {
            clinic: "Instituto Belle Santé",
            location: "Rio de Janeiro - RJ",
            image: "https://i.pravatar.cc/150?img=32",
            stats: [
                { label: "ROI de Tráfego Pago", value: "840%" },
                { label: "Novos Pacientes/Mês", value: "+45" },
                { label: "Taxa de Retorno", value: "78%" }
            ],
            quote: "O rastreamento de origem dos leads mudou completamente nossa estratégia de marketing.",
            owner: "Dr. André Bastos"
        }
    ];

    return (
        <section id="casos" className="py-32 bg-gradient-to-b from-slate-950 to-slate-900 relative overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-6">
                            <Award className="w-3 h-3" />
                            Casos de Sucesso
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                            Resultados <span className="text-amber-500">Reais</span>
                        </h2>
                        <p className="text-slate-400 max-w-xl mx-auto text-lg">
                            Veja como clínicas transformaram seus resultados com o ClinicOS.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {cases.map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.2 }}
                            className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 hover:border-amber-500/30 transition-all"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <img
                                    src={item.image}
                                    alt={item.clinic}
                                    className="w-16 h-16 rounded-2xl border-2 border-amber-500/50"
                                />
                                <div>
                                    <div className="font-bold text-white text-xl">{item.clinic}</div>
                                    <div className="text-slate-500">{item.location}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                {item.stats.map((stat, i) => (
                                    <div key={i} className="text-center bg-slate-800/50 rounded-xl p-3">
                                        <div className="text-2xl font-black text-amber-400">{stat.value}</div>
                                        <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
                                    </div>
                                ))}
                            </div>

                            <blockquote className="text-slate-300 italic mb-4 border-l-2 border-amber-500/50 pl-4">
                                "{item.quote}"
                            </blockquote>
                            <div className="text-sm text-slate-500">— {item.owner}</div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const Pricing = () => {
    return (
        <section id="planos" className="py-32 bg-slate-950 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>

            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Simplifique. <span className="text-blue-500">Um Plano, Tudo Incluso.</span></h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                        Sem pegadinhas, sem limites ocultos. Você tem acesso a 100% da plataforma durante o teste.
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="relative p-1 rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-2xl shadow-blue-900/40">
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-6 py-2 rounded-full font-black uppercase tracking-wider text-sm shadow-xl flex items-center gap-2 z-20">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            7 Dias Grátis
                        </div>

                        <div className="bg-slate-900 rounded-[22px] p-8 md:p-12 relative overflow-hidden h-full">
                            <div className="flex flex-col md:flex-row gap-12 items-center">
                                {/* Left Side: Price & CTA */}
                                <div className="md:w-1/2 text-center md:text-left">
                                    <h3 className="text-2xl font-bold text-white mb-2">ClinicOS <span className="text-purple-400">PRO</span></h3>
                                    <p className="text-slate-400 mb-8">Gestão completa para clínicas que querem crescer.</p>

                                    <div className="flex items-end justify-center md:justify-start gap-2 mb-8">
                                        <span className="text-lg text-slate-500 line-through mb-2">R$ 297</span>
                                        <div className="text-6xl font-black text-white tracking-tight">R$ 197</div>
                                        <span className="text-slate-500 font-medium mb-2">/mês</span>
                                    </div>

                                    <Link to="/register">
                                        <Button className="w-full h-16 text-xl font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-900/20 mb-4 transition-all hover:scale-105">
                                            Começar Teste Grátis
                                        </Button>
                                    </Link>
                                    <p className="text-xs text-center text-slate-500">
                                        Cancele a qualquer momento. Nenhum valor será cobrado hoje.
                                    </p>
                                </div>

                                {/* Right Side: Features */}
                                <div className="md:w-1/2 w-full bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                                    <div className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-6 pb-4 border-b border-slate-700">O que está incluso:</div>
                                    <ul className="space-y-4">
                                        {[
                                            "Agenda Inteligente & Confirmações",
                                            "Prontuário e Ficha de Anamnese",
                                            "Gestão Financeira Completa",
                                            "Sem limite de Profissionais",
                                            "Sem limite de Pacientes",
                                            "Fotos de Antes e Depois",
                                            "Suporte Prioritário WhatsApp",
                                            "Acesso Mobile (App)"
                                        ].map((feat, i) => (
                                            <li key={i} className="flex items-start gap-3 text-slate-300 font-medium">
                                                <div className="mt-1 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 shrink-0">
                                                    <Check className="w-3 h-3" strokeWidth={3} />
                                                </div>
                                                {feat}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Guarantee */}
                <div className="mt-12 text-center max-w-2xl mx-auto flex items-center justify-center gap-4 text-slate-400 opacity-80 hover:opacity-100 transition-opacity">
                    <ShieldCheck className="w-6 h-6 text-slate-300" />
                    <p>Experimente por 7 dias. Se não amar, você não paga nem um centavo.</p>
                </div>
            </div>
        </section>
    );
};

const FinalCTA = () => {
    return (
        <section className="py-40 bg-slate-950 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),rgba(15,23,42,1))]"></div>

            <div className="container mx-auto px-6 text-center relative z-10">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter">
                        Pronto para o <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Próximo Nível?</span>
                    </h2>

                    <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
                        Junte-se a mais de 500 clínicas que já revolucionaram sua gestão com o ClinicOS.
                    </p>

                    <Link to="/register">
                        <Button size="lg" className="h-20 px-12 text-2xl font-bold bg-white text-slate-950 hover:bg-slate-200 rounded-full shadow-[0_0_60px_rgba(255,255,255,0.2)] hover:shadow-[0_0_80px_rgba(255,255,255,0.3)] transition-all transform hover:-translate-y-2">
                            Criar Conta Grátis
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
};

// --- Main Page Component ---

export default function PlanilhaLP() {
    return (
        <div className="bg-slate-950 min-h-screen text-slate-200 selection:bg-purple-500/30 selection:text-purple-200 scroll-smooth">
            <style>{`
                html { scroll-behavior: smooth; }
                .animate-gradient-x {
                    background-size: 200% 200%;
                    animation: gradient 6s ease infinite;
                }
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `}</style>
            <Navbar />
            <Hero />
            <Features />
            <MockupSection />
            <Testimonials />
            <ScreenshotsGallery />
            <CaseStudies />
            <Pricing />
            <FAQ />
            <FinalCTA />

            {/* Mobile Sticky CTA */}
            <div className="fixed bottom-6 left-6 right-6 z-50 md:hidden scale-in-center">
                <Link to="/register">
                    <Button className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-2xl shadow-blue-900/50 flex items-center justify-center gap-2 border border-white/10">
                        Começar Agora
                        <Zap className="w-5 h-5 fill-white" />
                    </Button>
                </Link>
            </div>

            <footer className="py-12 bg-slate-950 border-t border-slate-900">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="text-xl font-bold text-white">ClinicOS</div>
                    </div>
                    <div className="text-slate-600 text-sm">
                        &copy; {new Date().getFullYear()} ClinicOS Tecnologia. Feito com paixão.
                    </div>
                    <div className="flex gap-6 text-sm text-slate-500">
                        <a href="#" className="hover:text-white transition-colors">Termos</a>
                        <a href="#" className="hover:text-white transition-colors">Privacidade</a>
                        <a href="#" className="hover:text-white transition-colors">Suporte</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
