import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, Check, Star, Zap, BarChart3, Users,
    Calendar, FileText, Smartphone, MessageCircle, ShieldCheck, HeartPulse
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from 'react-router-dom';

// --- Components ---

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
                    <a href="#mobile" className="hover:text-white transition-colors">App</a>
                    <a href="#planos" className="hover:text-white transition-colors">Planos</a>
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
                    Escale sua Clínica com <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-gradient-x">
                        Inteligência Real
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed font-light"
                >
                    Agenda, Prontuário, Financeiro e Marketing automatizado. O único sistema que transforma pacientes em fãs e <span className="text-white font-medium border-b border-blue-500/30">clínicas em impérios</span>.
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

            {/* Dashboard Preview Abstract */}
            <motion.div
                initial={{ opacity: 0, y: 100, rotateX: 20 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[90%] md:w-[70%] h-[400px] md:h-[600px] bg-slate-900 rounded-t-3xl border border-slate-800 shadow-2xl opacity-50 blur-[2px] hover:blur-0 transition-all duration-700"
            >
                <div className="w-full h-full bg-slate-950/50 backdrop-blur-3xl rounded-t-3xl p-4 border-t border-white/10">
                    <div className="flex gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 h-full">
                        <div className="col-span-1 bg-slate-800/20 rounded-xl h-full animate-pulse"></div>
                        <div className="col-span-3 bg-slate-800/10 rounded-xl h-full grid grid-rows-3 gap-4">
                            <div className="row-span-1 bg-slate-800/20 rounded-xl"></div>
                            <div className="row-span-2 bg-slate-800/20 rounded-xl"></div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </section>
    );
};

const Features = () => {
    const features = [
        { icon: Calendar, title: "Agenda Inteligente", desc: "Confirmação automática via WhatsApp, lista de espera e prevenção de faltas." },
        { icon: FileText, title: "Prontuário Personalizável", desc: "Anamnese facial, corporal e capilar. Armazene fotos de antes e depois com segurança." },
        { icon: BarChart3, title: "Gestão Financeira", desc: "Fluxo de caixa, DRE automática, comissões complexas e controle de estoque." },
        { icon: Users, title: "CRM de Vendas", desc: "Funil de vendas integrado para converter leads em pacientes e recuperar inativos." },
        { icon: Zap, title: "Automações de Marketing", desc: "Campanhas de aniversário, retorno e pós-venda automáticas." },
        { icon: Smartphone, title: "App para Pacientes", desc: "Agendamento online e portal do paciente para fidelização máxima." }
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
                            {/* Floating Elements Animation */}
                            <motion.div
                                initial={{ y: 0 }}
                                animate={{ y: [0, -20, 0] }}
                                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                                className="relative z-10"
                            >
                                <img
                                    src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop"
                                    alt="App Mobile"
                                    className="w-72 mx-auto rounded-[3rem] border-8 border-slate-900 shadow-2xl shadow-purple-900/50"
                                />

                                {/* Floating Cards */}
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    whileInView={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="absolute top-10 -left-10 md:-left-20 bg-slate-800/90 backdrop-blur-md p-4 rounded-xl border border-slate-700 shadow-xl flex items-center gap-3"
                                >
                                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                        <MessageCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-400">Notificação</div>
                                        <div className="text-sm font-bold text-white">Consulta Confirmada</div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ x: 20, opacity: 0 }}
                                    whileInView={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.7 }}
                                    className="absolute bottom-20 -right-10 md:-right-20 bg-slate-800/90 backdrop-blur-md p-4 rounded-xl border border-slate-700 shadow-xl flex items-center gap-3"
                                >
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                                        <HeartPulse className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-400">Prontuário</div>
                                        <div className="text-sm font-bold text-white">Anamnese Atualizada</div>
                                    </div>
                                </motion.div>
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

                        <ul className="space-y-4 mb-10">
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

                        <Button className="h-12 px-8 bg-slate-800 hover:bg-slate-700 text-white rounded-full">
                            Conhecer o App
                        </Button>
                    </div>
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
            <Pricing />
            <FinalCTA />

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
