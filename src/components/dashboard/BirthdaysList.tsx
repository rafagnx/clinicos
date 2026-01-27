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
                    <div key={patient.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={patient.photo_url} />
                            <AvatarFallback className="bg-pink-100 text-pink-600 text-sm">
                                {patient.full_name?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">{patient.full_name}</p>
                            <p className="text-xs text-slate-400">{patient.phone}</p>
                        </div>
                        <Gift className="w-4 h-4 text-pink-400" />
                    </div>
                ))}
            </div>
        </Card>
    );
}
