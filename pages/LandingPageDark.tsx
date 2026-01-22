
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Play, Users, BarChart3, ShieldCheck, ArrowRight, Star } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function LandingPageDark() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-amber-500/30">
      
      {/* Navbar Minimalista */}
      <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <span className="font-bold text-black text-lg">C</span>
            </div>
            <span className="font-bold text-xl tracking-tight">ClinicOS</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-amber-400 transition-colors">Funcionalidades</a>
            <a href="#depoimentos" className="hover:text-amber-400 transition-colors">Resultados</a>
            <a href="#precos" className="hover:text-amber-400 transition-colors">Planos</a>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" className="text-slate-300 hover:text-white" onClick={() => navigate('/login')}>
              Entrar
            </Button>
            <Button 
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-amber-500 hover:to-yellow-700 text-black font-bold border-0 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all"
            >
              Começar Agora
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 center w-full h-[500px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-xs font-medium text-amber-200 uppercase tracking-wider">A Nova Era da Gestão</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
              Transforme sua clínica em uma <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600">Máquina de Resultados</span>
            </h1>
            
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Pare de perder pacientes e dinheiro. O ClinicOS é o sistema operacional completo 
              que une gestão, vendas e fidelização em uma interface premium.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                onClick={() => navigate('/register')}
                className="h-14 px-8 text-lg bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-amber-500 hover:to-yellow-700 text-black font-bold rounded-full shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-105 transition-all duration-300"
              >
                Quero Testar Grátis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline"
                className="h-14 px-8 text-lg border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-full backdrop-blur-sm"
              >
                <Play className="w-4 h-4 mr-2 fill-current" />
                Ver Demonstração
              </Button>
            </div>
          </motion.div>

          {/* Dash Preview with Glow */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-20 relative mx-auto max-w-5xl"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl blur opacity-20"></div>
            <div className="relative rounded-xl overflow-hidden border border-white/10 bg-[#0A0A0A] shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop" 
                alt="Dashboard Preview" 
                className="w-full h-auto opacity-80 hover:opacity-100 transition-opacity duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent"></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Clínicas Ativas", value: "500+" },
              { label: "Pacientes Geridos", value: "120k+" },
              { label: "Faturamento Processado", value: "R$ 45mi" },
              { label: "Satisfação", value: "4.9/5" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-slate-500 uppercase tracking-wide">{stat.label}</div>
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
              Tudo o que você precisa. <br/>
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
