// @ts-nocheck
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link, useOutletContext } from "react-router-dom";
import { cn, createPageUrl } from "@/lib/utils";
import { base44 } from "@/lib/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserPlus, Users, UserX, Loader2, SlidersHorizontal, X, Download, Upload, Trash2, MessageCircle, FileText, Calendar, Edit, Phone, Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, FileSpreadsheet } from "lucide-react";

import PatientForm from "@/components/patients/PatientForm";
import PatientCard from "@/components/patients/PatientCard";
import WhatsAppModal from "@/components/patients/WhatsAppModal";

export default function Patients() {
  const navigate = useNavigate();
  const { isDark } = useOutletContext<{ isDark: boolean }>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos"); // Changed default to "todos"
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [advancedSearch, setAdvancedSearch] = useState({
    cpf: "",
    dateFrom: "",
    dateTo: ""
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [user, setUser] = useState(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [deleteProgress, setDeleteProgress] = useState({ current: 0, total: 0 });
  const [selectedPatientForActions, setSelectedPatientForActions] = useState(null);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => { });
  }, []);

  const { data: patients = [], isLoading, isError, error } = useQuery({
    queryKey: ["patients"],
    queryFn: () => base44.entities.Patient.list("-created_date")
  });



  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => base44.entities.Appointment.list("-date")
  });

  if (isError) {
    console.error("Error fetching patients:", error);
    toast.error("Erro ao carregar pacientes. Verifique sua conexão.");
  }

  // ... mutations ... (omitted, assuming they are below this block)

  // (We need to keep the mutations code here, so I will target a smaller block or use multi_replace if context is tricky.
  // Actually, I can just replace the top part where state and queries are defined)

  // Wait, I replacing lines 23-140 is risky because it contains mutations I don't want to rewrite if I don't have to.
  // I will use replace_file_content for specific blocks.

  // Block 1: State and Query
  // Block 2: Filter logic
  // Block 3: Button handlers


  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => base44.entities.Patient.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Paciente excluído com sucesso!");
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: (string | number)[]) => {
      setDeleteProgress({ current: 0, total: ids.length });
      // Process in chunks of 50 for better performance
      const chunkSize = 50;
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        await Promise.all(chunk.map(id => base44.entities.Patient.delete(id)));
        setDeleteProgress(prev => ({ ...prev, current: Math.min(prev.current + chunkSize, ids.length) }));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setSelectedPatients([]);
      setShowBulkDelete(false);
      toast.success("Exclusão em massa concluída!");
    }
  });

  const filteredPatients = React.useMemo(() => {
    if (!Array.isArray(patients)) return [];

    return patients.filter(patient => {
      const nameForSearch = (patient.full_name || patient.name || "").toLowerCase();
      const matchesSearch = nameForSearch.includes(search.toLowerCase()) ||
        patient.phone?.includes(search) ||
        patient.email?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "todos" ||
        (patient.status && patient.status.toLowerCase() === statusFilter.toLowerCase());

      const matchesAdvanced = (!advancedSearch.cpf || patient.cpf?.includes(advancedSearch.cpf)) &&
        (!advancedSearch.dateFrom || new Date(patient.created_date) >= new Date(advancedSearch.dateFrom)) &&
        (!advancedSearch.dateTo || new Date(patient.created_date) <= new Date(advancedSearch.dateTo));

      return matchesSearch && matchesStatus && matchesAdvanced;
    });
  }, [patients, search, statusFilter, advancedSearch]);

  const handleEdit = (patient) => {
    setEditingPatient(patient);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingPatient(null);
    setIsFormOpen(true);
  };

  const toggleSelectPatient = (id) => {
    setSelectedPatients(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (confirm(`Tem certeza que deseja excluir ${selectedPatients.length} pacientes permanentemente?`)) {
      bulkDeleteMutation.mutate(selectedPatients);
    }
  };

  return (
    <div className={cn("p-6 lg:p-10 max-w-[1600px] mx-auto space-y-8 min-h-screen")}>
      {/* Premium Header */}
      <div className={cn(
        "relative overflow-hidden rounded-3xl p-8 border transition-all duration-300",
        isDark
          ? "bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border-slate-800"
          : "bg-gradient-to-br from-white via-indigo-50/50 to-purple-50/30 border-slate-200"
      )}>
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className={cn("text-4xl font-display font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>
              Pacientes
            </h1>
            <p className={cn("text-lg max-w-2xl", isDark ? "text-slate-400" : "text-slate-600")}>
              Gerencie sua base de pacientes com inteligência e praticidade.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className={cn(
                  "border-dashed backdrop-blur-sm transition-all",
                  isDark
                    ? "border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white"
                    : "border-slate-300 bg-white/50 text-slate-600 hover:bg-white hover:text-slate-900"
                )}>
                  <MoreHorizontal className="w-4 h-4 mr-2" />
                  Ações
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={cn("w-56", isDark ? "bg-[#1C2333] border-slate-700 text-slate-200" : "")}>
                <DropdownMenuItem onClick={() => navigate(createPageUrl("ImportPatients"))} className="gap-2 cursor-pointer">
                  <Upload className="w-4 h-4 text-slate-500" />
                  Importar Excel
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    // ... export logic
                  }}
                  className="gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  Exportar CSV
                </DropdownMenuItem>
                <>
                  <DropdownMenuSeparator className={isDark ? "bg-slate-700" : ""} />
                  <DropdownMenuItem
                    onClick={() => setShowBulkDelete(!showBulkDelete)}
                    className="gap-2 text-rose-500 focus:text-rose-600 focus:bg-rose-50/10 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    {showBulkDelete ? "Sair da Seleção" : "Gerenciar Exclusão"}
                  </DropdownMenuItem>
                </>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={handleAddNew}
              className={cn(
                "shadow-lg transition-all hover:scale-105 active:scale-95",
                isDark
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20"
                  : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-300"
              )}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Novo Paciente
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className={cn(
        "sticky top-20 z-30 p-4 rounded-2xl border backdrop-blur-xl shadow-sm transition-all",
        isDark
          ? "bg-slate-900/80 border-slate-800 shadow-black/20"
          : "bg-white/80 border-slate-200 shadow-slate-200/50"
      )}>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-3 flex-1 w-full md:max-w-2xl">
            <div className="relative flex-1 group">
              <Search className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                isDark ? "text-slate-500 group-focus-within:text-indigo-400" : "text-slate-400 group-focus-within:text-indigo-600"
              )} />
              <Input
                placeholder="Buscar por nome, CPF, telefone..."
                className={cn(
                  "pl-10 transition-all",
                  isDark
                    ? "bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:bg-slate-800 focus:border-indigo-500/50"
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500/50"
                )}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <Popover open={showAdvanced} onOpenChange={setShowAdvanced}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn(
                  "px-3",
                  showAdvanced && (isDark ? "bg-slate-800 text-indigo-400 border-indigo-500/50" : "bg-indigo-50 text-indigo-700 border-indigo-200"),
                  isDark ? "border-slate-700 hover:bg-slate-800 text-slate-300" : "border-slate-200 hover:bg-slate-50 text-slate-600"
                )}>
                  <SlidersHorizontal className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className={cn("w-80 p-5 space-y-4", isDark ? "bg-[#1C2333] border-slate-700" : "")} align="start">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className={isDark ? "text-slate-300" : ""}>CPF</Label>
                    <Input
                      placeholder="000.000.000-00"
                      value={advancedSearch.cpf}
                      onChange={e => setAdvancedSearch(prev => ({ ...prev, cpf: e.target.value }))}
                      className={isDark ? "bg-slate-900 border-slate-700" : ""}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className={isDark ? "text-slate-300" : ""}>Desde</Label>
                      <Input
                        type="date"
                        value={advancedSearch.dateFrom}
                        onChange={e => setAdvancedSearch(prev => ({ ...prev, dateFrom: e.target.value }))}
                        className={isDark ? "bg-slate-900 border-slate-700" : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={isDark ? "text-slate-300" : ""}>Até</Label>
                      <Input
                        type="date"
                        value={advancedSearch.dateTo}
                        onChange={e => setAdvancedSearch(prev => ({ ...prev, dateTo: e.target.value }))}
                        className={isDark ? "bg-slate-900 border-slate-700" : ""}
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                    onClick={() => setAdvancedSearch({ cpf: "", dateFrom: "", dateTo: "" })}
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
            <TabsList className={cn("w-full md:w-auto p-1", isDark ? "bg-slate-800" : "bg-slate-100")}>
              {["Todos", "Ativo", "Inativo"].map((tab) => (
                <TabsTrigger
                  key={tab.toLowerCase()}
                  value={tab.toLowerCase()}
                  className={cn(
                    "flex-1 md:flex-none capitalize",
                    isDark
                      ? "data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400"
                      : "data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  )}
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Bulk Action Bar */}
        {showBulkDelete && (
          <div className={cn(
            "mt-4 pt-4 border-t flex items-center justify-between animate-slide-down",
            isDark ? "border-slate-800" : "border-slate-100"
          )}>
            <div className="flex items-center gap-3">
              <span className={cn("text-sm font-medium", isDark ? "text-slate-400" : "text-slate-600")}>
                {selectedPatients.length} selecionado(s)
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPatients(filteredPatients.map(p => p.id))}
                className="text-xs text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
              >
                Selecionar Todos ({filteredPatients.length})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPatients([])}
                className="text-xs text-slate-500"
              >
                Limpar
              </Button>
            </div>
            {selectedPatients.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                className="shadow-lg shadow-rose-500/20"
              >
                {bulkDeleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Excluir Selecionados
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* List View */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-50">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
            <p className={isDark ? "text-slate-400" : "text-slate-500"}>Carregando pacientes...</p>
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-rose-500">
            <UserX className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Erro ao carregar dados.</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className={cn(
            "flex flex-col items-center justify-center py-32 rounded-3xl border-2 border-dashed",
            isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50/50"
          )}>
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-xl",
              isDark ? "bg-slate-800 shadow-black/20" : "bg-white shadow-slate-200"
            )}>
              <Users className={cn("w-10 h-10", isDark ? "text-slate-600" : "text-slate-300")} />
            </div>
            <h3 className={cn("text-xl font-bold mb-2", isDark ? "text-white" : "text-slate-900")}>
              Nenhum paciente encontrado
            </h3>
            <p className={cn("text-slate-500", isDark ? "text-slate-400" : "")}>
              Tente ajustar seus filtros de busca.
            </p>
          </div>
        ) : (
          filteredPatients.map(patient => {
            const lastAppt = appointments.find(a => a.patient_id === patient.id);

            return (
              <div
                key={patient.id}
                className={cn(
                  "group relative flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer",
                  isDark
                    ? "bg-slate-900/50 border-slate-800 hover:bg-slate-800/50"
                    : "bg-white border-slate-100 hover:border-slate-200 shadow-sm"
                )}
                onClick={() => {
                  if (!showBulkDelete) {
                    setSelectedPatientForActions(patient);
                  }
                }}
              >
                {showBulkDelete && (
                  <div className="mr-2" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedPatients.includes(patient.id)}
                      onCheckedChange={() => toggleSelectPatient(patient.id)}
                      className={cn(
                        "w-5 h-5 border-2 transition-all data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600",
                        isDark ? "bg-slate-900 border-slate-600" : "bg-white border-slate-300"
                      )}
                    />
                  </div>
                )}

                {/* Avatar */}
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm ring-2 ring-slate-100 dark:ring-slate-800">
                  <AvatarImage src={patient.avatar_url} />
                  <AvatarFallback className={cn("font-bold", isDark ? "bg-indigo-900 text-indigo-200" : "bg-blue-600 text-white")}>
                    {patient.full_name?.substring(0, 2).toUpperCase() || "PA"}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-4">
                    <h3 className={cn("font-bold text-lg leading-tight", isDark ? "text-slate-100" : "text-slate-800")}>
                      {patient.full_name || "Sem Nome"}
                    </h3>
                    {patient.cpf && (
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{patient.cpf}</p>
                    )}
                  </div>

                  <div className="md:col-span-3 flex items-center gap-2 text-sm text-slate-500">
                    <Phone className="w-4 h-4 opacity-70" />
                    <span>{patient.phone || "Sem telefone"}</span>
                  </div>

                  <div className="md:col-span-3 flex items-center gap-2 text-sm text-slate-500">
                    <Clock className="w-4 h-4 opacity-70" />
                    <span>
                      {lastAppt
                        ? `Última: ${format(parseISO(lastAppt.date), "dd/MM/yyyy")}`
                        : "Sem consultas"}
                    </span>
                  </div>

                  <div className="md:col-span-2 flex justify-end">
                    <Badge variant="secondary" className={cn(
                      "capitalize px-3 py-1",
                      (patient.status === 'ativo' || !patient.status) ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    )}>
                      {patient.status || "Ativo"}
                    </Badge>
                  </div>
                </div>


              </div>
            );
          })
        )}
      </div>

      {/* Quick Actions Sheet (Side Drawer) */}
      <Sheet open={!!selectedPatientForActions} onOpenChange={(open) => !open && setSelectedPatientForActions(null)}>
        <SheetContent className="sm:max-w-md p-0 overflow-hidden border-l border-slate-200 dark:border-slate-800">
          {selectedPatientForActions && (
            <div className="h-full flex flex-col bg-white dark:bg-slate-950">
              {/* Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-16 w-16 border-4 border-white dark:border-slate-900 shadow-md">
                    <AvatarImage src={selectedPatientForActions.avatar_url} />
                    <AvatarFallback className="text-xl font-bold bg-blue-600 text-white">
                      {selectedPatientForActions.full_name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                      {selectedPatientForActions.full_name}
                    </h2>
                    <Badge variant="secondary" className="mt-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {selectedPatientForActions.status || "Ativo"}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4" />
                    <span>{selectedPatientForActions.phone || "Não informado"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4" />
                    <span>
                      {appointments.find(a => a.patient_id === selectedPatientForActions.id)
                        ? `Última consulta: ${format(parseISO(appointments.find(a => a.patient_id === selectedPatientForActions.id).date), "dd/MM/yyyy", { locale: ptBR })}`
                        : "Nenhuma consulta registrada"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions List */}
              <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                <Button
                  variant="outline"
                  className="w-full justify-start h-14 text-base font-medium border-slate-200 dark:border-slate-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/20 dark:hover:text-emerald-400 hover:border-emerald-200 transition-all group"
                  onClick={() => {
                    if (selectedPatientForActions.phone) {
                      setWhatsAppModalOpen(true);
                    } else {
                      toast.error("Telefone não cadastrado");
                    }
                  }}
                >
                  <MessageCircle className="w-5 h-5 mr-3 text-emerald-500 group-hover:scale-110 transition-transform" />
                  WhatsApp
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-14 text-base font-medium border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
                  onClick={() => {
                    navigate(`/PatientHistory?id=${selectedPatientForActions.id}`);
                  }}
                >
                  <FileText className="w-5 h-5 mr-3 text-slate-500 group-hover:text-blue-500 transition-colors" />
                  Histórico de procedimentos
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-14 text-base font-medium border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
                  onClick={() => {
                    navigate(`/agenda?newAppointment=true&patientId=${selectedPatientForActions.id}`);
                  }}
                >
                  <Calendar className="w-5 h-5 mr-3 text-slate-500 group-hover:text-blue-500 transition-colors" />
                  Agendar consulta
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-14 text-base font-medium border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
                  onClick={() => {
                    setSelectedPatientForActions(null);
                    handleEdit(selectedPatientForActions);
                  }}
                >
                  <Edit className="w-5 h-5 mr-3 text-slate-500 group-hover:text-blue-500 transition-colors" />
                  Editar cadastro
                </Button>

                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-14 text-base font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/20 dark:text-rose-500 transition-all group"
                    onClick={() => {
                      if (confirm(`Deseja excluir ${selectedPatientForActions.full_name} permanentemente?`)) {
                        deleteMutation.mutate(selectedPatientForActions.id);
                        setSelectedPatientForActions(null);
                      }
                    }}
                  >
                    <Trash2 className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
                    Excluir paciente
                  </Button>
                </div>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 mt-auto border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-xs text-slate-400">
                  ID: {selectedPatientForActions.id} • Criado em {format(parseISO(selectedPatientForActions.created_date || new Date().toISOString()), "dd/MMM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* WhatsApp Modal */}
      <WhatsAppModal
        patient={selectedPatientForActions}
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
      />

      {/* Patient Form Sheet */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>{editingPatient ? "Editar Paciente" : "Novo Paciente"}</SheetTitle>
            <SheetDescription className="sr-only">Formulário para cadastro e edição de pacientes.</SheetDescription>
          </SheetHeader>
          <PatientForm
            patient={editingPatient}
            onSuccess={() => {
              setIsFormOpen(false);
              queryClient.invalidateQueries({ queryKey: ["patients"] });
            }}
            onCancel={() => setIsFormOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div >
  );
}

