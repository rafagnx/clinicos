import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
import { toast } from "sonner";
import { Link, useOutletContext } from "react-router-dom";
import { createPageUrl, cn } from "@/lib/utils";
import { motion } from "framer-motion";
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
  const { isDark } = useOutletContext<{ isDark: boolean }>();
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
    mutationFn: (id: string | number) => base44.entities.MedicalRecord.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicalRecords"] });
      toast.success("Prontuário excluído!");
    }
  });

  const filteredRecords = records.filter(r =>
    (r.patient_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={cn("p-4 lg:p-10 max-w-[1600px] mx-auto space-y-8 min-h-screen relative overflow-hidden flex flex-col")}>

      {/* Header Liquid Scale */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[8px] font-black uppercase tracking-widest mb-1">
            <FileText className="w-2.5 h-2.5" /> MEMÓRIA CLÍNICA
          </div>
          <h1 className={cn("text-3xl md:text-4xl font-black mb-1 tracking-tighter leading-[0.9]", isDark ? "text-white" : "text-slate-900")}>
            PRONTUÁRIOS <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">DIGITAIS</span>
          </h1>
          <p className={cn("text-sm font-medium", isDark ? "text-slate-400" : "text-slate-600")}>
            Acompanhe a jornada evolutiva de cada paciente com precisão.
          </p>
        </div>

        <Link to={createPageUrl("NewMedicalRecord")}>
          <Button
            className="h-10 px-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-purple-500/30 transition-all hover:scale-105 active:scale-95 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Plus className="w-3.5 h-3.5 mr-2 relative z-10" />
            <span className="relative z-10">Novo Prontuário</span>
          </Button>
        </Link>
      </div>

      {/* Filter / Search Bar Liquid Scale */}
      <div className={cn(
        "rounded-2xl p-4 glass-premium border-white/5 flex flex-wrap items-center gap-4 relative z-10",
        isDark ? "bg-slate-950/40" : "bg-white/40"
      )}>
        <div className="relative flex-1 group">
          <Search className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
            isDark ? "text-slate-500 group-focus-within:text-indigo-400" : "text-slate-400 group-focus-within:text-indigo-600"
          )} />
          <input
            type="text"
            placeholder="Buscar por paciente..."
            className={cn(
              "pl-10 pr-4 h-11 rounded-xl text-sm w-full border border-white/5 transition-all focus:outline-none",
              isDark
                ? "bg-slate-950/40 focus:bg-slate-900/60 focus:border-indigo-500/50 text-white placeholder:text-slate-500"
                : "bg-white/50 focus:bg-white focus:border-indigo-500/50 text-slate-900"
            )}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List / Grid Liquid Scale */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 opacity-50 relative z-10">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
          <p className={cn("text-[10px] font-black uppercase tracking-widest uppercase", isDark ? "text-slate-400" : "text-slate-500")}>Sincronizando registros...</p>
        </div>
      ) : filteredRecords.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 relative z-10">
          {filteredRecords.map((record, idx) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "group relative overflow-hidden rounded-2xl glass-premium border-white/5 transition-all duration-500 hover:bg-white/5",
                isDark ? "bg-slate-950/20" : "bg-white/20"
              )}
            >
              <div className="p-4 sm:p-6 flex flex-col md:flex-row md:items-center gap-6">
                <div className="relative">
                  <div className="p-1 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
                    <Avatar className="h-14 w-14 border-2 border-white dark:border-slate-950 shadow-2xl">
                      <AvatarImage src={patients.find(p => String(p.id) === String(record.patient_id))?.photo_url} />
                      <AvatarFallback className="text-white font-black text-lg bg-indigo-500">
                        {record.patient_name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-1 shadow-sm border border-slate-100 dark:border-slate-800">
                    <FileText className="w-3 h-3 text-indigo-500" />
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className={cn("font-black text-lg tracking-tight truncate leading-tight transition-colors group-hover:text-indigo-400", isDark ? "text-white" : "text-slate-900")}>
                      {record.patient_name}
                    </h3>
                    <div className={cn(
                      "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                      isDark ? "bg-slate-800 border-white/5 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-500"
                    )}>
                      ID: {String(record.id).substring(0, 8)}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      <span className={cn("text-[10px] font-black uppercase tracking-widest opacity-60")}>
                        {(() => {
                          const dateStr = String(record.date || "").split('T')[0];
                          const dateObj = new Date(dateStr + 'T12:00:00');
                          return isNaN(dateObj.getTime()) ? "Data inválida" : format(dateObj, "dd 'de' MMMM, yyyy", { locale: ptBR });
                        })()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-purple-500" />
                      <span className={cn("text-[10px] font-black uppercase tracking-widest opacity-60")}>
                        {record.professional_name || "NÃO INFORMADO"}
                      </span>
                    </div>
                  </div>

                  <div className={cn(
                    "p-3 rounded-xl border border-white/5 text-[11px] font-medium leading-relaxed line-clamp-2",
                    isDark ? "bg-slate-950/40 text-slate-400" : "bg-slate-50 text-slate-600"
                  )}>
                    {record.procedures_summary || "Ver detalhes do prontuário para mais informações."}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <Link to={createPageUrl("ViewMedicalRecord", { id: record.id })}>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-500 hover:bg-white/10 rounded-xl">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-rose-500 hover:bg-rose-500/10 rounded-xl"
                    onClick={() => {
                      if (confirm("Deseja realmente remover este registro?")) {
                        deleteMutation.mutate(record.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Link to={createPageUrl("ViewMedicalRecord", { id: record.id })}>
                    <Button className="h-10 pl-5 pr-4 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">
                      Acessar
                      <ChevronRight className="w-3.5 h-3.5 ml-2 opacity-50" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className={cn(
          "flex flex-col items-center justify-center py-32 rounded-3xl border-2 border-dashed relative z-10",
          isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50/50"
        )}>
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-xl",
            isDark ? "bg-slate-800 shadow-black/20" : "bg-white shadow-slate-200"
          )}>
            <FileText className={cn("w-10 h-10", isDark ? "text-slate-600" : "text-slate-300")} />
          </div>
          <h3 className={cn("text-xl font-black mb-2 tracking-tight", isDark ? "text-white" : "text-slate-900")}>
            Histórico Vazio
          </h3>
          <p className={cn("text-[10px] font-black uppercase tracking-widest mb-8 text-slate-500")}>
            Não encontramos nenhum prontuário cadastrado.
          </p>
          <Link to={createPageUrl("NewMedicalRecord")}>
            <Button className="h-10 px-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-500/20">
              Criar Primeiro Registro
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

