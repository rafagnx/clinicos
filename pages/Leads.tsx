// @ts-nocheck
import React, { useState } from "react";
import { base44 } from "@/lib/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Target, Search, Phone, Mail, Calendar,
  UserPlus, CheckCircle2, XCircle, Clock, Loader2,
  TrendingUp, Users
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Link, useOutletContext } from "react-router-dom";
import { createPageUrl, cn } from "@/lib/utils";

export default function Leads() {
  const { isDark } = useOutletContext<{ isDark: boolean }>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list("-created_date")
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => base44.entities.Patient.list()
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead atualizado!");
    }
  });

  const convertToPatientMutation = useMutation({
    mutationFn: async (lead) => {
      const patient = await base44.entities.Patient.create({
        full_name: lead.full_name,
        phone: lead.phone,
        email: lead.email,
        lead_source: lead.source,
        notes: lead.notes,
        status: "ativo"
      });

      await base44.entities.Lead.update(lead.id, {
        status: "convertido",
        converted_to_patient_id: patient.id,
        converted_date: new Date().toISOString().split('T')[0]
      });

      return patient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setConvertDialogOpen(false);
      setSelectedLead(null);
      toast.success("Lead convertido em paciente!");
    },
    onError: () => {
      toast.error("Erro ao converter lead");
    }
  });

  const statusConfig = {
    novo: { label: "Novo", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", icon: Clock },
    contatado: { label: "Contatado", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300", icon: Phone },
    qualificado: { label: "Qualificado", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300", icon: TrendingUp },
    convertido: { label: "Convertido", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300", icon: CheckCircle2 },
    perdido: { label: "Perdido", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300", icon: XCircle }
  };

  const sourceConfig = {
    meta_ads: { label: "Meta Ads", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
    instagram: { label: "Instagram", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300" },
    facebook: { label: "Facebook", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    google: { label: "Google", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
    site: { label: "Site", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
    indicacao: { label: "Indicação", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
    whatsapp: { label: "WhatsApp", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
    outro: { label: "Outro", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" }
  };

  const filteredLeads = leads.filter(lead => {
    const matchSearch = lead.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone?.includes(search) ||
      lead.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchSource = sourceFilter === "all" || lead.source === sourceFilter;
    return matchSearch && matchStatus && matchSource;
  });

  const stats = {
    total: leads.length,
    novos: leads.filter(l => l.status === "novo").length,
    convertidos: leads.filter(l => l.status === "convertido").length,
    perdidos: leads.filter(l => l.status === "perdido").length
  };

  return (
    <div className={cn("min-h-screen p-6 transition-colors duration-300", isDark ? "bg-slate-950" : "bg-gradient-to-br from-slate-50 to-slate-100")}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className={cn("text-3xl font-bold font-display", isDark ? "text-white" : "text-slate-800")}>Gestão de Leads</h1>
            <p className={cn(isDark ? "text-slate-400" : "text-slate-500")}>Gerencie e converta seus leads em pacientes</p>
          </div>
          <Link to={createPageUrl("ClinicSettings")}>
            <Button variant="outline" className={cn(isDark ? "bg-white/5 border-slate-700 text-slate-200 hover:bg-white/10 hover:text-white hover:border-slate-600 shadow-sm backdrop-blur-sm" : "bg-white hover:bg-slate-50")}>
              Configurar Integrações
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className={cn(isDark ? "bg-slate-900/50 border-slate-800 backdrop-blur-sm" : "bg-white border-slate-200")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>Total de Leads</p>
                  <p className={cn("text-2xl font-bold", isDark ? "text-white" : "text-slate-800")}>{stats.total}</p>
                </div>
                <Users className={cn("w-8 h-8", isDark ? "text-slate-600" : "text-slate-400")} />
              </div>
            </CardContent>
          </Card>

          <Card className={cn(isDark ? "bg-slate-900/50 border-slate-800 backdrop-blur-sm" : "bg-white border-slate-200")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>Novos</p>
                  <p className={cn("text-2xl font-bold", isDark ? "text-blue-400" : "text-blue-600")}>{stats.novos}</p>
                </div>
                <Clock className={cn("w-8 h-8", isDark ? "text-blue-500/50" : "text-blue-400")} />
              </div>
            </CardContent>
          </Card>

          <Card className={cn(isDark ? "bg-slate-900/50 border-slate-800 backdrop-blur-sm" : "bg-white border-slate-200")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>Convertidos</p>
                  <p className={cn("text-2xl font-bold", isDark ? "text-green-400" : "text-green-600")}>{stats.convertidos}</p>
                </div>
                <CheckCircle2 className={cn("w-8 h-8", isDark ? "text-green-500/50" : "text-green-400")} />
              </div>
            </CardContent>
          </Card>

          <Card className={cn(isDark ? "bg-slate-900/50 border-slate-800 backdrop-blur-sm" : "bg-white border-slate-200")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>Taxa Conversão</p>
                  <p className={cn("text-2xl font-bold", isDark ? "text-purple-400" : "text-purple-600")}>
                    {stats.total > 0 ? Math.round((stats.convertidos / stats.total) * 100) : 0}%
                  </p>
                </div>
                <TrendingUp className={cn("w-8 h-8", isDark ? "text-purple-500/50" : "text-purple-400")} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className={cn("mb-6 transition-all duration-300", isDark ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200")}>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isDark ? "text-slate-500" : "text-slate-400")} />
                <Input
                  placeholder="Buscar por nome, telefone ou email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={cn("pl-10", isDark ? "bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus:bg-slate-900" : "bg-white")}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={cn("w-full md:w-48", isDark ? "bg-slate-950/50 border-slate-800 text-slate-200" : "")}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className={cn(isDark ? "bg-slate-900 border-slate-800 text-slate-200" : "")}>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="contatado">Contatado</SelectItem>
                  <SelectItem value="qualificado">Qualificado</SelectItem>
                  <SelectItem value="convertido">Convertido</SelectItem>
                  <SelectItem value="perdido">Perdido</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className={cn("w-full md:w-48", isDark ? "bg-slate-950/50 border-slate-800 text-slate-200" : "")}>
                  <SelectValue placeholder="Origem" />
                </SelectTrigger>
                <SelectContent className={cn(isDark ? "bg-slate-900 border-slate-800 text-slate-200" : "")}>
                  <SelectItem value="all">Todas as Origens</SelectItem>
                  <SelectItem value="meta_ads">Meta Ads</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="site">Site</SelectItem>
                  <SelectItem value="indicacao">Indicação</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Leads List */}
        <div className="grid gap-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className={cn("w-8 h-8 animate-spin", isDark ? "text-indigo-400" : "text-blue-600")} />
            </div>
          ) : filteredLeads.length === 0 ? (
            <Card className={cn(isDark ? "bg-slate-900/50 border-slate-800" : "bg-white")}>
              <CardContent className="p-12 text-center">
                <Target className={cn("w-12 h-12 mx-auto mb-3", isDark ? "text-slate-700" : "text-slate-300")} />
                <p className={cn(isDark ? "text-slate-400" : "text-slate-500")}>Nenhum lead encontrado</p>
              </CardContent>
            </Card>
          ) : (
            filteredLeads.map(lead => {
              const StatusIcon = statusConfig[lead.status]?.icon || Clock;
              return (
                <Card key={lead.id} className={cn("hover:shadow-lg transition-all border", isDark ? "bg-slate-900/40 border-slate-800 hover:bg-slate-800/60" : "bg-white border-slate-200")}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold", isDark ? "bg-slate-800 text-indigo-400 border border-slate-700" : "bg-gradient-to-br from-indigo-500 to-purple-600")}>
                            {lead.full_name?.charAt(0) || "?"}
                          </div>
                          <div className="flex-1">
                            <h3 className={cn("font-semibold", isDark ? "text-slate-200" : "text-slate-800")}>{lead.full_name}</h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <Badge className={statusConfig[lead.status]?.color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig[lead.status]?.label}
                              </Badge>
                              <Badge className={sourceConfig[lead.source]?.color}>
                                {sourceConfig[lead.source]?.label}
                              </Badge>
                              {lead.campaign_name && (
                                <Badge variant="outline" className={cn("text-xs", isDark ? "border-slate-700 text-slate-400" : "")}>
                                  {lead.campaign_name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-2 text-sm ml-13", isDark ? "text-slate-400" : "text-slate-600")}>
                          {lead.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 opacity-70" />
                              {lead.phone}
                            </div>
                          )}
                          {lead.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 opacity-70" />
                              {lead.email}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 opacity-70" />
                            {format(new Date(lead.created_date), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        </div>

                        {lead.interest && (
                          <p className={cn("text-sm mt-2 ml-13", isDark ? "text-slate-400" : "text-slate-600")}>
                            <strong className={isDark ? "text-slate-300" : "text-slate-700"}>Interesse:</strong> {lead.interest}
                          </p>
                        )}

                        {lead.notes && (
                          <p className={cn("text-sm mt-2 ml-13 line-clamp-2", isDark ? "text-slate-500" : "text-slate-500")}>{lead.notes}</p>
                        )}
                      </div>

                      <div className="flex md:flex-col gap-2">
                        <Select
                          value={lead.status}
                          onValueChange={(newStatus) =>
                            updateLeadMutation.mutate({ id: lead.id, data: { status: newStatus } })
                          }
                        >
                          <SelectTrigger className={cn("w-full md:w-40", isDark ? "bg-slate-950/50 border-slate-700 text-slate-300" : "")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className={cn(isDark ? "bg-slate-900 border-slate-800 text-slate-200" : "")}>
                            <SelectItem value="novo">Novo</SelectItem>
                            <SelectItem value="contatado">Contatado</SelectItem>
                            <SelectItem value="qualificado">Qualificado</SelectItem>
                            <SelectItem value="perdido">Perdido</SelectItem>
                          </SelectContent>
                        </Select>

                        {lead.status !== "convertido" && (
                          <Button
                            onClick={() => {
                              setSelectedLead(lead);
                              setConvertDialogOpen(true);
                            }}
                            className="bg-green-600 hover:bg-green-700 w-full md:w-40"
                            size="sm"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Converter
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Convert Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent className={cn(isDark ? "bg-slate-900 border-slate-800 text-white" : "")}>
          <DialogHeader>
            <DialogTitle className={cn(isDark ? "text-white" : "")}>Converter Lead em Paciente</DialogTitle>
            <DialogDescription className={cn(isDark ? "text-slate-400" : "")}>
              Confirme os dados abaixo para converter {selectedLead?.full_name} em um registro de paciente permanente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className={cn("p-4 rounded-lg", isDark ? "bg-slate-950 border border-slate-800" : "bg-slate-50")}>
              <p className={cn("text-sm mb-2", isDark ? "text-slate-300" : "text-slate-600")}>
                <strong className={isDark ? "text-white" : ""}>Nome:</strong> {selectedLead?.full_name}
              </p>
              {selectedLead?.phone && (
                <p className={cn("text-sm mb-2", isDark ? "text-slate-300" : "text-slate-600")}>
                  <strong className={isDark ? "text-white" : ""}>Telefone:</strong> {selectedLead?.phone}
                </p>
              )}
              {selectedLead?.email && (
                <p className={cn("text-sm", isDark ? "text-slate-300" : "text-slate-600")}>
                  <strong className={isDark ? "text-white" : ""}>Email:</strong> {selectedLead?.email}
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setConvertDialogOpen(false)} className={cn(isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "")}>
                Cancelar
              </Button>
              <Button
                onClick={() => convertToPatientMutation.mutate(selectedLead)}
                className="bg-green-600 hover:bg-green-700"
                disabled={convertToPatientMutation.isPending}
              >
                {convertToPatientMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Convertendo...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Converter
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

