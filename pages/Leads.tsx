import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
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
import { Link } from "react-router-dom";
import { createPageUrl } from "@/lib/utils";

export default function Leads() {
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
    novo: { label: "Novo", color: "bg-blue-100 text-blue-700", icon: Clock },
    contatado: { label: "Contatado", color: "bg-yellow-100 text-yellow-700", icon: Phone },
    qualificado: { label: "Qualificado", color: "bg-purple-100 text-purple-700", icon: TrendingUp },
    convertido: { label: "Convertido", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
    perdido: { label: "Perdido", color: "bg-red-100 text-red-700", icon: XCircle }
  };

  const sourceConfig = {
    meta_ads: { label: "Meta Ads", color: "bg-indigo-100 text-indigo-700" },
    instagram: { label: "Instagram", color: "bg-pink-100 text-pink-700" },
    facebook: { label: "Facebook", color: "bg-blue-100 text-blue-700" },
    google: { label: "Google", color: "bg-red-100 text-red-700" },
    site: { label: "Site", color: "bg-slate-100 text-slate-700" },
    indicacao: { label: "Indicação", color: "bg-green-100 text-green-700" },
    whatsapp: { label: "WhatsApp", color: "bg-emerald-100 text-emerald-700" },
    outro: { label: "Outro", color: "bg-gray-100 text-gray-700" }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-800">Gestão de Leads</h1>
            <p className="text-slate-500">Gerencie e converta seus leads em pacientes</p>
          </div>
          <Link to={createPageUrl("ClinicSettings")}>
            <Button variant="outline">
              Configurar Integrações
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total de Leads</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Novos</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.novos}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Convertidos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.convertidos}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Taxa Conversão</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.total > 0 ? Math.round((stats.convertidos / stats.total) * 100) : 0}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nome, telefone ou email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="contatado">Contatado</SelectItem>
                  <SelectItem value="qualificado">Qualificado</SelectItem>
                  <SelectItem value="convertido">Convertido</SelectItem>
                  <SelectItem value="perdido">Perdido</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Origem" />
                </SelectTrigger>
                <SelectContent>
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
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Nenhum lead encontrado</p>
              </CardContent>
            </Card>
          ) : (
            filteredLeads.map(lead => {
              const StatusIcon = statusConfig[lead.status]?.icon || Clock;
              return (
                <Card key={lead.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {lead.full_name?.charAt(0) || "?"}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-800">{lead.full_name}</h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <Badge className={statusConfig[lead.status]?.color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig[lead.status]?.label}
                              </Badge>
                              <Badge className={sourceConfig[lead.source]?.color}>
                                {sourceConfig[lead.source]?.label}
                              </Badge>
                              {lead.campaign_name && (
                                <Badge variant="outline" className="text-xs">
                                  {lead.campaign_name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-slate-600 ml-13">
                          {lead.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-slate-400" />
                              {lead.phone}
                            </div>
                          )}
                          {lead.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-slate-400" />
                              {lead.email}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {format(new Date(lead.created_date), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        </div>

                        {lead.interest && (
                          <p className="text-sm text-slate-600 mt-2 ml-13">
                            <strong>Interesse:</strong> {lead.interest}
                          </p>
                        )}

                        {lead.notes && (
                          <p className="text-sm text-slate-500 mt-2 ml-13 line-clamp-2">{lead.notes}</p>
                        )}
                      </div>

                      <div className="flex md:flex-col gap-2">
                        <Select
                          value={lead.status}
                          onValueChange={(newStatus) =>
                            updateLeadMutation.mutate({ id: lead.id, data: { status: newStatus } })
                          }
                        >
                          <SelectTrigger className="w-full md:w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Converter Lead em Paciente</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja converter {selectedLead?.full_name} em paciente?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-2">
                <strong>Nome:</strong> {selectedLead?.full_name}
              </p>
              {selectedLead?.phone && (
                <p className="text-sm text-slate-600 mb-2">
                  <strong>Telefone:</strong> {selectedLead?.phone}
                </p>
              )}
              {selectedLead?.email && (
                <p className="text-sm text-slate-600">
                  <strong>Email:</strong> {selectedLead?.email}
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setConvertDialogOpen(false)}>
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
