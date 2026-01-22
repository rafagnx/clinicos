import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Activity, CheckCircle2 } from "lucide-react";

export default function Login() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error("Supabase Login Error:", error);
                toast.error(error.message === "Invalid login credentials" ? "Email ou senha incorretos" : error.message);
                setIsLoading(false);
                return;
            }

            if (data.user) {
                // Login sucessful
                toast.success("Bem-vindo de volta!");
                localStorage.setItem("clinicos-token", data.session?.access_token || ""); // Backup token if needed

                // Navigate to dashboard
                // We use window.location to ensure full state reset
                window.location.href = '/Dashboard';
            }
        } catch (err: any) {
            console.error("Unexpected login error:", err);

            // Handle LocalStorage Quota Exceeded
            if (err?.name === 'QuotaExceededError' ||
                err?.message?.includes('exceeded the quota') ||
                err?.toString().includes('QuotaExceededError')) {

                toast.warning("Memória local cheia. Limpando cache...");
                try {
                    localStorage.clear();
                    // Keep essential flags if needed, but for now clear all
                    toast.success("Cache limpo! Tente entrar novamente.");
                } catch (e) {
                    toast.error("Não foi possível limpar o cache automaticamente.");
                }
            } else {
                toast.error("Erro inesperado ao tentar logar.");
            }
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[700px] h-[700px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] animate-pulse-slow delay-1000"></div>
            </div>

            {/* Left Column - Branding (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-16">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
                        <Activity className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-white">ClinicOS</span>
                </div>

                <div className="max-w-xl space-y-8">
                    <h1 className="text-5xl font-bold leading-tight text-white">
                        Bem-vindo ao futuro da <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">sua clínica</span>.
                    </h1>
                    <p className="text-lg text-slate-400">
                        A plataforma completa para gerenciar, escalar e fidelizar pacientes com inteligência e design premium.
                    </p>

                    <div className="grid grid-cols-2 gap-6 pt-8">
                        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
                            <div className="text-3xl font-bold text-white mb-1">10k+</div>
                            <div className="text-sm text-slate-500">Pacientes Ativos</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
                            <div className="text-3xl font-bold text-white mb-1">99%</div>
                            <div className="text-sm text-slate-500">Satisfação</div>
                        </div>
                    </div>
                </div>

                <div className="text-sm text-slate-500">
                    © {new Date().getFullYear()} ClinicOS Inc.
                </div>
            </div>

            {/* Right Column - Login Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative z-10">
                <div className="w-full max-w-md">
                    <div className="mb-10 text-center lg:text-left">
                        <div className="lg:hidden flex justify-center mb-6">
                            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2.5 rounded-xl shadow-lg">
                                <Activity className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Acesse sua conta</h2>
                        <p className="text-slate-400">Entre com suas credenciais para continuar gerenciando.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300">Email Corporativo</Label>
                            <div className="relative group">
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nome@clinica.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-12 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20 transition-all rounded-xl"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-slate-300">Senha</Label>
                                <a href="#" className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">
                                    Esqueceu a senha?
                                </a>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-12 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20 transition-all rounded-xl pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-95"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Verificando...</span>
                                </div>
                            ) : "Entrar na Plataforma"}
                        </Button>
                    </form>

                    <div className="pt-8 mt-8 border-t border-slate-800 text-center">
                        <p className="text-slate-500">
                            Ainda não tem uma conta?{" "}
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); navigate("/register"); }}
                                className="font-bold text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                Criar conta grátis
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
