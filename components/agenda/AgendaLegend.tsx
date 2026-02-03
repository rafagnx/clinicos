import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, HelpCircle } from "lucide-react";

export function AgendaLegend() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden lg:flex gap-2 text-slate-500 hover:text-indigo-600">
                    <HelpCircle className="w-4 h-4" />
                    <span className="text-xs">Legenda Estratégica</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="text-indigo-600">🎯</span> Guia de Atendimento High Ticket
                    </DialogTitle>
                    <DialogDescription>
                        Entenda os indicadores da agenda e como agir com cada perfil de paciente.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">

                    {/* Esquerda: Origem e Status */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                📢 Origem do Cliente
                            </h3>
                            <div className="bg-slate-50 p-3 rounded-lg border space-y-3">
                                <div className="flex items-start gap-3">
                                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-0 shrink-0">📢 Ads</Badge>
                                    <div>
                                        <p className="text-sm font-semibold">Tráfego Pago</p>
                                        <p className="text-xs text-slate-500">Paciente custou dinheiro. Foco total em conversão e ROI.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-0 shrink-0">👥 Ind</Badge>
                                    <div>
                                        <p className="text-sm font-semibold">Indicação</p>
                                        <p className="text-xs text-slate-500">Já confia em nós. Use prova social de quem indicou.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                💡 Temperatura
                            </h3>
                            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 space-y-3">
                                <div className="flex items-start gap-3">
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-0 shrink-0">💡 Hot</Badge>
                                    <div>
                                        <p className="text-sm font-semibold text-amber-900">Pronto para Compra</p>
                                        <p className="text-xs text-amber-700">Não perca tempo explicando o básico. Vá direto para o fechamento/valores.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Direita: Perfis Comportamentais */}
                    <div>
                        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                            🧠 Perfis Comportamentais
                        </h3>
                        <div className="space-y-3">
                            <div className="p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="secondary" className="bg-violet-100 text-violet-800 border-0">🧠 Analítico</Badge>
                                </div>
                                <p className="text-xs text-slate-600">
                                    <strong>Como agir:</strong> Use dados, mostre "antes e depois", explique a técnica detalhadamente. Não apele só para emoção.
                                </p>
                            </div>

                            <div className="p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="secondary" className="bg-pink-100 text-pink-800 border-0">❤️ Emocional</Badge>
                                </div>
                                <p className="text-xs text-slate-600">
                                    <strong>Como agir:</strong> Fale de autoestima, acolhimento, como ela vai se sentir. Crie conexão pessoal.
                                </p>
                            </div>

                            <div className="p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="secondary" className="bg-slate-800 text-white border-0">👑 Exigente</Badge>
                                </div>
                                <p className="text-xs text-slate-600">
                                    <strong>Como agir:</strong> Mostre exclusividade, rapidez e eficiência. Deixe claro que o serviço é Premium.
                                </p>
                            </div>

                            <div className="p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-0">🤝 Relacional</Badge>
                                </div>
                                <p className="text-xs text-slate-600">
                                    <strong>Como agir:</strong> Converse, pergunte da família, crie vínculo. Ela compra pela confiança em VOCÊ.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}
