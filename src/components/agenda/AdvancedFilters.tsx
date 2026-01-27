import React from 'react';
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdvancedFilters({ professionals, filters, setFilters }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filtros
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                    checked={filters.status === "all"}
                    onCheckedChange={() => setFilters(prev => ({ ...prev, status: "all" }))}
                >
                    Todos os status
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                    checked={filters.status === "agendado"}
                    onCheckedChange={() => setFilters(prev => ({ ...prev, status: "agendado" }))}
                >
                    Agendado
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                    checked={filters.status === "confirmado"}
                    onCheckedChange={() => setFilters(prev => ({ ...prev, status: "confirmado" }))}
                >
                    Confirmado
                </DropdownMenuCheckboxItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Profissional</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                    checked={filters.professional_id === "all"}
                    onCheckedChange={() => setFilters(prev => ({ ...prev, professional_id: "all" }))}
                >
                    Todos os profissionais
                </DropdownMenuCheckboxItem>
                {professionals && professionals.map(prof => (
                    <DropdownMenuCheckboxItem
                        key={prof.id}
                        checked={filters.professional_id === prof.id}
                        onCheckedChange={() => setFilters(prev => ({ ...prev, professional_id: prof.id }))}
                    >
                        {prof.full_name}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
