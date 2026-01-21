import React from 'react';
import { Link } from "react-router-dom";
import { cn, createPageUrl } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Calendar, MapPin, Edit2, Trash2, MoreVertical, FileText, Smartphone } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PatientCardProps {
    patient: any;
    lastAppointment?: any;
    onEdit: () => void;
    onDelete: () => void;
    isAdmin: boolean;
    isDark: boolean;
}

export default function PatientCard({ patient, lastAppointment, onEdit, onDelete, isAdmin, isDark }: PatientCardProps) {
    return (
        <Card className={cn(
            "p-5 transition-all duration-300 group h-full flex flex-col justify-between overflow-hidden relative",
            isDark
                ? "bg-slate-900/40 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700 hover:shadow-2xl hover:shadow-indigo-500/10"
                : "bg-white border-slate-200 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-100/50 hover:-translate-y-1"
        )}>
            {/* Gradient accent line on hover */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-4">
                        <div className="relative">
                            <Avatar className="h-14 w-14 ring-2 ring-offset-2 ring-transparent group-hover:ring-indigo-500/30 transition-all duration-300">
                                <AvatarImage src={patient.photo_url} className="object-cover" />
                                <AvatarFallback className={cn(
                                    "font-bold text-lg",
                                    isDark ? "bg-slate-800 text-indigo-400" : "bg-indigo-50 text-indigo-600"
                                )}>
                                    {patient.full_name?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <span className={cn(
                                "absolute bottom-0 right-0 w-3.5 h-3.5 border-2 rounded-full",
                                isDark ? "border-slate-900" : "border-white",
                                patient.status === 'ativo' ? "bg-emerald-500" : "bg-slate-400"
                            )}></span>
                        </div>

                        <div>
                            <h3 className={cn(
                                "font-bold text-lg leading-tight line-clamp-1",
                                isDark ? "text-slate-100 group-hover:text-indigo-400" : "text-slate-900 group-hover:text-indigo-700"
                            )}>
                                {patient.full_name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <Badge variant="outline" className={cn(
                                    "border shadow-none font-medium px-2 py-0 h-5",
                                    patient.status === 'ativo'
                                        ? (isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200")
                                        : (isDark ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-slate-100 text-slate-600 border-slate-200")
                                )}>
                                    {patient.status === 'ativo' ? 'Ativo' : 'Inativo'}
                                </Badge>
                                {patient.gender && (
                                    <span className={cn(
                                        "text-xs capitalize px-2 py-0.5 rounded-full border",
                                        isDark ? "text-slate-400 border-slate-700" : "text-slate-500 border-slate-100"
                                    )}>
                                        {patient.gender}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className={cn(
                                "h-8 w-8 -mr-2 rounded-full transition-colors",
                                isDark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                            )}>
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className={isDark ? "bg-[#1C2333] border-slate-700 text-slate-200" : ""}>
                            <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                                <Edit2 className="w-4 h-4 mr-2" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="cursor-pointer">
                                <Link to={createPageUrl("PatientHistory", { id: patient.id })}>
                                    <FileText className="w-4 h-4 mr-2" />
                                    Prontuário
                                </Link>
                            </DropdownMenuItem>
                            {isAdmin && (
                                <>
                                    <DropdownMenuSeparator className={isDark ? "bg-slate-700" : ""} />
                                    <DropdownMenuItem onClick={onDelete} className="text-rose-500 focus:text-rose-600 focus:bg-rose-50/10 cursor-pointer">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Excluir
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="space-y-2.5 pt-1">
                    {patient.phone && (
                        <div className={cn("flex items-center text-sm", isDark ? "text-slate-400" : "text-slate-600")}>
                            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center mr-2.5", isDark ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-400")}>
                                <Smartphone className="w-3.5 h-3.5" />
                            </div>
                            {patient.phone}
                        </div>
                    )}
                    {patient.email && (
                        <div className={cn("flex items-center text-sm", isDark ? "text-slate-400" : "text-slate-600")}>
                            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center mr-2.5", isDark ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-400")}>
                                <Mail className="w-3.5 h-3.5" />
                            </div>
                            <span className="truncate">{patient.email}</span>
                        </div>
                    )}
                    {patient.city && (
                        <div className={cn("flex items-center text-sm", isDark ? "text-slate-400" : "text-slate-600")}>
                            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center mr-2.5", isDark ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-400")}>
                                <MapPin className="w-3.5 h-3.5" />
                            </div>
                            {patient.city}
                        </div>
                    )}
                </div>
            </div>

            {lastAppointment && (
                <div className={cn("mt-5 pt-3 border-t", isDark ? "border-slate-800" : "border-slate-100")}>
                    <p className={cn("text-[10px] font-semibold uppercase tracking-wider mb-2", isDark ? "text-slate-500" : "text-slate-400")}>Última consulta</p>
                    <div className={cn(
                        "flex items-center text-xs p-2 rounded-lg transition-colors",
                        isDark ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20" : "bg-indigo-50/60 text-indigo-700 border border-indigo-100"
                    )}>
                        <Calendar className="w-3.5 h-3.5 mr-2 opacity-70" />
                        <span className="font-medium">{format(parseISO(lastAppointment.date), "dd/MM/yyyy", { locale: ptBR })}</span>
                        <span className="mx-1.5 opacity-40">|</span>
                        <span>{lastAppointment.time}</span>
                    </div>
                </div>
            )}
        </Card>
    );
}
