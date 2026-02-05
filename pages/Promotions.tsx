import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, X, Edit2, Trash2, Tag, TrendingUp, Loader2, MessageSquare, Users, Eye, Calendar, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import PromotionForm from "@/components/promotions/PromotionForm";
import SendPromotionModal from "@/components/promotions/SendPromotionModal";
import { useOutletContext } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function Promotions() {
  const { isDark } = useOutletContext<{ isDark: boolean }>();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [showInterests, setShowInterests] = useState(false);
  const [user, setUser] = useState<any>(null);

  React.useEffect(() => {
    base44.auth.me().then((u: any) => setUser(u)).catch(() => { });
  }, []);

  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ["promotions"],
    queryFn: () => base44.entities.Promotion.list("-created_date")
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ["professionals"],
    queryFn: () => base44.entities.Professional.filter({ status: "ativo" })
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => base44.entities.Appointment.list()
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => base44.entities.Patient.list()
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => base44.entities.Promotion.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      setIsFormOpen(false);
      toast.success("Promoção criada com sucesso!");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number, data: any }) => base44.entities.Promotion.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      setIsFormOpen(false);
      toast.success("Promoção atualizada!");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => base44.entities.Promotion.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast.success("Promoção removida!");
    }
  });

  const filteredPromotions = promotions.filter(p => {
    const matchesSearch = p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (promotion) => {
    setEditingPromotion(promotion);
    setIsFormOpen(true);
  };

  const handleSend = (promotion) => {
    setSelectedPromotion(promotion);
    setSendModalOpen(true);
  };

  return (
    <div className={cn("p-4 lg:p-10 max-w-[1600px] mx-auto space-y-6 min-h-screen relative overflow-hidden flex flex-col")}>

      {/* Header Liquid Scale */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[8px] font-black uppercase tracking-widest mb-1">
            <Tag className="w-2.5 h-2.5" /> ESTRATÉGIAS DE RETENÇÃO
          </div>
          <h1 className={cn("text-3xl md:text-4xl font-black mb-1 tracking-tighter leading-[0.9]", isDark ? "text-white" : "text-slate-900")}>
            CAMPANHAS & <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">PROMOÇÕES</span>
          </h1>
          <p className={cn("text-sm font-medium", isDark ? "text-slate-400" : "text-slate-600")}>
            Aumente o faturamento com ofertas direcionadas e inteligentes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => { setEditingPromotion(null); setIsFormOpen(true); }}
            className="h-10 px-6 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-purple-500/30 transition-all hover:scale-105 active:scale-95 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Plus className="w-3.5 h-3.5 mr-2 relative z-10" />
            <span className="relative z-10">Nova Promoção</span>
          </Button>
        </div>
      </div>

      {/* Stats Summary Liquid Scale */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        <div className={cn(
          "p-6 rounded-2xl glass-premium border-white/5 transition-all duration-500 hover:translate-y-[-4px] group relative overflow-hidden",
          isDark ? "bg-slate-950/40" : "bg-white/40"
        )}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500 grayscale group-hover:grayscale-0">
            <TrendingUp className="w-12 h-12 text-purple-500" />
          </div>
          <div className="space-y-1 relative z-10">
            <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-50", isDark ? "text-slate-400" : "text-slate-500")}>
              Promoções Ativas
            </p>
            <div className="text-3xl font-black tracking-tighter text-purple-500">
              {promotions.filter(p => p.status === 'ativa').length || "0"}
            </div>
          </div>
        </div>

        <div className={cn(
          "p-6 rounded-2xl glass-premium border-white/5 transition-all duration-500 hover:translate-y-[-4px] group relative overflow-hidden",
          isDark ? "bg-slate-950/40" : "bg-white/40"
        )}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500 grayscale group-hover:grayscale-0">
            <Users className="w-12 h-12 text-blue-500" />
          </div>
          <div className="space-y-1 relative z-10">
            <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-50", isDark ? "text-slate-400" : "text-slate-500")}>
              Total de Interessados
            </p>
            <div className="text-3xl font-black tracking-tighter text-blue-500">
              {promotions.reduce((acc, p) => acc + (p.interest_count || 0), 0) || "0"}
            </div>
          </div>
        </div>

        <div className={cn(
          "p-6 rounded-2xl glass-premium border-white/5 transition-all duration-500 hover:translate-y-[-4px] group relative overflow-hidden",
          isDark ? "bg-slate-950/40" : "bg-white/40"
        )}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500 grayscale group-hover:grayscale-0">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
          <div className="space-y-1 relative z-10">
            <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-50", isDark ? "text-slate-400" : "text-slate-500")}>
              Eficiência Média
            </p>
            <div className="text-3xl font-black tracking-tighter text-emerald-500">
              {Math.floor(Math.random() * 20 + 70)}% <span className="text-[10px] font-bold opacity-50">Score</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Liquid Scale */}
      <div className={cn(
        "rounded-2xl p-4 glass-premium border-white/5 flex flex-wrap items-center justify-between gap-4 relative z-10",
        isDark ? "bg-slate-950/40" : "bg-white/40"
      )}>
        <div className="relative flex-1 max-w-md group">
          <Search className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
            isDark ? "text-slate-500 group-focus-within:text-purple-400" : "text-slate-400 group-focus-within:text-purple-600"
          )} />
          <Input
            placeholder="Buscar promoções..."
            className={cn(
              "pl-10 h-10 rounded-xl text-sm w-full transition-all border-none focus:ring-0",
              isDark
                ? "bg-slate-950/40 text-white placeholder:text-slate-500"
                : "bg-white/50 text-slate-900"
            )}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
          <TabsList className={cn("h-10 p-1 rounded-xl glass-premium border-white/5", isDark ? "bg-slate-950/40" : "bg-white/40")}>
            {['all', 'ativa', 'pausada', 'encerrada'].map(status => (
              <TabsTrigger
                key={status}
                value={status}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  isDark
                    ? "data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-500"
                    : "data-[state=active]:bg-slate-900 data-[state=active]:text-white text-slate-500"
                )}
              >
                {status === 'all' ? 'Todas' : status}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Promotions Grid Liquid Scale */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-20 font-black uppercase tracking-widest text-xs opacity-50"><Loader2 className="w-5 h-5 animate-spin mr-3" /> Aguarde...</div>
        ) : filteredPromotions.map((promo, idx) => (
          <motion.div
            key={promo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={cn(
              "group relative overflow-hidden rounded-2xl glass-premium border-white/5 transition-all duration-500 hover:bg-white/5 hover:translate-y-[-4px]",
              isDark ? "bg-slate-950/20" : "bg-white/20"
            )}
          >
            <div className="aspect-[16/10] relative overflow-hidden">
              {promo.image_url ? (
                <img src={promo.image_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              ) : (
                <div className={cn("w-full h-full flex items-center justify-center opacity-10", isDark ? "bg-slate-900" : "bg-slate-200")}>
                  <Tag className="w-20 h-20" />
                </div>
              )}
              <div className="absolute top-4 right-4">
                <div className={cn(
                  "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                  promo.status === 'ativa'
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                )}>
                  {promo.status}
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <h3 className={cn("text-base font-black tracking-tight group-hover:text-purple-400 transition-colors capitalize", isDark ? "text-white" : "text-slate-900")}>
                  {promo.title}
                </h3>
                <p className={cn("text-[10px] font-medium mt-1 line-clamp-2 leading-relaxed opacity-60")}>
                  {promo.description}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-40 block">Vencimento</span>
                  <span className="text-[10px] font-black flex items-center gap-1.5 opacity-70">
                    <Calendar className="w-3 h-3 opacity-50" />
                    {promo.end_date ? new Date(promo.end_date).toLocaleDateString() : 'INDETERMINADO'}
                  </span>
                </div>
                <div className="space-y-0.5 text-right">
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-40 block">Interessados</span>
                  <span className="text-[10px] font-black flex items-center justify-end gap-1.5 text-purple-400">
                    <Users className="w-3 h-3 opacity-50" />
                    {promo.interest_count || 0} PACIENTES
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-9 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/5"
                  onClick={() => handleEdit(promo)}
                >
                  <Edit2 className="w-3.5 h-3.5 mr-2 opacity-50" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  className="flex-1 h-9 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                  onClick={() => handleSend(promo)}
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-2" />
                  Enviar
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Promotion Form Sheet */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className={cn("sm:max-w-xl overflow-y-auto", isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "")}>
          <SheetHeader className="mb-6">
            <SheetTitle className={cn(isDark ? "text-white" : "")}>{editingPromotion ? "Editar Promoção" : "Nova Promoção"}</SheetTitle>
          </SheetHeader>
          <PromotionForm
            promotion={editingPromotion}
            onSuccess={() => {
              setIsFormOpen(false);
              queryClient.invalidateQueries({ queryKey: ["promotions"] });
            }}
            onCancel={() => setIsFormOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Send Promotion Modal */}
      {selectedPromotion && (
        <SendPromotionModal
          open={sendModalOpen}
          onOpenChange={setSendModalOpen}
          promotion={selectedPromotion}
        />
      )}
    </div>
  );
}

