import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from "@/lib/auth-client";
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
            const { data, error } = await authClient.signIn.email({
                email,
                password,
            }, {
                onSuccess: async () => {
                    // Fetch organizations to set active context
                    const orgs = await authClient.organization.list();
                    if (orgs.data && orgs.data.length > 0) {
                        const firstOrgId = orgs.data[0].id;
                        localStorage.setItem("active-org-id", firstOrgId);
                    }
                    toast.success("Bem-vindo ao ClinicOS!");
                    navigate('/dashboard');
                },
                onError: (ctx) => {
                    toast.error(ctx.error.message || "Falha no login");
                    setIsLoading(false);
                }
            });

            if (error) {
                console.error("Login returned error object:", error);
                setIsLoading(false);
            }
        } catch (err) {
            console.error("Unexpected login error:", err);
            toast.error("Erro inesperado ao tentar logar.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex">
            {/* Left Column - Hero Image & Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
                <div className="relative z-10 flex items-center gap-2">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <Activity className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">ClinicOS</span>
                </div>

                <div className="relative z-10 max-w-lg space-y-6">
                    <h1 className="text-4xl font-bold leading-tight">
                        Gestão inteligente para clínicas que não param de crescer.
                    </h1>
                    <ul className="space-y-4 text-slate-300">
                        <li className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-blue-500" />
                            <span>Controle total da sua agenda e pacientes</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-blue-500" />
                            <span>Prontuários eletrônicos seguros e acessíveis</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-blue-500" />
                            <span>Gestão financeira simplificada</span>
                        </li>
                    </ul>
                </div>

                <div className="relative z-10 text-sm text-slate-400">
                    © {new Date().getFullYear()} ClinicOS Inc. Todos os direitos reservados.
                </div>

                {/* Decorative Background Image Overlay */}
                <div className="absolute inset-0 z-0 opacity-20">
                    <img
                        src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
                        alt="Hospital Background"
                        className="w-full h-full object-cover grayscale"
                    />
                </div>
            </div>

            {/* Right Column - Login Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50">
                <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold text-slate-900">Acesse sua conta</h2>
                        <p className="text-slate-500">Informe suas credenciais para continuar</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Corporativo</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="nome@clinica.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Senha</Label>
                                <a href="#" className="text-xs font-medium text-blue-600 hover:text-blue-700">
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
                                    className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02]"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Entrando...</span>
                                </div>
                            ) : "Entrar na Plataforma"}
                        </Button>
                    </form>

                    <div className="pt-4 text-center border-t border-slate-100">
                        <p className="text-sm text-slate-500">
                            Novo por aqui?{" "}
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); navigate("/signup"); }}
                                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                Criar uma conta
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
