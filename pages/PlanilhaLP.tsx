import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, Check, Star, Zap, BarChart3, PieChart,
    TrendingUp, Shield, Rocket, Smartphone, Laptop, CheckCircle2, Menu, X
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
            scrolled ? "bg-slate-950/80 backdrop-blur-md border-slate-800 py-4" : "bg-transparent py-6"
        )}>
            <div className="container mx-auto px-6 flex items-center justify-between">
                <div className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                    SUPREMA.
                </div>
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
                    <a href="#beneficios" className="hover:text-white transition-colors">Benefícios</a>
                    <a href="#demo" className="hover:text-white transition-colors">Demonstração</a>
                    <a href="#planos" className="hover:text-white transition-colors">Planos</a>
                    <Button className="bg-white text-slate-950 hover:bg-slate-200 font-bold rounded-full px-6">
                        Comprar Agora
                    </Button>
                </div>
            </div>
        </nav>
    );
};

const Hero = () => {
    return (
        <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-slate-950">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(76,29,149,0.1),rgba(15,23,42,1))]"></div>
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600/20 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>

            <div className="container mx-auto px-6 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-blue-400 text-xs font-bold uppercase tracking-wider mb-6 hover:bg-slate-800 transition-colors cursor-default">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        Gestão 4.0
                    </div>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-none mb-6"
                >
                    A Gestão da Sua <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x">
                        Empresa Começa Aqui
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
                >
                    Esqueça planilhas complexas e sistemas caros. Tenha o controle financeiro, estratégico e comercial do seu negócio em uma única ferramenta <span className="text-white font-semibold">simples e poderosa</span>.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Button size="lg" className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-[0_0_20px_rgba(37,99,235,0.5)] hover:shadow-[0_0_40px_rgba(37,99,235,0.7)] transition-all transform hover:scale-105">
                        Quero o Controle Total <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                    <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-full backdrop-blur-sm">
                        Ver Demonstração
                    </Button>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500"
            >
                <div className="w-[1px] h-12 bg-gradient-to-b from-slate-500 to-transparent"></div>
            </motion.div>
        </section>
    );
};

