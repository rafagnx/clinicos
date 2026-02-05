import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, User, Check, Loader2, Plus } from "lucide-react";
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

const SOURCES = [
    "Tráfego Pago (Google)",
    "Tráfego Pago (Instagram/Facebook)",
    "Instagram Orgânico",
    "Indicação",
    "Retorno/Recorrência",
    "Passante/Fachada",
    "Outro"
];

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function AppointmentForm({
    open,
    onOpenChange,
    appointment,
    professionals,
    onSuccess
}: AppointmentFormProps) {
    const queryClient = useQueryClient();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        patient_id: "",
        patient_name: "",
        professional_id: "",
        procedure_name: "",
        date: new Date(),
        time: "09:00",
        duration: 60,
        type: "Consulta",
        notes: "",
        status: "agendado",
        scheduled_by: "",
        promotion_id: "none",
        source: "",
        // Patient Behavioral fields (High Ticket)
        temperature: "",
        temperament: "",
        conscience_level: "",
        main_motivation: ""
    });

    const [selectedPatient, setSelectedPatient] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [newProcedureData, setNewProcedureData] = useState({ name: "", duration: 60 });

    const handleCreateProcedure = async () => {
        try {
            if (!newProcedureData.name) return;

            await base44.entities.ProcedureType.create({
                name: newProcedureData.name,
                duration_minutes: newProcedureData.duration,
                category: "Meus Procedimentos",
                active: true
            });

            toast.success("Procedimento criado!");
            queryClient.invalidateQueries({ queryKey: ["procedure-types"] });

            // Auto-select the new procedure
            setFormData(prev => ({
                ...prev,
                procedure_name: newProcedureData.name,
                duration: newProcedureData.duration
            }));

            // Reset temp state
            setNewProcedureData({ name: "", duration: 60 });
        } catch (error) {
            toast.error("Erro ao criar procedimento");
        }
    };

    // Reset form when dialog opens/closes or appointment changes
    useEffect(() => {
        if (open) {
            if (appointment) {
                // Handle different start_time formats (ISO string vs HH:mm string)
                let initialDate = new Date();
                let initialTime = "09:00";

                if (appointment.date) {
                    // Specific handling for YYYY-MM-DD strings to avoid timezone issues
                    if (typeof appointment.date === 'string' && appointment.date.match(/^\d{4}-\d{2}-\d{2}/)) {
                        const datePart = appointment.date.split('T')[0]; // Handle both "YYYY-MM-DD" and "YYYY-MM-DDTHH:MM:SS"
                        const [y, m, d] = datePart.split('-').map(Number);
                        const cleanDate = new Date(y, m - 1, d); // LOCAL timezone
                        if (isValid(cleanDate)) initialDate = cleanDate;
                    } else if (appointment.date instanceof Date) {
                        // Already a Date object - extract local components
                        initialDate = new Date(appointment.date.getFullYear(), appointment.date.getMonth(), appointment.date.getDate());
                    } else {
                        // Fallback: try parsing and extract local components
                        const d = new Date(appointment.date);
                        if (isValid(d)) {
                            initialDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                        }
                    }
                } else if (appointment.start_time && appointment.start_time.includes('T')) {
                    // Parse ISO string to Date, then extract LOCAL date/time
                    const utcDate = new Date(appointment.start_time);
                    if (isValid(utcDate)) {
                        // Create a NEW Date using LOCAL year/month/day from the parsed date
                        initialDate = new Date(utcDate.getFullYear(), utcDate.getMonth(), utcDate.getDate());
                    }
                }

                if (appointment.start_time) {
                    if (appointment.start_time.includes('T')) {
                        const d = new Date(appointment.start_time);
                        if (isValid(d)) initialTime = format(d, "HH:mm"); // format uses local time
                    } else if (appointment.start_time.includes(':')) {
                        initialTime = appointment.start_time;
                    }
                }

                setFormData({
                    ...appointment,
                    date: isValid(initialDate) ? initialDate : new Date(),
                    time: initialTime,
                    scheduled_by: appointment.scheduled_by || "",
                    promotion_id: appointment.promotion_id || "none",
                    source: appointment.source || "",
                    temperature: appointment.patient?.temperature || "",
                    temperament: appointment.patient?.temperament || "",
                    conscience_level: appointment.patient?.conscience_level || "",
                    main_motivation: appointment.patient?.main_motivation || ""
                });
                if (appointment.patient) {
                    setSelectedPatient(appointment.patient);
                    setFormData(prev => ({
                        ...prev,
                        temperature: appointment.patient.temperature || "",
                        temperament: appointment.patient.temperament || "",
                        conscience_level: appointment.patient.conscience_level || "",
                        main_motivation: appointment.patient.main_motivation || ""
                    }));
                }

                // Only skip to step 2 if we have a patient or if it's an existing appointment being edited
                if (appointment.id || appointment.patient) {
                    setStep(2);
                } else {
                    setStep(1);
                }
            } else {
                // New appointment defaults
                setFormData({
                    patient_id: "",
                    patient_name: "",
                    professional_id: "",
                    procedure_name: "",
                    date: new Date(),
                    time: "09:00",
                    duration: 60,
                    type: "Consulta",
                    notes: "",
                    status: "agendado",
                    scheduled_by: "",
                    promotion_id: "none",
                    source: "",
                    temperature: "",
                    temperament: "",
                    conscience_level: "",
                    main_motivation: ""
                });
                setSelectedPatient(null);
                setStep(1);
            }
        }
    }, [open, appointment]);

    // Use provided professionals or fetch if missing (but Agenda should pass them)
    // If we need to fetch, we should probably filter too, but for now relies on prop
    const { data: fetchedProfessionals } = useQuery({
        queryKey: ["professionals"],
        queryFn: () => base44.entities.Professional.list(),
        enabled: !professionals || professionals.length === 0
    });

    // Helper to identify clinical professionals
    const isClinical = (p: any) => {
        const role = (p.role_type || "").toLowerCase();
        const specialty = (p.specialty || "").toLowerCase();
        return ["hof", "biomedico", "biomédico", "doutor", "medico", "médico", "esteticista", "dentista"].some(r => role.includes(r) || specialty.includes(r));
    };

    const activeProfessionals = React.useMemo(() => {
        const source = professionals && professionals.length > 0 ? professionals : (fetchedProfessionals || []);
        return source.filter(isClinical);
    }, [professionals, fetchedProfessionals]);

    // Query for all staff to find secretaries
    const { data: allStaff = [] } = useQuery({
        queryKey: ["all-staff"],
        queryFn: () => base44.entities.Professional.list()
    });

    // Secretaries = Allowed scheduling roles (Secretary, Admin, Manager, Receptionist)
    const secretaries = React.useMemo(() => {
        return allStaff.filter(p => {
            const role = (p.role_type || "").toLowerCase();
            const specialty = (p.specialty || "").toLowerCase();
            // Explicitly allow these roles as requested
            const isAllowedRole = ["secretária", "secretaria", "recepcionista", "admin", "administrador", "gerente", "management"].some(r => role.includes(r) || specialty.includes(r));

            // Explicitly exclude "Rafa" (Admin) as requested
            const isRafa = (p.full_name || p.name || "").toLowerCase().includes("rafa");

            return isAllowedRole && !isRafa;
        });
    }, [allStaff]);

    const { data: customProcedures = [] } = useQuery({
        queryKey: ["procedure-types"],
        queryFn: () => base44.entities.ProcedureType.list()
    });

    const { data: patients = [], isLoading: isLoadingPatients } = useQuery({
        queryKey: ["patients", searchTerm],
        queryFn: () => {
            const filters: any = {};
            if (searchTerm && searchTerm.length > 0) {
                filters.full_name = { _ilike: `%${searchTerm}%` };
            }

            return base44.list("Patient", {
                filter: filters,
                sort: [{ field: "full_name", direction: "asc" }],
                limit: 10
            });
        },
        enabled: step === 1 && open
    });

    // Calculate End Time
    const endTime = React.useMemo(() => {
        if (!formData.date || !formData.time || !formData.duration) return "--:--";

        try {
            const dateObj = new Date(formData.date);
            if (!isValid(dateObj)) return "--:--";

            const [hours, minutes] = formData.time.split(":");
            dateObj.setHours(parseInt(hours), parseInt(minutes));

            const durationNum = Number(formData.duration);
            if (isNaN(durationNum)) return "--:--";

            const endDate = addMinutes(dateObj, durationNum);
            return isValid(endDate) ? format(endDate, "HH:mm") : "--:--";
        } catch (e) {
            console.error("Error calculating end time:", e);
            return "--:--";
        }
    }, [formData.date, formData.time, formData.duration]);

    const createMutation = useMutation({
        mutationFn: (data: any) => {
            if (!data.date || !data.time || !data.duration) {
                throw new Error("Missing required fields");
            }
            if (!data.scheduled_by) {
                throw new Error("Informe quem realizou o agendamento");
            }

            // SAFE DATE PARSING (Local Time)
            let startDateTime: Date;

            if (data.date instanceof Date) {
                startDateTime = new Date(data.date);
            } else if (typeof data.date === 'string') {
                // Force "YYYY-MM-DD" to be treated as Local Midnight, not UTC
                const [y, m, d] = data.date.split('T')[0].split('-').map(Number);
                startDateTime = new Date(y, m - 1, d);
            } else {
                startDateTime = new Date();
            }

            const [hours, minutes] = data.time.split(":");
            startDateTime.setHours(parseInt(hours), parseInt(minutes));

            const endDateTime = addMinutes(startDateTime, data.duration);

            const payload = {
                ...data,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                date: format(startDateTime, "yyyy-MM-dd"),
                promotion_id: data.promotion_id === "none" ? null : data.promotion_id
            };

            // Clean up UI-only fields if needed
            delete payload.patient_name;

            return base44.entities.Appointment.create(payload);
        },
        onSuccess: async (data, variables) => {
            toast.success("Agendamento criado com sucesso!");
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            onSuccess?.();
            onOpenChange(false);

            // Notify Professional
            if (data && data.id) {
                const notifApp = { ...data, ...variables, id: data.id }; // Merge backend result with form data
                sendAppointmentNotifications(notifApp, "created");
            }
        },
        onError: () => toast.error("Erro ao criar agendamento")
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => {
            // SAFE DATE PARSING (Local Time)
            let startDateTime: Date;
            if (data.date instanceof Date) {
                startDateTime = new Date(data.date);
            } else if (typeof data.date === 'string') {
                // Force "YYYY-MM-DD" to be treated as Local Midnight, not UTC
                const [y, m, d] = data.date.split('T')[0].split('-').map(Number);
                startDateTime = new Date(y, m - 1, d);
            } else {
                startDateTime = new Date();
            }

            const [hours, minutes] = data.time.split(":");
            startDateTime.setHours(parseInt(hours), parseInt(minutes));

            const endDateTime = addMinutes(startDateTime, data.duration);

            const payload = {
                ...data,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                date: format(startDateTime, "yyyy-MM-dd"),
                promotion_id: data.promotion_id === "none" ? null : data.promotion_id
            };

            return base44.entities.Appointment.update(appointment.id, payload);
        },
        onSuccess: () => {
            toast.success("Agendamento atualizado!");
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            onSuccess?.();
            onOpenChange(false);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string | number) => base44.delete("Appointment", id),
        onSuccess: () => {
            toast.success("Agendamento removido!");
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            onSuccess?.();
            onOpenChange(false);
        },
        onError: () => toast.error("Erro ao remover agendamento")
    });

    const handleSubmit = async () => {
        // Sync patient behavioral data if changed
        if (selectedPatient?.id) {
            try {
                await base44.entities.Patient.update(selectedPatient.id, {
                    temperature: formData.temperature,
                    temperament: formData.temperament,
                    conscience_level: formData.conscience_level,
                    main_motivation: formData.main_motivation
                });
                queryClient.invalidateQueries({ queryKey: ["patients"] });
            } catch (err) {
                console.warn("Failed to sync patient behavioral data", err);
            }
        }

        if (appointment?.id) {
            updateMutation.mutate(formData);
        } else {
            createMutation.mutate(formData);
        }
    };

    const handlePatientSelect = (patient) => {
        setSelectedPatient(patient);
        setFormData(prev => ({
            ...prev,
            patient_id: patient.id,
            patient_name: patient.full_name || patient.name,
            temperature: patient.temperature || "",
            temperament: patient.temperament || "",
            conscience_level: patient.conscience_level || "",
            main_motivation: patient.main_motivation || ""
        }));
        setStep(2);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{appointment ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
                    <DialogDescription className="sr-only">Formulário para agendamento de consultas e procedimentos.</DialogDescription>
                </DialogHeader>

                <div className="py-2">
                    {step === 1 ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Buscar Paciente</Label>
                                <Input
                                    placeholder="Nome, CPF ou Telefone..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto">
                                {isLoadingPatients ? (
                                    <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                                ) : patients.length > 0 ? (
                                    patients.map(patient => (
                                        <div
                                            key={patient.id}
                                            onClick={() => handlePatientSelect(patient)}
                                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50 cursor-pointer transition-colors"
                                        >
                                            <Avatar>
                                                <AvatarImage src={patient.photo_url} />
                                                <AvatarFallback>{(patient.full_name || patient.name || "?").charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{patient.full_name || patient.name}</p>
                                                <p className="text-xs text-slate-500">{patient.phone || "Sem telefone"}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : searchTerm.length > 2 ? (
                                    <div className="text-center p-4 text-slate-500">
                                        Nenhum paciente encontrado.
                                        <Button
                                            variant="link"
                                            className="text-blue-600 block mx-auto mt-2"
                                            onClick={() => window.location.href = "/Patients"}
                                        >
                                            Cadastrar Novo Paciente
                                        </Button>
                                    </div>
                                ) : null}
                            </div>
                            <div className="pt-4 border-t">
                                <Button variant="ghost" className="w-full" onClick={() => setStep(2)}>
                                    Agendar Compromisso (Sem Paciente)
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Paciente *</Label>
                                {selectedPatient ? (
                                    <div className="flex items-center gap-3 p-2 border rounded-md bg-slate-50">
                                        <User className="w-4 h-4 text-slate-500" />
                                        <span className="text-sm font-medium flex-1">{selectedPatient.full_name || selectedPatient.name}</span>
                                        {!appointment && (
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setStep(1)}><Check className="w-3 h-3" /></Button> // Using Check as placeholder for "change" or just X
                                        )}
                                        {!appointment && <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setStep(1)}>Trocar</Button>}
                                    </div>
                                ) : (
                                    <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={() => setStep(1)}>
                                        Selecione o paciente...
                                    </Button>
                                )}
                            </div>

                            {/* --- High Ticket Behavioral Profile Section --- */}
                            {selectedPatient && (
                                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-4 dark:bg-indigo-900/10 dark:border-indigo-900/30">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                            <Label className="text-[10px] font-black uppercase tracking-widest cursor-default">HT</Label>
                                        </div>
                                        <span className="text-xs font-bold text-indigo-800 uppercase tracking-widest dark:text-indigo-400">Perfil Comportamental (High Ticket)</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] uppercase font-bold text-indigo-600/70">Temperatura</Label>
                                            <Select value={formData.temperature} onValueChange={(v) => setFormData(p => ({ ...p, temperature: v }))}>
                                                <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900/50">
                                                    <SelectValue placeholder="Temp." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="hot">🔥 Quente</SelectItem>
                                                    <SelectItem value="warm">⚡ Morno</SelectItem>
                                                    <SelectItem value="cold">❄️ Frio</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] uppercase font-bold text-indigo-600/70">Temperamento</Label>
                                            <Select value={formData.temperament} onValueChange={(v) => setFormData(p => ({ ...p, temperament: v }))}>
                                                <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900/50">
                                                    <SelectValue placeholder="Temp." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="analitico">🧠 Analítico</SelectItem>
                                                    <SelectItem value="executor">🚀 Executor</SelectItem>
                                                    <SelectItem value="comunicador">💬 Comunicador</SelectItem>
                                                    <SelectItem value="planejador">📋 Planejador</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] uppercase font-bold text-indigo-600/70">Principal Motivação</Label>
                                            <Select value={formData.main_motivation} onValueChange={(v) => setFormData(p => ({ ...p, main_motivation: v }))}>
                                                <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900/50">
                                                    <SelectValue placeholder="Motivação" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="dor">💊 Dor</SelectItem>
                                                    <SelectItem value="prazer">✨ Prazer</SelectItem>
                                                    <SelectItem value="status">💎 Status</SelectItem>
                                                    <SelectItem value="seguranca">🛡️ Segurança</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] uppercase font-bold text-indigo-600/70">Consciência de Compra</Label>
                                            <Select value={formData.conscience_level} onValueChange={(v) => setFormData(p => ({ ...p, conscience_level: v }))}>
                                                <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900/50">
                                                    <SelectValue placeholder="Consciência" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="unaware">Inconsciente</SelectItem>
                                                    <SelectItem value="problem_aware">Problema</SelectItem>
                                                    <SelectItem value="solution_aware">Solução</SelectItem>
                                                    <SelectItem value="product_aware">Produto</SelectItem>
                                                    <SelectItem value="most_aware">Totalmente</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Profissional *</Label>
                                <Select value={formData.professional_id} onValueChange={(v) => setFormData(p => ({ ...p, professional_id: v }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o profissional" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {activeProfessionals.map(prof => (
                                            <SelectItem key={prof.id} value={prof.id}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: prof.color || '#3b82f6' }} />
                                                    {prof.full_name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-2">
                                    <Label>Data *</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal px-2", !formData.date && "text-muted-foreground")}>
                                                {formData.date && isValid(formData.date) ? format(formData.date, "dd/MM/yyyy") : <span>Data</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={formData.date} onSelect={(date) => setFormData(p => ({ ...p, date }))} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label>Início *</Label>
                                    <Input type="time" value={formData.time} onChange={(e) => setFormData(p => ({ ...p, time: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Término</Label>
                                    <Input value={endTime} disabled className="bg-slate-50" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Tipo de Atendimento</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(v) => {
                                        let newDuration = 60; // Default to 1 hour
                                        if (v === "Retorno") newDuration = 25;
                                        setFormData(p => ({ ...p, type: v, duration: newDuration }));
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TYPES_LIST.map(t => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Nome do Procedimento</Label>
                                <Select
                                    value={formData.procedure_name}
                                    onValueChange={(v) => {
                                        setFormData(p => {
                                            const updates = { ...p, procedure_name: v };
                                            // Auto-update duration if it matches a custom procedure
                                            const match = customProcedures.find(c => c.name === v);
                                            if (match) {
                                                updates.duration = match.duration_minutes;
                                            }
                                            return updates;
                                        });
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Ou digite o nome do procedimento..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        <SelectItem value="create_new" className="font-semibold text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50">
                                            <div className="flex items-center gap-2">
                                                <Plus className="w-4 h-4" />
                                                Criar Novo Procedimento...
                                            </div>
                                        </SelectItem>
                                        <div className="h-px bg-slate-100 my-1" />
                                        {(() => {
                                            const grouped = getGroupedProcedures(customProcedures);
                                            return grouped.map((group) => (
                                                <SelectGroup key={group.title}>
                                                    <SelectLabel className="font-bold text-slate-900 bg-slate-50 px-2 py-1.5">{group.title}</SelectLabel>
                                                    {group.items.map((proc: any) => (
                                                        <SelectItem key={proc.id} value={proc.name} className="pl-6">
                                                            <div className="flex items-center justify-between w-full gap-2">
                                                                <span>{proc.name}</span>
                                                                <span className="text-xs text-slate-400">({proc.duration_minutes} min)</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            ));
                                        })()}
                                        <SelectGroup>
                                            <SelectLabel className="font-bold text-slate-900 bg-slate-50 px-2 py-1.5">Outros</SelectLabel>
                                            <SelectItem value="outro" className="pl-6">Outro (Digitar)</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                {formData.procedure_name === "create_new" && (
                                    <div className="mt-2 p-3 bg-emerald-50 rounded-md border border-emerald-100 animate-in fade-in slide-in-from-top-2">
                                        <div className="space-y-3">
                                            <div>
                                                <Label className="text-xs text-emerald-800">Nome do Novo Procedimento</Label>
                                                <Input
                                                    autoFocus
                                                    placeholder="Ex: Harmonização Facial Completa"
                                                    className="bg-white"
                                                    onChange={(e) => {
                                                        // We use a temporary state or just wait for Enter/Blur?
                                                        // For simplicity, let's use a ref or just update a temp field in formData if we want, 
                                                        // but cleaner is to have a local state for 'newProcedureName'.
                                                        // Let's assume we added 'newProcedureName' and 'newProcedureDuration' state variables.
                                                        setNewProcedureData(prev => ({ ...prev, name: e.target.value }));
                                                    }}
                                                    value={newProcedureData.name}
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="w-24">
                                                    <Label className="text-xs text-emerald-800">Duração (min)</Label>
                                                    <Input
                                                        type="number"
                                                        className="bg-white"
                                                        value={newProcedureData.duration}
                                                        onChange={(e) => setNewProcedureData(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                                                    />
                                                </div>
                                                <div className="flex-1 flex items-end">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                                        onClick={() => handleCreateProcedure()}
                                                        disabled={!newProcedureData.name}
                                                    >
                                                        Salvar Novo Procedimento
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {formData.procedure_name === "outro" && (
                                    <Input
                                        placeholder="Digite o nome do procedimento"
                                        onChange={(e) => setFormData(p => ({ ...p, procedure_name: e.target.value }))}
                                        className="mt-2"
                                    />
                                )}
                            </div>


                            <div className="space-y-2">
                                <Label>Canal de Aquisição (Origem)</Label>
                                <Select
                                    value={formData.source || ""}
                                    onValueChange={(v) => setFormData(p => ({ ...p, source: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a origem deste agendamento" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SOURCES.map(s => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Agendado por *</Label>
                                {secretaries.length > 0 ? (
                                    <Select
                                        value={formData.scheduled_by}
                                        onValueChange={(v) => setFormData(p => ({ ...p, scheduled_by: v }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione quem agendou" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {secretaries.map(sec => (
                                                <SelectItem key={sec.id} value={sec.full_name || sec.name || "Secretária"}>
                                                    {sec.full_name || sec.name}
                                                </SelectItem>
                                            ))}
                                            <SelectItem value="other_manual">Outro (Digitar)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input
                                        placeholder="Digite seu nome (Obrigatório)"
                                        value={formData.scheduled_by}
                                        onChange={(e) => setFormData(p => ({ ...p, scheduled_by: e.target.value }))}
                                    />
                                )}
                                {formData.scheduled_by === "other_manual" && (
                                    <Input
                                        placeholder="Digite o nome..."
                                        className="mt-2"
                                        onChange={(e) => setFormData(p => ({ ...p, scheduled_by: e.target.value }))}
                                    />
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Promoção Relacionada</Label>
                                <RadioGroup value={formData.promotion_id} onValueChange={(v) => setFormData(p => ({ ...p, promotion_id: v }))} className="flex flex-col space-y-1">
                                    <div className="flex items-center space-x-2 border p-3 rounded-md">
                                        <RadioGroupItem value="none" id="promo-none" />
                                        <Label htmlFor="promo-none" className="font-normal cursor-pointer flex-1">Nenhuma promoção</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="space-y-2">
                                <Label>Observações</Label>
                                <Textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                                    placeholder="Observações sobre a consulta..."
                                    className="min-h-[80px]"
                                />
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t mt-4">
                                {appointment?.id ? (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                            if (confirm("Tem certeza que deseja apagar este agendamento?")) {
                                                deleteMutation.mutate(appointment.id);
                                            }
                                        }}
                                        disabled={deleteMutation.isPending}
                                    >
                                        {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Excluir"}
                                    </Button>
                                ) : <div></div>}

                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                                    <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                                        {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                        Confirmar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

