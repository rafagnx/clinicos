
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Play, Users, BarChart3, ShieldCheck, ArrowRight, Star } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function LandingPageDark() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-[#C5A059]/30 font-sans">

      {/* Navbar Minimalista */}
      <nav className="fixed top-0 w-full z-50 bg-[#020202]/90 backdrop-blur-md border-b border-[#C5A059]/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-2xl tracking-tight text-white">Clinic<span className="text-[#C5A059]">OS</span></span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-[#C5A059] transition-colors">Funcionalidades</a>
            <a href="#depoimentos" className="hover:text-[#C5A059] transition-colors">Resultados</a>
            <a href="#precos" className="hover:text-[#C5A059] transition-colors">Planos</a>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/5" onClick={() => navigate('/login')}>
              Entrar
            </Button>
            <Button
              onClick={() => navigate('/register')}
              className="bg-gradient-to-r from-[#C5A059] to-[#9A7B3A] hover:from-[#D4AF37] hover:to-[#B68D3F] text-black font-bold border-0 shadow-[0_0_15px_rgba(197,160,89,0.2)] hover:shadow-[0_0_25px_rgba(197,160,89,0.4)] transition-all rounded-md px-6"
            >
              Começar Agora
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-24 lg:pt-52 lg:pb-40 overflow-hidden">
        {/* Subtle Ambient Glow (Gold) */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#C5A059]/10 blur-[150px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block px-4 py-1.5 rounded-full border border-[#C5A059]/20 bg-[#C5A059]/5 mb-8 backdrop-blur-sm">
              <span className="text-xs font-semibold text-[#D4AF37] tracking-[0.2em] uppercase">A Nova Era da Gestão</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
              Transforme sua clínica em uma <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#EDC967] to-[#C5A059]">Máquina de Lucro</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
              Abandone as planilhas e sistemas antigos. O <span className="text-white font-medium">ClinicOS</span> entrega
              gestão financeira de elite, CRM inteligente e automação total em um único lugar.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Button
                onClick={() => navigate('/register')}
                className="h-14 px-10 text-lg bg-[#C5A059] hover:bg-[#D4AF37] text-black font-bold rounded shadow-[0_4px_20px_rgba(197,160,89,0.3)] hover:scale-105 transition-all duration-300 w-full sm:w-auto"
              >
                QUERO TESTAR GRÁTIS
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            <p className="mt-6 text-sm text-gray-500 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
              7 dias grátis sem compromisso
            </p>
          </motion.div>

          {/* Video Placeholder (VSL Style) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-24 relative mx-auto max-w-4xl aspect-video bg-black rounded-xl border border-[#C5A059]/20 shadow-[0_0_50px_rgba(197,160,89,0.1)] flex items-center justify-center group cursor-pointer overflow-hidden"
          >
            {/* Replace this with actual VSL thumbnail or embed */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
            <img
              src="https://images.unsplash.com/photo-1664575602276-acd073f104c1?q=80&w=2070&auto=format&fit=crop"
              alt="Dashboard Preview"
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700"
            />
            <div className="w-20 h-20 rounded-full bg-[#C5A059] flex items-center justify-center z-20 shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-black fill-current ml-1" />
            </div>
            <div className="absolute bottom-8 left-8 z-20 text-left">
              <p className="text-[#C5A059] font-bold text-sm tracking-widest mb-1">DEMONSTRAÇÃO</p>
              <h3 className="text-2xl font-bold text-white">Veja o ClinicOS em ação (2 min)</h3>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section - Minimalist */}
      <section className="py-12 border-y border-white/5 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/5">
            {[
              { label: "CLÍNICAS ATIVAS", value: "500+" },
              { label: "PACIENTES GERIDOS", value: "120k+" },
              { label: "FATURAMENTO", value: "R$ 45mi" },
              { label: "SATISFAÇÃO", value: "4.9/5" },
            ].map((stat, i) => (
              <div key={i} className="text-center px-4">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-xs text-[#C5A059] font-semibold tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Tudo o que você precisa. <br />
              <span className="text-slate-500">Nada que você não use.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="col-span-1 md:col-span-2 row-span-1 bg-[#111] border border-white/10 rounded-3xl p-8 hover:border-amber-500/30 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Gestão Financeira Descomplicada</h3>
              <p className="text-slate-400">Fluxo de caixa em tempo real, DRE automático e previsão de faturamento. Saiba exatamente para onde vai cada centavo da sua clínica.</p>
            </div>

            {/* Card 2 */}
            <div className="bg-[#111] border border-white/10 rounded-3xl p-8 hover:border-amber-500/30 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-xl font-bold mb-3">CRM de Pacientes</h3>
              <p className="text-slate-400 text-sm">Histórico completo, funil de vendas e sistema de reativação automática de inativos.</p>
            </div>

            {/* Card 3 */}
            <div className="bg-[#111] border border-white/10 rounded-3xl p-8 hover:border-amber-500/30 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-xl font-bold mb-3">Segurança Total</h3>
              <p className="text-slate-400 text-sm">Dados criptografados, backups diários e conformidade total com a LGPD.</p>
            </div>

            {/* Card 4 */}
            <div className="col-span-1 md:col-span-2 bg-[#111] border border-white/10 rounded-3xl p-8 hover:border-amber-500/30 transition-colors group flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">Migração Simplificada</h3>
                <p className="text-slate-400 max-w-md">Trazemos seus dados do sistema antigo sem custo adicional e sem dor de cabeça.</p>
              </div>
              <div className="hidden sm:block">
                <CheckCircle2 className="w-16 h-16 text-white/5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 to-purple-900/20 blur-[100px]"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Pronto para o próximo nível?
          </h2>
          <p className="text-xl text-slate-400 mb-12">
            Junte-se a centenas de clínicas que já transformaram sua gestão.
            Teste gratuitamente por 7 dias, sem compromisso.
          </p>
          <Button
            onClick={() => navigate('/register')}
            className="h-16 px-12 text-xl bg-white text-black hover:bg-slate-200 font-bold rounded-full shadow-2xl hover:scale-105 transition-all"
          >
            Começar Gratuitamente
          </Button>
          <p className="mt-6 text-sm text-slate-500">Não é necessário cartão de crédito para começar.</p>
        </div>
      </section>

      <footer className="py-12 border-t border-white/5 bg-black">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-amber-500 flex items-center justify-center text-xs font-bold text-black">C</div>
            <span className="font-bold">ClinicOS</span>
          </div>
          <div className="text-slate-500 text-sm">
            © 2026 ClinicOS Inc. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
