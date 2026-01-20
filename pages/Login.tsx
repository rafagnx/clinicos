import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

export default function Login() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        console.log("Attempting login with:", email);

        try {
            const { data, error } = await authClient.signIn.email({
                email,
                password,
            }, {
                onSuccess: async () => {
                    console.log("Login success! Fetching orgs...");
                    // Fetch organizations to set active context
                    const orgs = await authClient.organization.list();
                    console.log("User orgs:", orgs);

                    if (orgs.data && orgs.data.length > 0) {
                        const firstOrgId = orgs.data[0].id;
                        localStorage.setItem("active-org-id", firstOrgId);
                        console.log("Active Org set to:", firstOrgId);
                    } else {
                        console.log("No organizations found for this user.");
                    }

                    toast.success("Login realizado com sucesso!");
                    navigate('/dashboard');
                },
                onError: (ctx) => {
                    console.error("Login error:", ctx.error);
                    toast.error(ctx.error.message || "Falha no login");
                }
            });

            if (error) {
                // Double check just in case onError didn't fire or wasn't handled
                console.error("Login returned error object:", error);
                setIsLoading(false);
            }

        } catch (err) {
            console.error("Unexpected login error:", err);
            toast.error("Erro inesperado ao tentar logar.");
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        console.log("Google login clicked - Not implemented yet");
        toast.info("Login com Google em breve!");
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    {/* Using a placeholder or the project logo if available locally, keep remote for now but maybe fix URL if broken */}
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            C
                        </div>
                        <span className="text-2xl font-bold text-slate-900">ClinicOS</span>
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-800">Bem-vindo de volta</h1>
                    <p className="text-slate-500 mt-2">Digite seus dados para entrar</p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-12 rounded-xl"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Sua senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-12 rounded-xl pr-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm mt-2"
                        disabled={isLoading}
                    >
                        {isLoading ? <span className="animate-pulse">Entrando...</span> : "Entrar"}
                    </Button>
                </form>
                <div className="mt-6 text-center">
                    <p className="text-sm text-slate-500">
                        Não tem uma conta?{" "}
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate("/signup"); }} className="font-medium text-blue-600 hover:underline">
                            Criar conta
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
