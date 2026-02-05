// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Stethoscope, User, Shield, Megaphone } from "lucide-react";
import { toast } from "sonner";

export default function UserOnboarding() {
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [role, setRole] = useState("");
    const [formData, setFormData] = useState({
        specialty: "",
        council_number: "",
        council_state: "",
        phone: "",
        email: ""
    });

    const { data: user } = useQuery({
        queryKey: ["auth-user"],
        queryFn: () => base44.auth.me().catch(() => null)
    });

    // Check if user is already a professional
    const { data: professionalProfile, isLoading } = useQuery({
        queryKey: ["my-professional-profile", user?.email],
        queryFn: async () => {
            if (!user?.email) return null;
            // Fetch professionals by email
            const pros = await base44.entities.Professional.filter({ email: user.email });
            return pros[0] || null;
        },
        enabled: !!user?.email
    });

    useEffect(() => {
        // If authenticated, not loading, and NO professional profile found -> Trigger Onboarding
        if (user && !isLoading && !professionalProfile) {
            setIsOpen(true);
        }
    }, [user, isLoading, professionalProfile]);

    const createProfileMutation = useMutation({
        mutationFn: async (data) => {
            const fullNameKey = user.user_metadata?.full_name || user.email.split('@')[0];
            const finalName = ['profissional', 'hof', 'biomedico'].includes(role) && !fullNameKey.startsWith('Dr')
                ? `Dr(a). ${fullNameKey}`
                : fullNameKey;

            const payload = {
                ...data, // Spread first!
                email: formData.email || user.email,
                name: finalName,
                photo_url: user.user_metadata?.avatar_url || "",
                status: "ativo",
                role_type: role,
                organization_id: user.active_organization_id,
                specialty: isClinical ? formData.specialty : (role === 'gerente' ? 'Gerência' : (role === 'marketing' ? 'Marketing' : 'Administrativo')),
                council_number: formData.council_number || "",
                council_state: formData.council_state || "",
                phone: formData.phone || "",
            };

            // Final safety check for email
            if (!payload.email) payload.email = user.email;

            // Ensure email is consistent
            if (formData.email) payload.email = formData.email;

            // Clean up potentially conflicting fields from spread
            if (payload.full_name) delete payload.full_name;

            console.log("Creating Profile Payload:", payload);
            return base44.entities.Professional.create(payload);
        },
        onSuccess: () => {
            toast.success("Perfil configurado com sucesso! Bem-vindo(a) à equipe.");
            queryClient.invalidateQueries({ queryKey: ["professionals"] });
            queryClient.invalidateQueries({ queryKey: ["my-professional-profile"] });
            setIsOpen(false);
        },
        onError: (error) => {
            console.error("Onboarding Error:", error);
            toast.error("Erro ao salvar perfil. Tente novamente.");
        }
    });

    const handleNext = () => {
        if (!role) {
            toast.error("Selecione sua função para continuar.");
            return;
        }
        setStep(2);
    };

    const handleSubmit = () => {
        createProfileMutation.mutate(formData);
    };

    // Clinical roles need more info
    const isClinical = ['profissional', 'hof', 'biomedico'].includes(role);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-center">🎉 Bem-vindo ao ClinicOS!</DialogTitle>
                    <DialogDescription className="text-center">
                        Vamos configurar seu perfil profissional para você aparecer na agenda e equipe.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    {step === 1 ? (
                        <div className="space-y-4">
                            <Label className="text-base text-center block mb-4">Qual é a sua função principal na clínica?</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setRole('hof')}
                                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${role === 'hof' ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}
                                >
                                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                                        <Stethoscope className="w-6 h-6" />
                                    </div>
                                    <span className="font-bold text-sm">HOF / Dentista</span>
                                </button>

                                <button
                                    onClick={() => setRole('biomedico')}
                                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${role === 'biomedico' ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}
                                >
                                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
                                        <Stethoscope className="w-6 h-6" />
                                    </div>
                                    <span className="font-bold text-sm">Biomédico(a)</span>
                                </button>

                                <button
                                    onClick={() => setRole('marketing')}
                                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${role === 'marketing' ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}
                                >
                                    <div className="p-3 bg-pink-100 text-pink-600 rounded-full">
                                        <Megaphone className="w-6 h-6" />
                                    </div>
                                    <span className="font-bold text-sm">Marketing</span>
                                </button>

                                <button
                                    onClick={() => setRole('secretaria')}
                                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${role === 'secretaria' ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}
                                >
                                    <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <span className="font-bold text-sm">Secretária(o)</span>
                                </button>

                                <button
                                    onClick={() => setRole('gerente')}
                                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${role === 'gerente' ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}
                                >
                                    <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
                                        <Shield className="w-6 h-6" />
                                    </div>
                                    <span className="font-bold text-sm">Gerente / Admin</span>
                                </button>
                            </div>
                            <div className="text-center mt-2">
                                <button onClick={() => setRole('profissional')} className="text-xs text-slate-400 underline">Outro Profissional da Saúde</button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            {/* Role Summary */}
                            <div className="bg-slate-50 p-4 rounded-lg mb-4 text-sm text-slate-600 flex items-center gap-3">
                                <div className="p-2 bg-white rounded-full shadow-sm">
                                    {isClinical ? <Stethoscope className="w-4 h-4 text-primary" /> : <User className="w-4 h-4 text-primary" />}
                                </div>
                                <div>
                                    Você selecionou: <strong>{role.toUpperCase()}</strong>
                                    <button onClick={() => setStep(1)} className="block text-primary text-xs underline mt-1">Alterar</button>
                                </div>
                            </div>

                            {/* Email Field - Requested by User */}
                            <div>
                                <Label>Seu E-mail (Confirme)</Label>
                                <Input
                                    value={formData.email || user?.email || ""}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="seu@email.com"
                                />
                            </div>

                            {isClinical ? (
                                <>
                                    <div>
                                        <Label>Especialidade</Label>
                                        <Input
                                            placeholder="Ex: Harmonização Facial"
                                            value={formData.specialty}
                                            onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label>Registro (CRO/CRM)</Label>
                                            <Input
                                                placeholder="12345"
                                                value={formData.council_number}
                                                onChange={e => setFormData({ ...formData, council_number: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>UF</Label>
                                            <Input
                                                placeholder="SP"
                                                value={formData.council_state}
                                                onChange={e => setFormData({ ...formData, council_state: e.target.value })}
                                                maxLength={2}
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <Label>Telefone / WhatsApp</Label>
                                    <Input
                                        placeholder="(11) 99999-9999"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {step === 2 && (
                        <Button variant="outline" onClick={() => setStep(1)} className="mr-auto">
                            Voltar
                        </Button>
                    )}
                    <Button onClick={step === 1 ? handleNext : handleSubmit} disabled={!role || createProfileMutation.isPending} className="w-full sm:w-auto">
                        {createProfileMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {step === 1 ? 'Continuar' : 'Concluir Cadastro'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
