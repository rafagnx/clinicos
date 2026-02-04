import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Camera, X } from "lucide-react";
import { toast } from "sonner";

const TEMPERAMENTS = ["Analítico", "Emocional", "Exigente", "Prático", "Relacional"];
const MOTIVATIONS = ["Autoestima", "Carreira/Profissional", "Relacionamento", "Evento Específico", "Saúde"];
const CONSCIENCE_LEVELS = ["Inconsciente", "Consciente do Problema", "Consciente da Solução", "Pronto para Compra"];

export default function PatientForm({ patient, onSuccess, onCancel }) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        photo_url: "",
        name: "",
        email: "",
        phone: "",
        whatsapp: "",
        cpf: "",
        birth_date: "",
        gender: "",
        address: "",
        city: "",
        marketing_source: "",
        temperature: "",
        temperament: "",
        main_motivation: "",
        conscience_level: "",
        notes: "",
        status: "ativo"
    });

    useEffect(() => {
        if (patient) {
            setFormData({
                photo_url: patient.photo_url || "",
                name: patient.name || patient.full_name || "",
                email: patient.email || "",
                phone: patient.phone || "",
                whatsapp: patient.whatsapp || "",
                cpf: patient.cpf || "",
                birth_date: patient.birth_date || "",
                gender: patient.gender || "",
                address: patient.address || "",
                city: patient.city || "",
                marketing_source: patient.marketing_source || "",
                temperature: patient.temperature || "",
                temperament: patient.temperament || "",
                main_motivation: patient.main_motivation || "",
                conscience_level: patient.conscience_level || "",
                notes: patient.notes || "",
                status: patient.status || "ativo"
            });
        }
    }, [patient]);

    const mutation = useMutation({
        mutationFn: (data: any) => {
            if (patient) {
                return base44.entities.Patient.update(patient.id, data);
            } else {
                return base44.entities.Patient.create(data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["patients"] });
            toast.success(patient ? "Paciente atualizado!" : "Paciente cadastrado!");
            onSuccess?.();
        },
        onError: () => {
            toast.error("Erro ao salvar paciente.");
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSubmit = {
            ...formData,
            birth_date: formData.birth_date ? formData.birth_date : null
        };
        mutation.mutate(dataToSubmit);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center mb-6">
                <div className="relative group cursor-pointer">
                    <div className="w-24 h-24 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center overflow-hidden">
                        {formData.photo_url ? (
                            <img src={formData.photo_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-2xl font-semibold text-blue-300">?</span>
                        )}
                    </div>
                    <label
                        htmlFor="photo-upload"
                        className="absolute bottom-0 right-0 p-1.5 bg-blue-600 rounded-full text-white shadow-lg cursor-pointer hover:bg-blue-700 transition-colors"
                    >
                        <Camera className="w-4 h-4" />
                        <input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    try {
                                        const url = await base44.storage.upload(file);
                                        setFormData(prev => ({ ...prev, photo_url: url }));
                                    } catch (err) {
                                        toast.error("Erro ao fazer upload da foto");
                                    }
                                }
                            }}
                        />
                    </label>
                    {formData.photo_url && (
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, photo_url: "" }))}
                            className="absolute -top-1 -right-1 p-1 bg-rose-500 rounded-full text-white shadow-sm hover:bg-rose-600"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                    id="name"
                    name="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome do paciente"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                        id="cpf"
                        name="cpf"
                        autoComplete="off"
                        value={formData.cpf}
                        onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                        placeholder="000.000.000-00"
                    />
                </div>
                <div>
                    <Label htmlFor="birth_date">Data de Nascimento</Label>
                    <Input
                        id="birth_date"
                        name="birth_date"
                        autoComplete="bday"
                        type="date"
                        value={formData.birth_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="gender">Gênero</Label>
                    <Select name="gender" value={formData.gender} onValueChange={(v) => setFormData(p => ({ ...p, gender: v }))}>
                        <SelectTrigger id="gender">
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="masculino">Masculino</SelectItem>
                            <SelectItem value="feminino">Feminino</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                            <SelectItem value="prefer_not_say">Prefiro não informar</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                        id="phone"
                        name="phone"
                        autoComplete="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                        placeholder="(00) 00000-0000"
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                        id="whatsapp"
                        name="whatsapp"
                        autoComplete="tel"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData(p => ({ ...p, whatsapp: e.target.value }))}
                        placeholder="(00) 00000-0000"
                    />
                </div>
                <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                        id="email"
                        name="email"
                        autoComplete="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                        placeholder="email@exemplo.com"
                    />
                </div>
            </div>

            <div>
                <Label htmlFor="address">Endereço</Label>
                <Input
                    id="address"
                    name="address"
                    autoComplete="street-address"
                    value={formData.address}
                    onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                    placeholder="Endereço completo"
                />
            </div>

            <div>
                <Label htmlFor="marketing_source">Como conheceu a clínica? *</Label>
                <Select name="marketing_source" value={formData.marketing_source} onValueChange={(v) => setFormData(p => ({ ...p, marketing_source: v }))}>
                    <SelectTrigger id="marketing_source">
                        <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="trafego_pago">Tráfego Pago (Anúncios)</SelectItem>
                        <SelectItem value="instagram_organico">Instagram Orgânico</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="site">Site</SelectItem>
                        <SelectItem value="indicacao">Indicação</SelectItem>
                        <SelectItem value="paciente_antigo">Paciente Antigo (Retorno)</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="p-4 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-indigo-800 uppercase tracking-widest">Perfil Comportamental (High Ticket)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="temperature">Temperatura do Lead</Label>
                        <Select value={formData.temperature} onValueChange={(v) => setFormData(p => ({ ...p, temperature: v }))}>
                            <SelectTrigger id="temperature" className="bg-white border-indigo-200">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="hot">🔥 Quente (Hot)</SelectItem>
                                <SelectItem value="warm">🌡️ Morno (Warm)</SelectItem>
                                <SelectItem value="cold">❄️ Frio (Cold)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="temperament">Perfil Comportamental</Label>
                        <Select value={formData.temperament} onValueChange={(v) => setFormData(p => ({ ...p, temperament: v }))}>
                            <SelectTrigger id="temperament" className="bg-white border-indigo-200">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                {TEMPERAMENTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="main_motivation">Motivação Principal</Label>
                        <Select value={formData.main_motivation} onValueChange={(v) => setFormData(p => ({ ...p, main_motivation: v }))}>
                            <SelectTrigger id="main_motivation" className="bg-white border-indigo-200">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                {MOTIVATIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="conscience_level">Nível de Consciência</Label>
                        <Select value={formData.conscience_level} onValueChange={(v) => setFormData(p => ({ ...p, conscience_level: v }))}>
                            <SelectTrigger id="conscience_level" className="bg-white border-indigo-200">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                {CONSCIENCE_LEVELS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                    className="min-h-[100px] placeholder:text-slate-400"
                    placeholder="Observações gerais sobre o paciente"
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={mutation.isPending}>
                    {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {patient ? "Salvar Alterações" : "Cadastrar Paciente"}
                </Button>
            </div>
        </form>
    );
}

