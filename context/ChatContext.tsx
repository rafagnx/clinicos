import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
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
            currentUser
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
