import React from 'react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Calendar, MapPin, Edit2, Trash2, MoreVertical, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PatientCard({ patient, lastAppointment, onEdit, onDelete, isAdmin }) {
    return (
        <Card className="p-5 hover:shadow-md transition-shadow bg-white border-slate-100">
            <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={patient.photo_url} />
                    <AvatarFallback className="bg-slate-100 text-slate-600 font-medium">
                        {patient.full_name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-semibold text-slate-900 truncate pr-2">{patient.full_name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant={patient.status === 'ativo' ? 'default' : 'secondary'} className={patient.status === 'ativo' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-500 hover:bg-slate-100"}>
                                    {patient.status === 'ativo' ? 'Ativo' : 'Inativo'}
                                </Badge>
                                {patient.gender && (
                                    <span className="text-xs text-slate-400 capitalize px-2 py-0.5 bg-slate-50 rounded-full border border-slate-100">
                                        {patient.gender}
                                    </span>
                                )}
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-slate-400 hover:text-slate-600">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={onEdit}>
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to={createPageUrl("PatientHistory", { id: patient.id })}>
                                        <FileText className="w-4 h-4 mr-2" />
                                        Prontuário
                                    </Link>
                                </DropdownMenuItem>
                                {isAdmin && (
                                    <DropdownMenuItem onClick={onDelete} className="text-rose-600 focus:text-rose-600">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Excluir
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="mt-4 space-y-2">
                        {patient.phone && (
                            <div className="flex items-center text-sm text-slate-500">
                                <Phone className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                {patient.phone}
                            </div>
                        )}
                        {patient.email && (
                            <div className="flex items-center text-sm text-slate-500">
                                <Mail className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                <span className="truncate">{patient.email}</span>
                            </div>
                        )}
                        {patient.city && (
                            <div className="flex items-center text-sm text-slate-500">
                                <MapPin className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                {patient.city}
                            </div>
                        )}
                    </div>

                    {lastAppointment && (
                        <div className="mt-4 pt-3 border-t border-slate-50">
                            <p className="text-xs text-slate-400 font-medium mb-1">Última consulta</p>
                            <div className="flex items-center text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                                <Calendar className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                {format(parseISO(lastAppointment.date), "dd/MM/yyyy", { locale: ptBR })}
                                <span className="mx-1">•</span>
                                {lastAppointment.time}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
