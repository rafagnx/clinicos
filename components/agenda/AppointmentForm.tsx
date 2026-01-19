import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, User, Check, Loader2 } from "lucide-react";
import { format, addMinutes, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AppointmentFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointment?: any;
    professionals?: any[];
    onSuccess?: () => void;
}

const PROCEDURES_OPTIONS = [
    {
        category: "Toxina Botulínica",
        items: ["TOXINA BOTULÍNICA"]
    },
    {
        category: "Preenchimentos",
        items: [
            "PREENCHIMENTO 8POINT",
            "PREENCHIMENTO COMISSURA",
            "PREENCHIMENTO LÁBIO",
            "PREENCHIMENTO MALAR",
            "PREENCHIMENTO MANDÍBULA",
            "PREENCHIMENTO MENTO",
            "PREENCHIMENTO PRÉ JOWLS",
            "PREENCHIMENTO NARIZ",
            "PREENCHIMENTO OLHEIRA",
            "PREENCHIMENTO SULCO NASO",
            "PREENCHIMENTO TÊMPORA",
            "PREENCHIMENTO GLABELA",
            "PREENCHIMENTO MARIONETE"
        ]
    },
    {
        category: "Fios",
        items: [
            "FIO PDO LISO",
            "FIO PDO TRAÇÃO SUSTENTAÇÃO"
        ]
    },
    {
        category: "Bioestimuladores",
        items: [
            "BIOESTIMULADOR"
        ]
    },
    {
        category: "Tecnologias",
        items: [
            "PDRN",
            "EXOSSOMOS",
            "LAVIEEN",
            "HIPRO"
        ]
    },
    {
        category: "Tratamentos",
        items: [
            "MICROAGULHAMENTO",
            "HIALURONIDASE",
            "ENDOLASER FULL FACE",
            "ENDOLASER REGIÃO",
            "ENDOLASER PESCOÇO E PAPADA"
        ]
    },
    {
        category: "Transplante",
        items: [
            "TRANSP. DE SOBRANCELHA TP1",
            "TRANSP. DE SOBRANCELHA TP2",
            "TRANSP. DE SOBRANCELHA TP3"
        ]
    },
    {
        category: "Cirurgias",
        items: [
            "CIRURGIA ALECTOMIA",
            "CIRURGIA BICHECTOMIA",
            "CIRURGIA BROW LIFT",
            "CIRURGIA LIP LIFT CORNER LIFT",
            "CIRURGIA LIP LIFT INFERIOR",
            "CIRURGIA LIP LIFT SUPERIOR",
            "CIRURGIA SLIM TIP",
            "CIRURGIA LIPOASPIRAÇÃO DE PAPADA",
            "CIRURGIA LIFT DE TEMPORAL",
            "CIRURGIA PRÓTESE DEFINITIVA",
            "CIRURGIA MINI LIFT",
            "CIRURGIA BLEFARO",
            "CIRURGIA RINOPLASTIA",
            "CIRURGIA OTOMODELAÇÃO",
            "CIRURGIA RINO ESTRUTURADA",
            "CIRURGIA PLATISMOPLATIA"
        ]
    },
    {
        category: "Corporal",
        items: [
            "GLUTEO MAX",
            "GORDURA LOCALIZADA",
            "BIOESTIMULADOR CORPORAL",
            "BIOESTIMULADOR GLUTEO",
            "PREENCHIMENTO GLUTEO",
            "PROTOCOLO 40 DIAS",
            "HIPERTROFIA"
        ]
    }
];

const SECRETARIES_LIST = [
    "Tainara",
    "Fernanda",
    "Jessica"
];

