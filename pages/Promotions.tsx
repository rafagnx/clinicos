import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
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

export default function Promotions() {
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
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Promoções & Campanhas</h1>
          <p className="text-slate-500">Crie e gerencie ofertas para seus pacientes</p>
        </div>
        <Button onClick={() => { setEditingPromotion(null); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Promoção
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-none shadow-sm bg-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Promoções Ativas</p>
              <h3 className="text-3xl font-bold mt-1">
                {promotions.filter(p => p.status === 'ativa').length || "-"}
              </h3>
            </div>
            <div className="p-3 bg-white/10 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
          </div>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Total de Interessados</p>
              <h3 className="text-3xl font-bold mt-1 text-slate-900">
                {promotions.reduce((acc, p) => acc + (p.interest_count || 0), 0) || "-"}
              </h3>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-blue-600"><Users className="w-6 h-6" /></div>
          </div>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Conversão Média</p>
              <h3 className="text-3xl font-bold mt-1 text-slate-900">-</h3>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-emerald-600"><CheckCircle2 className="w-6 h-6" /></div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar promoções..."
            className="pl-10 bg-white border-slate-200"
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
              className="capitalize"
            >
              {status === 'all' ? 'Todas' : status}
            </Button>
          ))}
        </div>
      </div>

      {/* Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-slate-200" /></div>
        ) : filteredPromotions.map((promo, idx) => (
          <motion.div
            key={promo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="overflow-hidden border-slate-200/60 hover:shadow-xl transition-all group">
              <div className="aspect-video relative overflow-hidden bg-slate-100">
                {promo.image_url ? (
                  <img src={promo.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300"><Tag className="w-12 h-12" /></div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge variant={promo.status === 'ativa' ? 'default' : 'secondary'} className={promo.status === 'ativa' ? 'bg-emerald-500' : 'bg-slate-500'}>
                    {promo.status}
                  </Badge>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{promo.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mt-1">{promo.description}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                  <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Expira em {promo.end_date ? new Date(promo.end_date).toLocaleDateString() : 'N/A'}</div>
                  <div className="flex items-center gap-1"><Users className="w-3 h-3" /> {promo.interest_count || 0} interessados</div>
                </div>

                <div className="pt-4 border-t flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(promo)}>
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
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>{editingPromotion ? "Editar Promoção" : "Nova Promoção"}</SheetTitle>
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
