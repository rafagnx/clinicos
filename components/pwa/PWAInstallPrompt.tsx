import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { X, Download, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Detect iOS
        const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIosDevice);

        // Detect if already installed (standalone mode)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

        // Check localStorage to see if user dismissed it recently (optional, skipping for now to ensure visibility)

        if (isStandalone) return;

        // Handle Android/Chrome Prompt
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Show prompt after a delay to not be annoying immediately
            setTimeout(() => setShowPrompt(true), 3000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // For iOS, show prompt after delay too if not installed
        if (isIosDevice && !isStandalone) {
            setTimeout(() => setShowPrompt(true), 5000);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
            setShowPrompt(false);
        }
    };

    if (!showPrompt) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-4 left-4 right-4 z-[100] md:left-auto md:right-4 md:w-96"
            >
                <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800 p-4 rounded-xl shadow-2xl flex flex-col gap-3 text-white ring-1 ring-white/10">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-1 rounded-lg w-12 h-12 flex items-center justify-center">
                                <img src="/logo-clinica.png" className="w-full h-full object-contain" alt="Logo" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">Instalar ClinicOS</h4>
                                <p className="text-xs text-slate-400">Acesse mais rápido e offline.</p>
                            </div>
                        </div>
                        <button onClick={() => setShowPrompt(false)} className="text-slate-400 hover:text-white p-1">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {isIOS ? (
                        <div className="bg-slate-900 p-3 rounded-lg text-xs text-slate-300 space-y-2 border border-slate-800">
                            <p className="font-semibold text-white mb-1">Para instalar no iPhone/iPad:</p>
                            <div className="flex items-center gap-2">
                                1. Toque em <Share className="w-4 h-4 text-blue-500" /> <span className="font-bold">Compartilhar</span>
                            </div>
                            <div className="flex items-center gap-2">
                                2. Role e selecione <span className="font-bold text-white bg-slate-800 px-1 rounded">Adicionar à Tela de Início</span>
                            </div>
                        </div>
                    ) : (
                        <Button onClick={handleInstall} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/20 mt-1">
                            <Download className="w-4 h-4 mr-2" />
                            Instalar Aplicativo
                        </Button>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
