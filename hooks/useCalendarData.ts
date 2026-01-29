import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { base44 } from '@/lib/base44Client';
import { format } from 'date-fns';

export interface CalendarEvent {
    id: number;
    organization_id: string;
    date: string; // YYYY-MM-DD
    content: string;
    category: string;
    platform: 'instagram' | 'whatsapp' | 'email' | 'tiktok' | 'other';
    status: 'planned' | 'created' | 'posted';
    created_at: string;
}

const API_URL = '/api/marketing/events';

// API Client Wrapper (Since base44Client might not have this module yet)
const marketingApi = {
    list: async (start?: string, end?: string) => {
        // We assume the cookie/auth header is sent automatically by the browser/axios
        // or by base44 client interceptors if configured globally.
        // If using fetch locally:
        const token = localStorage.getItem('supabase.auth.token')
            ? JSON.parse(localStorage.getItem('supabase.auth.token')!).currentSession.access_token
            : null;

        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Also try to get from base44 client internal state if possible, 
        // but standard fetch with updated server auth logic (checking header) is safest.
        // NOTE: The server logic check `req.headers.authorization` OR cookie.

        const query = new URLSearchParams();
        if (start) query.append('start', start);
        if (end) query.append('end', end);

        const res = await fetch(`${API_URL}?${query.toString()}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch events');
        return res.json();
    },

    create: async (data: Partial<CalendarEvent>) => {
        const token = localStorage.getItem('supabase.auth.token')
            ? JSON.parse(localStorage.getItem('supabase.auth.token')!).currentSession.access_token
            : null;
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(API_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to create event');
        return res.json();
    },

    update: async (id: number, data: Partial<CalendarEvent>) => {
        const token = localStorage.getItem('supabase.auth.token')
            ? JSON.parse(localStorage.getItem('supabase.auth.token')!).currentSession.access_token
            : null;
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to update event');
        return res.json();
    },

    delete: async (id: number) => {
        const token = localStorage.getItem('supabase.auth.token')
            ? JSON.parse(localStorage.getItem('supabase.auth.token')!).currentSession.access_token
            : null;
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers
        });
        if (!res.ok) throw new Error('Failed to delete event');
        return res.json();
    }
};

export const useCalendarData = () => {
    const queryClient = useQueryClient();

    const { data: events = [], isLoading } = useQuery({
        queryKey: ['marketing-events'],
        queryFn: () => marketingApi.list()
    });

    const createEvent = useMutation({
        mutationFn: marketingApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketing-events'] });
            toast.success('Conteúdo agendado com sucesso!');
        },
        onError: () => toast.error('Erro ao agendar conteúdo')
    });

    const updateEvent = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<CalendarEvent> }) =>
            marketingApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketing-events'] });
            toast.success('Conteúdo atualizado!');
        },
        onError: () => toast.error('Erro ao atualizar')
    });

    const deleteEvent = useMutation({
        mutationFn: marketingApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketing-events'] });
            toast.success('Conteúdo removido');
        },
        onError: () => toast.error('Erro ao remover')
    });

    const getDayEvents = useCallback((date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return events.filter((e: CalendarEvent) => {
            // Handle timezone issues roughly by just checking the YYYY-MM-DD string part
            return e.date.startsWith(dateStr) || e.date.split('T')[0] === dateStr;
        });
    }, [events]);

    return {
        events,
        isLoading,
        createEvent: createEvent.mutate,
        updateEvent: updateEvent.mutate,
        deleteEvent: deleteEvent.mutate,
        getDayEvents
    };
};
