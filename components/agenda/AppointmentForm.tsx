import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
    Calendar as LucideCalendar,
    Clock,
    MapPin,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    Plus,
    Ban,
    Sparkles,
    LayoutList,
    User,
    Check,
    Loader2,
    CalendarIcon as LucideCalendarIcon,
    Search
} from "lucide-react";
import { format, addMinutes, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getGroupedProcedures } from "@/lib/procedures";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sendAppointmentNotifications } from "@/functions/sendAppointmentNotifications";
import { base44 } from "@/lib/base44Client";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AppointmentFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointment?: any;
    professionals?: any[];
    onSuccess?: () => void;
}

// Mock list removed as requested

const TYPES_LIST = [
    "Consulta",
    "Retorno",
    "Exame",
    "Procedimento",
    "Encaixe",
    "Compromisso"
];

const FUNNEL_STATUS = [
    { value: "lead", label: "Lead (Novo)", color: "bg-slate-400" },
    { value: "warm", label: "Warm (Interessado)", color: "bg-amber-400" },
    { value: "hot", label: "Hot (Pronto)", color: "bg-rose-500" },
    { value: "converted", label: "Convertido (Paciente)", color: "bg-emerald-500" }
];

export default function AppointmentForm({ open, onOpenChange, appointment, professionals = [], onSuccess }: AppointmentFormProps) {
    const queryClient = useQueryClient();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSearchingPatient, setIsSearchingPatient] = useState(false);
    const [patientSearch, setPatientSearch] = useState("");

    // Form State
    const [formData, setFormData] = useState({
        patient_id: "",
        professional_id: "",
        date: format(new Date(), "yyyy-MM-dd"),
        start_time: "09:00",
        duration: 30,
        type: "Consulta",
        procedure_name: "",
        status: "agendado",
        notes: "",
        funnel_status: "lead",
        temperature: "warm"
    });

    // Reset form when opening/closing or changing appointment
    useEffect(() => {
        if (open) {
            if (appointment) {
                setFormData({
                    patient_id: String(appointment.patient_id || ""),
                    professional_id: String(appointment.professional_id || ""),
                    date: appointment.start_time ? format(new Date(appointment.start_time), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
                    // Handle start_time carefully (ISO or HH:mm)
                    start_time: appointment.start_time ? (appointment.start_time.includes('T') ? format(new Date(appointment.start_time), "HH:mm") : appointment.start_time) : "09:00",
                    duration: appointment.duration || 30,
                    type: appointment.type || "Consulta",
                    procedure_name: appointment.procedure_name || "",
                    status: appointment.status || "agendado",
                    notes: appointment.notes || "",
                    funnel_status: appointment.patient?.funnel_status || "lead",
                    temperature: appointment.patient?.temperature || "warm"
                });
                setStep(1);
            } else {
                setFormData({
                    patient_id: "",
                    professional_id: professionals.length > 0 ? String(professionals[0].id) : "",
                    date: format(new Date(), "yyyy-MM-dd"),
                    start_time: "09:00",
                    duration: 30,
                    type: "Consulta",
                    procedure_name: "",
                    status: "agendado",
                    notes: "",
                    funnel_status: "lead",
                    temperature: "warm"
                });
                setStep(1);
            }
        }
    }, [open, appointment, professionals]);

    const { data: searchPatients = [] } = useQuery({
        queryKey: ["patients-search", patientSearch],
        queryFn: async () => {
            if (patientSearch.length < 2) return [];
            return await base44.list("Patient", {
                filter: { name: { _ilike: `%${patientSearch}%` } },
                limit: 5
            });
        },
        enabled: patientSearch.length >= 2
    });

    const { data: procedures = [], isLoading: isLoadingProcedures } = useQuery({
        queryKey: ["procedures"],
        queryFn: async () => {
            const data = await base44.list("ProcedureType", {
                filter: { active: true }
            });
            return data;
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.patient_id || !formData.professional_id) {
            toast.error("Por favor, selecione um paciente e um profissional.");
            return;
        }

        setIsSubmitting(true);
        try {
            const startDateTime = new Date(`${formData.date}T${formData.start_time}`);
            const endDateTime = addMinutes(startDateTime, formData.duration);

            const payload = {
                patient_id: parseInt(formData.patient_id),
                professional_id: formData.professional_id,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                duration: formData.duration,
                type: formData.type,
                procedure_name: formData.procedure_name,
                status: formData.status,
                notes: formData.notes
            };

            if (appointment) {
                await base44.update("Appointment", appointment.id, payload);
                toast.success("Agendamento atualizado!");
            } else {
                await base44.create("Appointment", payload);
                toast.success("Agendamento criado!");

                // Track funnel update if it's a new appointment
                await base44.update("Patient", parseInt(formData.patient_id), {
                    funnel_status: formData.funnel_status,
                    temperature: formData.temperature
                });
            }

            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            onSuccess?.();
            onOpenChange(false);
        } catch (err) {
            console.error("Error saving appointment:", err);
            toast.error("Erro ao salvar agendamento.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNext = () => {
        if (!formData.patient_id) {
            toast.error("Selecione um paciente para continuar.");
            return;
        }
        setStep(2);
    };

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const FormContainer = isMobile ? Sheet : Dialog;
    const FormContent = isMobile ? SheetContent : DialogContent;
    const FormHeader = isMobile ? SheetHeader : DialogHeader;
    const FormTitle = isMobile ? SheetTitle : DialogTitle;
    const FormDescription = isMobile ? SheetDescription : DialogDescription;

    return (
        <FormContainer open={open} onOpenChange={onOpenChange}>
            <FormContent
                {...(isMobile ? { side: "bottom" } : {})}
                className={cn(
                    isMobile
                        ? "h-[92vh] rounded-t-[32px] p-6 pt-2"
                        : "sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
                )}
            >
                {isMobile && (
                    <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-4 mb-6" />
                )}
                <FormHeader>
                    <FormTitle>{appointment ? "Editar Agendamento" : "Novo Agendamento"}</FormTitle>
                    <FormDescription className="sr-only">Formulário para agendamento de consultas e procedimentos.</FormDescription>
                </FormHeader>

                <div className="py-2">
                    {step === 1 ? (
                        <div className="space-y-6">
                            {/* Patient Search */}
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Paciente</Label>
                                {!formData.patient_id ? (
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                                        <Input
                                            placeholder="Buscar paciente..."
                                            value={patientSearch}
                                            onChange={(e) => setPatientSearch(e.target.value)}
                                            className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5"
                                        />
                                        {searchPatients.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
                                                {searchPatients.map((p: any) => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => {
                                                            setFormData({ ...formData, patient_id: String(p.id) });
                                                            setPatientSearch("");
                                                        }}
                                                        className="w-full h-14 px-4 flex items-center justify-between hover:bg-blue-500/10 transition-colors group"
                                                    >
                                                        <div className="flex items-center gap-3 text-left">
                                                            <Avatar className="w-8 h-8">
                                                                <AvatarFallback>{p.name?.[0]}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="text-sm font-bold truncate group-hover:text-blue-500">{p.name}</div>
                                                                <div className="text-[10px] opacity-50">{p.phone || 'Sem telefone'}</div>
                                                            </div>
                                                        </div>
                                                        <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 text-blue-500 transition-all" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-black">
                                                {format(new Date(), "HH:mm") > "00:00" ? <Check className="w-5 h-5 text-white" /> : "P"}
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-blue-600 dark:text-blue-400">Paciente Selecionado</div>
                                                <div className="text-xs font-bold opacity-70">
                                                    ID: {formData.patient_id}
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => setFormData({ ...formData, patient_id: "" })} className="h-8 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                                            Trocar
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Funnel & Temperature (CRM) */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Status Funil</Label>
                                    <Select
                                        value={formData.funnel_status}
                                        onValueChange={(val) => setFormData({ ...formData, funnel_status: val })}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-white/10">
                                            {FUNNEL_STATUS.map(s => (
                                                <SelectItem key={s.value} value={s.value}>
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn("w-2 h-2 rounded-full", s.color)} />
                                                        {s.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Temperatura</Label>
                                    <Select
                                        value={formData.temperature}
                                        onValueChange={(val) => setFormData({ ...formData, temperature: val })}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-white/10">
                                            <SelectItem value="cold">Frio (Inativo)</SelectItem>
                                            <SelectItem value="warm">Morno (Aguardando)</SelectItem>
                                            <SelectItem value="hot">Quente (Imediato)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button onClick={handleNext} className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                Continuar para Agenda
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Professional Select */}
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Profissional</Label>
                                <Select
                                    value={formData.professional_id}
                                    onValueChange={(val) => setFormData({ ...formData, professional_id: val })}
                                >
                                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5">
                                        <SelectValue placeholder="Selecione o profissional" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-white/10">
                                        {professionals.map((p) => (
                                            <SelectItem key={p.id} value={String(p.id)}>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="w-5 h-5">
                                                        <AvatarImage src={p.photo_url || p.image} />
                                                        <AvatarFallback>{p.name?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                    {p.name || p.full_name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Procedure / Type */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Tipo</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(val) => setFormData({ ...formData, type: val })}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-white/10">
                                            {TYPES_LIST.map(t => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Procedimento</Label>
                                    <Select
                                        value={formData.procedure_name}
                                        onValueChange={(val) => {
                                            if (val === "create_new") {
                                                // Handle create new logic
                                                return;
                                            }
                                            const proc = procedures.find(p => p.name === val);
                                            setFormData({
                                                ...formData,
                                                procedure_name: val,
                                                duration: proc?.duration_minutes || formData.duration
                                            });
                                        }}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5">
                                            <SelectValue placeholder="Opcional" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                            <SelectItem value="create_new" className="font-semibold text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50">
                                                <div className="flex items-center gap-2">
                                                    <Plus className="w-4 h-4" />
                                                    Criar Novo Procedimento...
                                                </div>
                                            </SelectItem>
                                            <SelectGroup>
                                                <SelectLabel className="text-[10px] font-black uppercase tracking-widest opacity-30 px-2 py-1.5">Sugestões</SelectLabel>
                                                {procedures.map((p) => (
                                                    <SelectItem key={p.id} value={p.name}>
                                                        <div className="flex items-center justify-between w-full gap-4">
                                                            <span>{p.name}</span>
                                                            <span className="text-[10px] opacity-40">{p.duration_minutes}min</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Date & Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Data</Label>
                                    <Input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Início</Label>
                                    <Input
                                        type="time"
                                        value={formData.start_time}
                                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                        className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5"
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Observações</Label>
                                <Textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Destaque informações importantes aqui..."
                                    className="min-h-[100px] rounded-2xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5 resize-none"
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button variant="ghost" onClick={() => setStep(1)} className="h-14 rounded-2xl px-6 border border-slate-200 dark:border-white/5 font-bold">
                                    Voltar
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        appointment ? "Salvar Alterações" : "Confirmar Agendamento"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </FormContent>
        </FormContainer>
    );
}
