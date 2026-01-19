import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, Check, Upload, X } from "lucide-react";

interface PromotionFormProps {
    promotion?: any;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function PromotionForm({ promotion, onSuccess, onCancel }: PromotionFormProps) {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        status: "ativa",
        type: "desconto",
        discount_value: 0,
        end_date: "",
        image_url: ""
    });

    useEffect(() => {
        if (promotion) {
            setFormData({
                title: promotion.title || "",
                description: promotion.description || "",
                status: promotion.status || "ativa",
                type: promotion.type || "desconto",
                discount_value: promotion.discount_value || 0,
                end_date: promotion.end_date ? promotion.end_date.split('T')[0] : "",
                image_url: promotion.image_url || ""
            });
        }
    }, [promotion]);

    const mutation = useMutation({
        mutationFn: (data: any) => {
            if (promotion) {
                return base44.entities.Promotion.update(promotion.id, data);
            }
            return base44.entities.Promotion.create(data);
        },
        onSuccess: () => {
            toast.success(promotion ? "Promoção atualizada!" : "Promoção criada!");
            onSuccess();
        },
        onError: () => toast.error("Erro ao salvar promoção")
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="title">Título da Promoção</Label>
                <Input
                    id="title"
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                    placeholder="Ex: Botox Week"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    required
                    placeholder="Detalhes da oferta..."
                />
            </div>

            <div className="space-y-2">
                <Label>Imagem da Promoção (Opcional)</Label>
                <div className="flex items-start gap-4">
                    {formData.image_url ? (
                        <div className="relative w-full max-w-[200px] aspect-video rounded-md overflow-hidden border border-slate-200 group">
                            <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, image_url: "" }))}
                                className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-sm hover:bg-white text-rose-500 transition-opacity"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="w-full">
                            <label
                                htmlFor="image-upload"
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-2 text-slate-400" />
                                    <p className="text-sm text-slate-500">Clique para fazer upload da imagem</p>
                                </div>
                                <input
                                    id="image-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            try {
                                                const url = await base44.storage.upload(file);
                                                setFormData(prev => ({ ...prev, image_url: url }));
                                            } catch (err) {
                                                toast.error("Erro ao fazer upload da imagem");
                                            }
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    )}
                </div>
            </div>



            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                        value={formData.status}
                        onValueChange={val => setFormData(prev => ({ ...prev, status: val }))}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ativa">Ativa</SelectItem>
                            <SelectItem value="pausada">Pausada</SelectItem>
                            <SelectItem value="encerrada">Encerrada</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="end_date">Validade</Label>
                    <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" type="button" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                    {promotion ? "Salvar Alterações" : "Criar Promoção"}
                </Button>
            </div>
        </form>
    );
}
