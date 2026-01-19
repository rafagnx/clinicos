import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate login delay
        setTimeout(() => {
            setIsLoading(false);
            navigate('/Dashboard');
        }, 800);
    };

    const handleGoogleLogin = () => {
        console.log("Google login clicked");
        // Mock action
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <img
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693c124e6b101587747b5b3e/13b7a1377_Designsemnome.png"
                        alt="ClinicOS"
                        className="h-12 w-auto"
                    />
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-800">Welcome back</h1>
                    <p className="text-slate-500 mt-2">Please enter your details to sign in</p>
                </div>

                {/* Google Button */}
                <Button
                    variant="outline"
                    className="w-full h-[54px] rounded-xl border-slate-200 text-slate-600 font-medium text-base hover:bg-slate-50 relative mb-6"
                    onClick={handleGoogleLogin}
                >
                    <img
                        src="https://www.svgrepo.com/show/475656/google-color.svg"
                        alt="Google"
                        className="w-6 h-6 mr-3"
                    />
                    Continue with Google
                </Button>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-100" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-slate-400">or</span>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-12 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-colors"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-12 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-colors pr-10"
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

                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="remember"
                                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                            />
                            <label htmlFor="remember" className="text-sm text-slate-600">Remember me</label>
                        </div>
                        <a href="#" className="text-sm font-medium text-slate-900 hover:underline">
                            Forgot password?
                        </a>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-medium text-sm mt-2"
                        disabled={isLoading}
                    >
                        {isLoading ? "Signing in..." : "Sign in"}
                    </Button>

                    <div className="text-center mt-6">
                        <p className="text-sm text-slate-500">
                            Don't have an account?{" "}
                            <a href="#" className="font-medium text-slate-900 hover:underline">
                                Sign up
                            </a>
                        </p>
                    </div>
                </form>
            </div>

            <div className="mt-8 text-center text-xs text-slate-400">
                <p>&copy; {new Date().getFullYear()} ClinicOS. All rights reserved.</p>
            </div>
        </div>
    );
}
