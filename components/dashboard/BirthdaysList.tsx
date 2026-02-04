import { Card } from "@/components/ui/card";
import { Cake, Gift } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function BirthdaysList({ patients }) {
    // Filter patients to get only today's birthdays
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1; // getMonth is 0-indexed

    const filteredPatients = (patients || []).filter(patient => {
        if (!patient.birth_date) return false;

        // Handle potential different date formats (string or Date object)
        // Assuming YYYY-MM-DD string from standard DB or ISO string
        let bDay, bMonth;

        try {
            const dateStr = String(patient.birth_date).split('T')[0]; // simple ISO split
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                // YYYY-MM-DD
                bMonth = parseInt(parts[1], 10);
                bDay = parseInt(parts[2], 10);
            } else {
                // Fallback date object parsing
                const d = new Date(patient.birth_date);
                bDay = d.getDate();
                bMonth = d.getMonth() + 1; // fix timezone offset issue manually later if needed? 
                // Actually relying on UTC-adjusted strings is safer for simple string split
            }
        } catch (e) { return false; }

        return bDay === currentDay && bMonth === currentMonth;
    });

    if (!filteredPatients || filteredPatients.length === 0) {
        return (
            <Card className="p-6 bg-white border-0 shadow-sm dark:bg-[#151A25] dark:border dark:border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-pink-50 dark:bg-pink-900/20">
                        <Cake className="w-4 h-4 text-pink-500 dark:text-pink-400" />
                    </div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">Aniversariantes</h3>
                </div>
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
                    Nenhum aniversariante hoje
                </p>
            </Card>
        );
    }

    return (
        <Card className="p-6 bg-white border-0 shadow-sm dark:bg-[#151A25] dark:border dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-pink-50 dark:bg-pink-900/20">
                    <Cake className="w-4 h-4 text-pink-500 dark:text-pink-400" />
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Aniversariantes</h3>
            </div>
            <div className="space-y-3">
                {filteredPatients.map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={patient.photo_url} />
                                <AvatarFallback className="bg-pink-100 text-pink-600 text-sm dark:bg-pink-900/30 dark:text-pink-400">
                                    {patient.full_name?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{patient.full_name}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500">{patient.phone}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Gift className="w-4 h-4 text-pink-400 opacity-50 group-hover:hidden transition-opacity" />
                            <button
                                onClick={() => {
                                    const firstName = patient.full_name.split(' ')[0];
                                    // Using runtime generation for emojis to avoid any file encoding issues
                                    const emojis = String.fromCodePoint(0x1F382, 0x1F389);
                                    const message = `Olá ${firstName}! ${emojis}\n\nParabéns pelo seu dia! Desejamos muitas alegrias, saúde e realizações.\n\nCom carinho,\nEquipe Orofacial Clinic`;

                                    let phone = patient.phone?.replace(/\D/g, '') || '';
                                    // If number doesn't start with 55 and has valid length (10 or 11 digits), add it
                                    if (phone && !phone.startsWith('55') && (phone.length === 10 || phone.length === 11)) {
                                        phone = `55${phone}`;
                                    }

                                    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                                    window.open(url, '_blank');
                                }}
                                className="hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 text-pink-600 rounded-full text-xs font-bold hover:bg-pink-100 transition-all shadow-sm dark:bg-pink-900/30 dark:text-pink-400 dark:hover:bg-pink-900/50"
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
