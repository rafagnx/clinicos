import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/lib/base44Client';
import { supabase } from '@/lib/supabaseClient';

interface ChatContextType {
    isOpen: boolean;
    isMinimized: boolean;
    activeRecipient: any | null;
    openChat: (recipient: any) => void;
    closeChat: () => void;
    toggleMinimize: () => void;
    currentUser: any | null;
    getStatus: (id: any) => "online" | "busy" | "offline";
    updateStatus: (status: "online" | "busy" | "offline") => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [activeRecipient, setActiveRecipient] = useState<any | null>(null);

    // Fetch Current User
    const { data: currentUser } = useQuery({
        queryKey: ["auth-user"],
        queryFn: () => base44.auth.me(),
        retry: false,
        staleTime: 1000 * 60 * 5 // 5 minutes
    });

    const openChat = (recipient: any) => {
        setActiveRecipient(recipient);
        setIsOpen(true);
        setIsMinimized(false);
    };

    const closeChat = () => {
        setIsOpen(false);
        setActiveRecipient(null);
    };

    const toggleMinimize = () => {
        setIsMinimized(prev => !prev);
    };

    const [usersStatus, setUsersStatus] = useState<Record<string, string>>({});

    // Fetch Initial Statuses
    useQuery({
        queryKey: ["all-pros-status"],
        queryFn: async () => {
            const pros = await base44.entities.Professional.list();
            const statusMap: any = {};
            pros.forEach((p: any) => {
                statusMap[p.id] = p.chat_status || "offline";
                if (p.user_id) statusMap[p.user_id] = p.chat_status || "offline";
            });
            setUsersStatus(statusMap);
            return statusMap;
        },
        refetchInterval: 10000 // Poll every 10s for simple MVP
    });

    const updateStatus = async (newStatus: "online" | "busy" | "offline") => {
        if (!currentUser?.id) return;

        // Optimistic update for UI responsiveness
        setUsersStatus(prev => ({ ...prev, [currentUser.id]: newStatus }));

        // DB Update
        try {
            // 1. Try to find professional record
            const [pro] = await base44.entities.Professional.list({ user_id: currentUser.id });

            if (pro) {
                await base44.entities.Professional.update(pro.id, { chat_status: newStatus });
                setUsersStatus(prev => ({ ...prev, [pro.id]: newStatus }));
            }

            // Refetch to ensure consistency
            queryClient.invalidateQueries({ queryKey: ["all-pros-status"] });

        } catch (e) {
            console.error("Failed to update status in DB", e);
            // Revert optimistic update if needed? For now we keep it to not flicker
        }
    };

    const getStatus = (id: any) => {
        // If we have a specific status in the map, use it. 
        // Otherwise checks if "id" matches "currentUser.id" to fallback to local pending state
        if (usersStatus[id]) return usersStatus[id] as "online" | "busy" | "offline";
        return "offline";
    };

    // Listen for "open_chat_with" query param
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const recipientId = params.get('open_chat_with');

        if (recipientId && currentUser) {
            // We need to fetch the recipient details if we simulate a click
            const fetchRecipient = async () => {
                try {
                    // Try Professional
                    let [user] = await base44.entities.Professional.list({ id: recipientId }).catch(() => []);

                    if (!user) {
                        // Try Patient
                        const patients = await base44.entities.Patient.list({ id: recipientId }).catch(() => []);
                        user = patients[0];
                    }

                    if (user) {
                        openChat(user);
                        // Optional: Clear param
                        window.history.replaceState({}, '', window.location.pathname);
                    }
                } catch (e) {
                    console.error("Failed to open chat from URL", e);
                }
            };
            fetchRecipient();
        }
    }, [currentUser]);

    return (
        <ChatContext.Provider value={{
            isOpen,
            isMinimized,
            activeRecipient,
            openChat,
            closeChat,
            toggleMinimize,
            currentUser,
            getStatus,
            updateStatus
        }}>
            {children}
        </ChatContext.Provider>
    );
}

export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};
