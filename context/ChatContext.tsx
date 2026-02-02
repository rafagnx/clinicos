import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/lib/base44Client';
import { supabase } from '@/lib/supabaseClient';
import { io, Socket } from 'socket.io-client';


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
    socket: Socket | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [activeRecipient, setActiveRecipient] = useState<any | null>(null);
    const [usersStatus, setUsersStatus] = useState<Record<string, string>>({});
    const userToProRef = useRef<Record<string, string>>({});
    const socketRef = useRef<Socket | null>(null);

    // Fetch Current User
    const { data: currentUser } = useQuery({
        queryKey: ["auth-user"],
        queryFn: () => base44.auth.me(),
        retry: false,
        staleTime: 1000 * 60 * 5 // 5 minutes
    });

    // Initialize Socket
    useEffect(() => {
        if (!currentUser?.id) return;

        // Request notification permission on mount
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // Determine URL (Production vs Local)
        // Strip '/api' if present to ensure we connect to root namespace
        const baseUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin.replace('5173', '3001');
        const socketUrl = baseUrl.replace('/api', '');

        const socket = io(socketUrl, {
            transports: ['websocket'],
            reconnectionAttempts: 5
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log("Connected to Socket.io");
            socket.emit('join_room', currentUser.id);
        });

        // Listen for Real-Time Messages
        socket.on('receive_message', (message: any) => {
            console.log("New Real-time Message:", message);

            // Invalidate/Refetch messages key if we know it
            queryClient.invalidateQueries({ queryKey: ["messages"] });
            queryClient.invalidateQueries({ queryKey: ["conversations"] });

            // Show browser notification if chat is not open with this sender
            if (message.sender_id !== currentUser?.id) {
                const isChatOpenWithSender = activeRecipient?.id === message.sender_id ||
                    activeRecipient?.user_id === message.sender_id;

                if (!isChatOpenWithSender && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    new Notification(message.sender_name || 'Nova Mensagem 💬', {
                        body: message.content?.substring(0, 100) || 'Você recebeu uma nova mensagem',
                        icon: '/favicon.ico',
                        tag: `chat-${message.sender_id}` // Prevents duplicate notifications from same sender
                    });
                }
            }
        });

        // Removed: Old socket.on('status_change') from here

        return () => {
            socket.disconnect();
        };
    }, [currentUser, activeRecipient]);


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

    // Fetch Initial Statuses
    useQuery<Record<string, string>>({
        queryKey: ["all-pros-status"],
        queryFn: async () => {
            const pros = await base44.entities.Professional.list();
            const statusMap: any = {};
            pros.forEach((p: any) => {
                statusMap[p.id] = p.chat_status || "offline";
                if (p.user_id) {
                    statusMap[p.user_id] = p.chat_status || "offline";
                    userToProRef.current[p.user_id] = p.id;
                }
            });
            setUsersStatus(statusMap);
            return statusMap;
        },
        // We still poll as a fallback, but less frequently? Or keep it for redundancy.
        refetchInterval: 30000
    });

    // Listen for Status Changes (Moved and updated)
    useEffect(() => {
        if (!socketRef.current) return;

        // Listen for Status Changes
        const socket = socketRef.current;
        const handleStatusChange = ({ userId, status }: any) => {
            setUsersStatus(prev => {
                const updates: any = { [userId]: status };
                // Also update the Professional ID if we know it
                const proId = userToProRef.current[userId];
                if (proId) updates[proId] = status;

                return { ...prev, ...updates };
            });
        };

        socketRef.current.on('status_change', handleStatusChange);

        return () => {
            socketRef.current?.off('status_change', handleStatusChange);
        };
    }, [socketRef.current]); // Re-bind if socket changes

    const updateStatus = async (newStatus: "online" | "busy" | "offline") => {
        if (!currentUser?.id) return;

        // Optimistic update for UI responsiveness (Update BOTH UserID and ProID)
        setUsersStatus(prev => {
            const updates: any = { [currentUser.id]: newStatus };
            const proId = userToProRef.current[currentUser.id];
            if (proId) updates[proId] = newStatus;
            return { ...prev, ...updates };
        });

        // Socket Emit
        socketRef.current?.emit('update_status', { userId: currentUser.id, status: newStatus });

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
        // Simplified: Always show online (green)
        return "online" as "online" | "busy" | "offline";
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
            updateStatus,
            socket: socketRef.current
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
