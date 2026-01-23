import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/lib/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
    mutationFn: (data) => base44.entities.Promotion.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      setIsFormOpen(false);
      toast.success("Promoção criada com sucesso!");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Promotion.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      setIsFormOpen(false);
      toast.success("Promoção atualizada!");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Promotion.delete(id),
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
    <div className={cn("min-h-screen p-4 lg:p-8 space-y-8 transition-colors duration-300", isDark ? "bg-slate-950" : "bg-slate-50/50")}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className={cn("text-2xl font-bold font-display", isDark ? "text-white" : "text-slate-900")}>Promoções & Campanhas</h1>
            <p className={cn(isDark ? "text-slate-400" : "text-slate-500")}>Crie e gerencie ofertas para seus pacientes</p>
          </div>
          <Button onClick={() => { setEditingPromotion(null); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
            <Plus className="w-4 h-4 mr-2" />
            Nova Promoção
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className={cn("p-6 border-none shadow-sm", isDark ? "bg-indigo-600 text-white" : "bg-blue-600 text-white")}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-sm font-medium", isDark ? "text-indigo-100" : "text-blue-100")}>Promoções Ativas</p>
                <h3 className="text-3xl font-bold mt-1">
                  {promotions.filter(p => p.status === 'ativa').length || "-"}
                </h3>
              </div>
              <div className="p-3 bg-white/10 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
            </div>
          </Card>
          <Card className={cn("p-6 border-none shadow-sm", isDark ? "bg-slate-900/50 border border-slate-800" : "bg-white")}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-sm font-medium", isDark ? "text-slate-400" : "text-slate-500")}>Total de Interessados</p>
                <h3 className={cn("text-3xl font-bold mt-1", isDark ? "text-white" : "text-slate-900")}>
                  {promotions.reduce((acc, p) => acc + (p.interest_count || 0), 0) || "-"}
                </h3>
              </div>
              <div className={cn("p-3 rounded-xl", isDark ? "bg-slate-800 text-blue-400" : "bg-slate-50 text-blue-600")}><Users className="w-6 h-6" /></div>
            </div>
          </Card>
          <Card className={cn("p-6 border-none shadow-sm", isDark ? "bg-slate-900/50 border border-slate-800" : "bg-white")}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-sm font-medium", isDark ? "text-slate-400" : "text-slate-500")}>Conversão Média</p>
                <h3 className={cn("text-3xl font-bold mt-1", isDark ? "text-white" : "text-slate-900")}>-</h3>
              </div>
              <div className={cn("p-3 rounded-xl", isDark ? "bg-slate-800 text-emerald-400" : "bg-slate-50 text-emerald-600")}><CheckCircle2 className="w-6 h-6" /></div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isDark ? "text-slate-500" : "text-slate-400")} />
            <Input
              placeholder="Buscar promoções..."
              className={cn("pl-10", isDark ? "bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-600 focus:bg-slate-900" : "bg-white border-slate-200")}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {['all', 'ativa', 'pausada', 'encerrada'].map(status => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className={cn("capitalize",
                  isDark && statusFilter !== status ? "border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200" : "",
                  isDark && statusFilter === status ? "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent" : ""
                )}
              >
                {status === 'all' ? 'Todas' : status}
              </Button>
            ))}
          </div>
        </div>

        {/* Promotions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-20"><Loader2 className={cn("w-10 h-10 animate-spin", isDark ? "text-indigo-500" : "text-slate-200")} /></div>
          ) : filteredPromotions.map((promo, idx) => (
            <motion.div
              key={promo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className={cn(
                "overflow-hidden hover:shadow-xl transition-all group",
                isDark ? "bg-slate-900/40 border-slate-800 hover:bg-slate-800/60" : "border-slate-200/60"
              )}>
                <div className={cn("aspect-video relative overflow-hidden", isDark ? "bg-slate-900" : "bg-slate-100")}>
                  {promo.image_url ? (
                    <img src={promo.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className={cn("w-full h-full flex items-center justify-center", isDark ? "text-slate-700" : "text-slate-300")}><Tag className="w-12 h-12" /></div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge variant={promo.status === 'ativa' ? 'default' : 'secondary'} className={promo.status === 'ativa' ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'}>
                      {promo.status}
                    </Badge>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <h3 className={cn("font-bold text-lg line-clamp-1", isDark ? "text-slate-200 group-hover:text-white" : "text-slate-900")}>{promo.title}</h3>
                    <p className={cn("text-sm line-clamp-2 mt-1", isDark ? "text-slate-400" : "text-slate-500")}>{promo.description}</p>
                  </div>

                  <div className={cn("flex items-center justify-between text-xs font-medium", isDark ? "text-slate-500" : "text-slate-400")}>
                    <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Expira em {promo.end_date ? new Date(promo.end_date).toLocaleDateString() : 'N/A'}</div>
                    <div className="flex items-center gap-1"><Users className="w-3 h-3" /> {promo.interest_count || 0} interessados</div>
                  </div>

                  <div className={cn("pt-4 border-t flex gap-2", isDark ? "border-slate-800" : "")}>
                    <Button variant="outline" size="sm" className={cn("flex-1", isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "")} onClick={() => handleEdit(promo)}>
                      <Edit2 className="w-3 h-3 mr-2" /> Editar
                    </Button>
                    <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => handleSend(promo)}>
                      <MessageSquare className="w-3 h-3 mr-2" /> Enviar
                    </Button>
                  </div>
                </div>
              </Card>
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
    </div>
  );
}

