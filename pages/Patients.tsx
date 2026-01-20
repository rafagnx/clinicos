import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { cn, createPageUrl } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserPlus, Users, UserX, Loader2, SlidersHorizontal, X, Download, Upload, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

import PatientForm from "@/components/patients/PatientForm";
import PatientCard from "@/components/patients/PatientCard";

export default function Patients() {
  const navigate = useNavigate();
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
    mutationFn: (id) => base44.entities.Patient.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Paciente excluído com sucesso!");
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
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
      const matchesSearch = patient.full_name?.toLowerCase().includes(search.toLowerCase()) ||
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
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pacientes</h1>
          <p className="text-slate-500">Gerencie o cadastro e histórico dos seus pacientes</p>
        </div>
        import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator} from "@/components/ui/dropdown-menu";
        import {MoreHorizontal, FileSpreadsheet} from "lucide-react";

        // ... inside the component, replacing the header action buttons ...

        <div className="flex flex-wrap gap-2">
          {/* Secondary Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-white hover:bg-slate-50">
                <MoreHorizontal className="w-4 h-4 mr-2 text-slate-500" />
                Mais Ações
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate(createPageUrl("ImportPatients"))} className="gap-2 cursor-pointer">
                <Upload className="w-4 h-4 text-slate-500" />
                Importar Excel
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  try {
                    if (!patients.length) {
                      toast.error("Não há pacientes para exportar.");
                      return;
                    }
                    const headers = ["ID", "Nome Completo", "Email", "Telefone", "CPF", "Status", "Data Cadastro"];
                    const csvContent = [
                      headers.join(","),
                      ...patients.map(p => {
                        return [
                          p.id,
                          `"${p.full_name || ''}"`,
                          p.email || '',
                          p.phone || '',
                          p.cpf || '',
                          p.status || '',
                          p.created_date || ''
                        ].join(",");
                      })
                    ].join("\n");
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.setAttribute("href", url);
                    link.setAttribute("download", `pacientes_export_${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success("Exportação concluída!");
                  } catch (err) {
                    console.error(err);
                    toast.error("Erro ao exportar.");
                  }
                }}
                className="gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-500" />
                Exportar CSV
              </DropdownMenuItem>
              {user?.role === "admin" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowBulkDelete(!showBulkDelete)}
                    className="gap-2 text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    {showBulkDelete ? "Sair da Seleção" : "Excluir Múltiplos"}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 shadow-sm transition-all hover:scale-105">
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Paciente
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <Card className="p-4 space-y-4 border-slate-200/60 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 flex-1 w-full md:max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome, telefone ou e-mail..."
                className="pl-10 bg-white border-slate-200"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Popover open={showAdvanced} onOpenChange={setShowAdvanced}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={showAdvanced ? "bg-slate-100" : ""}>
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Busca Avançada
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 space-y-4" align="start">
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input
                    placeholder="000.000.000-00"
                    value={advancedSearch.cpf}
                    onChange={e => setAdvancedSearch(prev => ({ ...prev, cpf: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Desde</Label>
                    <Input
                      type="date"
                      value={advancedSearch.dateFrom}
                      onChange={e => setAdvancedSearch(prev => ({ ...prev, dateFrom: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Até</Label>
                    <Input
                      type="date"
                      value={advancedSearch.dateTo}
                      onChange={e => setAdvancedSearch(prev => ({ ...prev, dateTo: e.target.value }))}
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  onClick={() => setAdvancedSearch({ cpf: "", dateFrom: "", dateTo: "" })}
                >
                  Limpar Filtros
                </Button>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2">
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="bg-transparent">
              <TabsList className="bg-transparent p-0 gap-2 h-auto">
                <TabsTrigger
                  value="todos"
                  className="bg-transparent border border-slate-200 text-slate-600 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 rounded-md h-9 px-4"
                >
                  Todos ({patients.length})
                </TabsTrigger>
                <TabsTrigger
                  value="ativo"
                  className="bg-trasparent border border-emerald-100 text-emerald-600 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 rounded-md h-9 px-4"
                >
                  Ativos ({patients.filter(p => p.status === 'ativo').length})
                </TabsTrigger>
                <TabsTrigger
                  value="inativo"
                  className="bg-transparent border border-slate-200 text-slate-500 data-[state=active]:bg-slate-50 data-[state=active]:text-slate-700 rounded-md h-9 px-4"
                >
                  Inativos ({patients.filter(p => p.status === 'inativo').length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {user?.role === "admin" && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bulk-mode"
                  checked={showBulkDelete}
                  onCheckedChange={setShowBulkDelete}
                />
                <label htmlFor="bulk-mode" className="text-sm font-medium text-slate-600 cursor-pointer">
                  Modo de Seleção
                </label>
              </div>
              {showBulkDelete && selectedPatients.length > 0 && (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                  {selectedPatients.length} selecionados
                </Badge>
              )}
            </div>
            {showBulkDelete && selectedPatients.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Excluindo ({deleteProgress.current}/{deleteProgress.total})
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Selecionados
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p>Carregando pacientes...</p>
          </div>
        ) : isError ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-rose-500">
            <UserX className="w-10 h-10 mb-4" />
            <p>Erro ao carregar pacientes. Verifique o console.</p>
            <p className="text-xs text-slate-400 mt-2">{error?.message}</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Users className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">Nenhum paciente encontrado</h3>
            <p className="text-slate-500 max-w-xs mx-auto mt-1">
              Tente ajustar seus filtros ou busque por outro termo.
            </p>
          </div>
        ) : (
          filteredPatients.map(patient => (
            <div key={patient.id} className="relative group">
              {showBulkDelete && (
                <div className="absolute top-4 left-4 z-10">
                  <Checkbox
                    checked={selectedPatients.includes(patient.id)}
                    onCheckedChange={() => toggleSelectPatient(patient.id)}
                    className="w-5 h-5 bg-white shadow-sm"
                  />
                </div>
              )}
              <PatientCard
                patient={patient}
                lastAppointment={appointments.find(a => a.patient_id === patient.id)}
                onEdit={() => handleEdit(patient)}
                onDelete={() => {
                  if (confirm(`Deseja excluir ${patient.full_name} permanentemente?`)) {
                    deleteMutation.mutate(patient.id);
                  }
                }}
                isAdmin={user?.role === "admin"}
              />
            </div>
          ))
        )}
      </div>

      {/* Patient Form Sheet */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>{editingPatient ? "Editar Paciente" : "Novo Paciente"}</SheetTitle>
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
    </div>
  );
}
