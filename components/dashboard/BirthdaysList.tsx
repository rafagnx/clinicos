import { Card } from "@/components/ui/card";
import { Cake, Gift } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function BirthdaysList({ patients }) {
    if (!patients || patients.length === 0) {
        return (
            <Card className="p-6 bg-white border-0 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-pink-50">
                        <Cake className="w-4 h-4 text-pink-500" />
                    </div>
                    <h3 className="font-semibold text-slate-800">Aniversariantes</h3>
                </div>
                <p className="text-sm text-slate-400 text-center py-4">
                    Nenhum aniversariante hoje
                </p>
            </Card>
        );
    }

    return (
        <Card className="p-6 bg-white border-0 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-pink-50">
                    <Cake className="w-4 h-4 text-pink-500" />
                </div>
                <h3 className="font-semibold text-slate-800">Aniversariantes</h3>
            </div>
            <div className="space-y-3">
                {patients.map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={patient.photo_url} />
                                <AvatarFallback className="bg-pink-100 text-pink-600 text-sm">
                                    {patient.full_name?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-700 truncate">{patient.full_name}</p>
                                <p className="text-xs text-slate-400">{patient.phone}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Gift className="w-4 h-4 text-pink-400 opacity-50 group-hover:hidden transition-opacity" />
                            <button
                                onClick={() => {
                                    const firstName = patient.full_name.split(' ')[0];
                                    const message = `Olá ${firstName}! 🎂🎉\n\nParabéns pelo seu dia! Desejamos muitas alegrias, saúde e realizações.\n\nCom carinho,\nEquipe Orofacial Clinic`;

                                    let phone = patient.phone?.replace(/\D/g, '') || '';
                                    // If number doesn't start with 55 and has valid length (10 or 11 digits), add it
                                    if (phone && !phone.startsWith('55') && (phone.length === 10 || phone.length === 11)) {
                                        phone = `55${phone}`;
                                    }

                                    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                                    window.open(url, '_blank');
                                }}
                                className="hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 text-pink-600 rounded-full text-xs font-bold hover:bg-pink-100 transition-all shadow-sm"
                            >
                                Enviar Parabéns
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