const Features = () => {
    const features = [
        { icon: BarChart3, title: "Dashboard Inteligente", desc: "Visão 360º da sua empresa em uma única tela. Receitas, despesas e lucro em tempo real." },
        { icon: TrendingUp, title: "Projeção de Metas", desc: "Defina onde quer chegar e acompanhe o progresso dia a dia com indicadores visuais." },
        { icon: PieChart, title: "Gestão Financeira", desc: "Controle de fluxo de caixa, DRE gerencial e categorização automática de custos." },
        { icon: Zap, title: "Automação Completa", desc: "Fórmulas avançadas que trabalham por você. Digite apenas o essencial." },
        { icon: Shield, title: "Segurança de Dados", desc: "Seus dados protegidos e acessíveis apenas por você. Backup automático incluso." },
        { icon: Rocket, title: "Decisões Rápidas", desc: "Pare de adivinhar. Tome decisões baseadas em dados concretos e confiáveis." }
    ];

    return (
        <section id="beneficios" className="py-24 bg-slate-950 relative">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Poder <span className="text-blue-500">Ilimitado</span></h2>
                    <p className="text-slate-400 max-w-xl mx-auto">Tudo o que você precisa para escalar sua empresa com segurança e previsibilidade.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            className="group p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all duration-300 hover:bg-slate-800/50 hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="w-12 h-12 rounded-lg bg-blue-600/10 text-blue-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <item.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
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

const ProductShowcase = () => {
    return (
        <section id="demo" className="py-24 bg-slate-950 overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    <div className="lg:w-1/2">
                        <motion.h2
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight"
                        >
                            Design que <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Inspira Produtividade</span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="text-slate-400 text-lg mb-8"
                        >
                            Uma interface limpa, intuitiva e pensada para o empreendedor moderno. Acesse seus dados de qualquer lugar, seja no computador, tablet ou celular.
                        </motion.p>

                        <div className="space-y-4">
                            {[
                                "Compatível com Excel e Google Sheets",
                                "Modo Dark e Light automático",
                                "Atualizações vitalícias gratuitas"
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.4 + (i * 0.1) }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <span className="text-slate-200">{item}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:w-1/2 relative">
                        {/* Mockups Abstract Representation */}
                        <div className="relative w-full aspect-video">
                            {/* Laptop Base */}
                            <motion.div
                                initial={{ opacity: 0, y: 100, rotateX: 20 }}
                                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                                transition={{ duration: 1 }}
                                className="absolute inset-0 bg-slate-900 rounded-xl border border-slate-700 shadow-2xl overflow-hidden transform perspective-1000"
                            >
                                {/* Header Fake */}
                                <div className="h-6 bg-slate-800 border-b border-slate-700 flex items-center px-4 gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                </div>
                                {/* Grid Content Fake */}
                                <div className="p-6 grid grid-cols-4 gap-4 h-full bg-slate-900">
                                    <div className="col-span-1 bg-slate-800/50 rounded-lg h-32 animate-pulse"></div>
                                    <div className="col-span-1 bg-slate-800/50 rounded-lg h-32 animate-pulse delay-75"></div>
                                    <div className="col-span-1 bg-slate-800/50 rounded-lg h-32 animate-pulse delay-150"></div>
                                    <div className="col-span-1 bg-slate-800/50 rounded-lg h-32 animate-pulse delay-200"></div>
                                    <div className="col-span-4 bg-slate-800/30 rounded-lg h-40 mt-4">
                                        <div className="h-full flex items-end p-4 gap-2">
                                            {[40, 60, 45, 70, 50, 80, 65, 90, 75, 55, 85, 95].map((h, i) => (
                                                <div key={i} className="flex-1 bg-blue-500/40 rounded-t-sm" style={{ height: `${h}%` }}></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Phone Floating */}
                            <motion.div
                                initial={{ opacity: 0, x: 50, y: 50 }}
                                whileInView={{ opacity: 1, x: 0, y: 0 }}
                                transition={{ duration: 1, delay: 0.3 }}
                                className="absolute -right-4 -bottom-10 w-24 h-48 bg-black rounded-[2rem] border-4 border-slate-800 shadow-2xl overflow-hidden"
                            >
                                <div className="w-full h-full bg-slate-900 p-2 flex flex-col items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 mb-2">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                    <div className="text-[10px] text-slate-400 text-center">Metas <br /> Batidas!</div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Glow Behind */}
                        <div className="absolute -inset-10 bg-blue-500/20 blur-[80px] -z-10 rounded-full"></div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const Pricing = () => {
    return (
        <section id="planos" className="py-24 bg-slate-950 relative">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Escolha seu <span className="text-purple-500">Nível</span></h2>
                    <p className="text-slate-400">Investimento único. Acesso vitalício.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
                    {/* Basic */}
                    <motion.div
                        whileHover={{ y: -10 }}
                        className="p-8 rounded-2xl bg-slate-900 border border-slate-800"
                    >
                        <h3 className="text-xl font-semibold text-slate-300 mb-2">Essencial</h3>
                        <div className="text-4xl font-bold text-white mb-6">R$ 97</div>
                        <ul className="space-y-4 mb-8 text-slate-400 text-sm">
                            <li className="flex gap-3"><Check className="w-5 h-5 text-slate-600" /> Fluxo de Caixa Simples</li>
                            <li className="flex gap-3"><Check className="w-5 h-5 text-slate-600" /> Cadastro de Clientes</li>
                            <li className="flex gap-3"><Check className="w-5 h-5 text-slate-600" /> Relatórios em PDF</li>
                        </ul>
                        <Button className="w-full bg-slate-800 hover:bg-slate-700">Começar</Button>
                    </motion.div>

                    {/* Pro - Featured */}
                    <motion.div
                        initial={{ scale: 0.9 }}
                        whileInView={{ scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        className="p-8 rounded-2xl bg-slate-900 border-2 border-purple-500 relative shadow-[0_0_40px_rgba(168,85,247,0.15)] z-10"
                    >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide">
                            Mais Vendido
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Profissional</h3>
                        <div className="text-5xl font-bold text-white mb-6">R$ 197</div>
                        <p className="text-purple-400 text-sm mb-6 font-medium">Tudo do Essencial +</p>
                        <ul className="space-y-4 mb-8 text-slate-300 text-sm">
                            <li className="flex gap-3"><Check className="w-5 h-5 text-purple-500" /> Dashboard Inteligente</li>
                            <li className="flex gap-3"><Check className="w-5 h-5 text-purple-500" /> Projeção de Metas</li>
                            <li className="flex gap-3"><Check className="w-5 h-5 text-purple-500" /> DRE Gerencial</li>
                            <li className="flex gap-3"><Check className="w-5 h-5 text-purple-500" /> Suporte Prioritário</li>
                        </ul>
                        <Button className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-500/25">Garanta o Seu</Button>
                    </motion.div>

                    {/* Enterprise */}
                    <motion.div
                        whileHover={{ y: -10 }}
                        className="p-8 rounded-2xl bg-slate-900 border border-slate-800"
                    >
                        <h3 className="text-xl font-semibold text-slate-300 mb-2">Empresa Plus</h3>
                        <div className="text-4xl font-bold text-white mb-6">R$ 297</div>
                        <ul className="space-y-4 mb-8 text-slate-400 text-sm">
                            <li className="flex gap-3"><Check className="w-5 h-5 text-blue-500" /> Todos os recursos Pro</li>
                            <li className="flex gap-3"><Check className="w-5 h-5 text-blue-500" /> 5 Licenças de Uso</li>
                            <li className="flex gap-3"><Check className="w-5 h-5 text-blue-500" /> Consultoria de 1h</li>
                            <li className="flex gap-3"><Check className="w-5 h-5 text-blue-500" /> Personalização de Logo</li>
                        </ul>
                        <Button className="w-full bg-slate-800 hover:bg-slate-700">Contratar</Button>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

const Testimonials = () => {
    return (
        <section className="py-24 bg-slate-950 border-t border-slate-900">
            <div className="container mx-auto px-6">
                <h2 className="text-center text-3xl font-bold text-white mb-16">Quem usa, <span className="text-green-500">Aprova</span></h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                            <div className="flex gap-1 text-yellow-500 mb-4">
                                {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-current" />)}
                            </div>
                            <p className="text-slate-400 mb-6 italic">"A melhor planilha que já usei. Transformou completamente a forma como vejo os números da minha empresa."</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
                                    {String.fromCharCode(64 + i)}
                                </div>
                                <div>
                                    <div className="text-white font-medium">Cliente {i}</div>
                                    <div className="text-xs text-slate-500">CEO, Startup</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const CTA = () => {
    return (
        <section className="py-32 bg-slate-950 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-purple-900/20 pointer-events-none"></div>

            <div className="container mx-auto px-6 text-center relative z-10">
                <motion.h2
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight"
                >
                    Transforme sua gestão <br />
                    empresarial <span className="text-blue-500">hoje mesmo.</span>
                </motion.h2>

                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Button size="lg" className="h-20 px-12 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-full shadow-[0_0_50px_rgba(79,70,229,0.4)] border border-white/10">
                        GARANTIR ACESSO AGORA
                    </Button>
                </motion.div>

                <p className="mt-6 text-slate-500 text-sm">Garantia de 7 dias incondicional • Pagamento Seguro</p>
            </div>
        </section>
    );
};

// --- Main Page Component ---

export default function PlanilhaLP() {
    return (
        <div className="bg-slate-950 min-h-screen text-slate-200 selection:bg-purple-500/30 selection:text-purple-200">
            <Navbar />
            <Hero />
            <Features />
            <ProductShowcase />
            <Pricing />
            <Testimonials />
            <CTA />

            {/* Simple Footer */}
            <footer className="py-8 bg-slate-950 border-t border-slate-900 text-center text-slate-600 text-sm">
                <p>&copy; {new Date().getFullYear()} Suprema Gestão. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
}