const TYPES_LIST = [
    "Consulta",
    "Retorno",
    "Exame",
    "Procedimento",
    "Encaixe",
    "Compromisso"
];

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function AppointmentForm({
    open,
    onOpenChange,
    appointment,
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
        promotion_id: "none"
    });

    const [selectedPatient, setSelectedPatient] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Reset form when dialog opens/closes or appointment changes
    useEffect(() => {
        if (open) {
            if (appointment) {
                // Handle different start_time formats (ISO string vs HH:mm string)
                let initialDate = new Date();
                let initialTime = "09:00";

                if (appointment.date) {
                    // If date is provided (string or Date), use it
                    const d = new Date(appointment.date);
                    if (isValid(d)) initialDate = d;

                    // Specific handling for YYYY-MM-DD strings to avoid timezone issues
                    if (typeof appointment.date === 'string' && appointment.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        const [y, m, d] = appointment.date.split('-').map(Number);
                        const cleanDate = new Date(y, m - 1, d);
                        if (isValid(cleanDate)) initialDate = cleanDate;
                    }
                } else if (appointment.start_time && appointment.start_time.includes('T')) {
                    const d = new Date(appointment.start_time);
                    if (isValid(d)) initialDate = d;
                }

                if (appointment.start_time) {
                    if (appointment.start_time.includes('T')) {
                        const d = new Date(appointment.start_time);
                        if (isValid(d)) initialTime = format(d, "HH:mm");
                    } else if (appointment.start_time.includes(':')) {
                        initialTime = appointment.start_time;
                    }
                }

                setFormData({
                    ...appointment,
                    date: isValid(initialDate) ? initialDate : new Date(),
                    time: initialTime,
                    scheduled_by: appointment.scheduled_by || "",
                    promotion_id: appointment.promotion_id || "none"
                });
                if (appointment.patient) {
                    setSelectedPatient(appointment.patient);
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
                    promotion_id: "none"
                });
                setSelectedPatient(null);
                setStep(1);
            }
        }
    }, [open, appointment]);

    const { data: professionals = [] } = useQuery({
        queryKey: ["professionals"],
        queryFn: () => base44.entities.Professional.list()
    });

    const { data: patients = [], isLoading: isLoadingPatients } = useQuery({
        queryKey: ["patients", searchTerm],
        queryFn: () => {
            const filters: any = {};
            if (searchTerm && searchTerm.length > 0) {
                filters.full_name = { _ilike: `%${searchTerm}%` };
            }

            return base44.read("Patient", {
                filter: filters,
                sort: [{ field: "full_name", direction: "asc" }],
                limit: 10
            });
        },
        enabled: step === 1 && open
    });

    // Calculate End Time
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

            const startDateTime = new Date(data.date);
            const [hours, minutes] = data.time.split(":");
            startDateTime.setHours(parseInt(hours), parseInt(minutes));

            const endDateTime = addMinutes(startDateTime, data.duration);

            const payload = {
                ...data,
                start_time: format(startDateTime, "HH:mm"),
                end_time: format(endDateTime, "HH:mm"),
                date: format(startDateTime, "yyyy-MM-dd"),
                promotion_id: data.promotion_id === "none" ? null : data.promotion_id
            };

            // Clean up UI-only fields if needed
            delete payload.patient_name;

            return base44.entities.Appointment.create(payload);
        },
        onSuccess: () => {
            toast.success("Agendamento criado com sucesso!");
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            onSuccess?.();
            onOpenChange(false);
        },
        onError: () => toast.error("Erro ao criar agendamento")
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => {
            const startDateTime = new Date(data.date);
            const [hours, minutes] = data.time.split(":");
            startDateTime.setHours(parseInt(hours), parseInt(minutes));

            const endDateTime = addMinutes(startDateTime, data.duration);

            const payload = {
                ...data,
                start_time: format(startDateTime, "HH:mm"),
                end_time: format(endDateTime, "HH:mm"),
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

    const handleSubmit = () => {
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
            patient_name: patient.full_name
        }));
        setStep(2);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{appointment ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
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
                                                <AvatarFallback>{patient.full_name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{patient.full_name}</p>
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
                                        <span className="text-sm font-medium flex-1">{selectedPatient.full_name}</span>
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

                            <div className="space-y-2">
                                <Label>Profissional *</Label>
                                <Select value={formData.professional_id} onValueChange={(v) => setFormData(p => ({ ...p, professional_id: v }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o profissional" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {professionals.map(prof => (
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
                                <Select value={formData.procedure_name} onValueChange={(v) => setFormData(p => ({ ...p, procedure_name: v }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Ou digite o nome do procedimento..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PROCEDURES_OPTIONS.map((group) => (
                                            <SelectGroup key={group.category}>
                                                <SelectLabel className="font-bold text-slate-900 bg-slate-50 px-2 py-1.5">{group.category}</SelectLabel>
                                                {group.items.map((item) => (
                                                    <SelectItem key={item} value={item.toUpperCase()} className="pl-6">
                                                        {item}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        ))}
                                        <SelectGroup>
                                            <SelectLabel className="font-bold text-slate-900 bg-slate-50 px-2 py-1.5">Outros</SelectLabel>
                                            <SelectItem value="outro" className="pl-6">Outro (Digitar)</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                {formData.procedure_name === "outro" && (
                                    <Input
                                        placeholder="Digite o nome do procedimento"
                                        onChange={(e) => setFormData(p => ({ ...p, procedure_name: e.target.value }))}
                                        className="mt-2"
                                    />
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Agendado por</Label>
                                <Select value={formData.scheduled_by} onValueChange={(v) => setFormData(p => ({ ...p, scheduled_by: v }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a secretária" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SECRETARIES_LIST.map(sec => (
                                            <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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

                            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                                    {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                    Confirmar
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
