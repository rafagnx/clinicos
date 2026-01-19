import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search, FileText, Calendar, User, Plus,
  Loader2, Eye, ChevronRight, Trash2
} from "lucide-react";

export default function MedicalRecords() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => { });
  }, []);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["medicalRecords"],
    queryFn: () => base44.entities.MedicalRecord.list("-date")
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => base44.entities.Patient.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MedicalRecord.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicalRecords"] });
      toast.success("Prontuário excluído!");
    }
  });

  const filteredRecords = records.filter(r =>
    r.patient_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Prontuários Eletrônicos</h1>
            <p className="text-slate-500">Gerencie o histórico clínico dos seus pacientes</p>
          </div>
          <Link to={createPageUrl("NewMedicalRecord")}>
            <Button className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" />
              Novo Prontuário
            </Button>
          </Link>
        </div>

        {/* Search and Filters */}
        <Card className="p-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome do paciente..."
              className="pl-10 h-12 bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </Card>

        {/* Records List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredRecords.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredRecords.map((record) => (
              <Card key={record.id} className="group hover:shadow-md transition-all border-slate-200 overflow-hidden">
                <div className="flex items-center p-4 sm:p-6 gap-4 sm:gap-6">
                  <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {record.patient_name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900 truncate">{record.patient_name}</h3>
                      <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">
                        ID: {record.id.substring(0, 8)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(record.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        Dr(a). {record.professional_name || "Não informado"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link to={createPageUrl("ViewMedicalRecord", { id: record.id })}>
                      <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => {
                        if (confirm("Tem certeza que deseja excluir este prontuário?")) {
                          deleteMutation.mutate(record.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Link to={createPageUrl("ViewMedicalRecord", { id: record.id })}>
                      <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
                        Ver Detalhes
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Preview of content */}
                <div className="px-6 pb-6 pt-0">
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <p className="text-sm text-slate-600 line-clamp-2 italic">
                      "{record.content || "Sem conteúdo registrado..."}"
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center border-dashed border-2">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Nenhum prontuário encontrado</h3>
            <p className="text-slate-500 mt-1 mb-6">Tente ajustar sua busca ou crie um novo registro.</p>
            <Link to={createPageUrl("NewMedicalRecord")}>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Prontuário
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
