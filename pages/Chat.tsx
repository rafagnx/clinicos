import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import ConversationList from "@/components/chat/ConversationList";
import MessageArea from "@/components/chat/MessageArea";
import NewConversationDialog from "@/components/chat/NewConversationDialog";

export default function Chat() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newConversationOpen, setNewConversationOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => base44.entities.Conversation.list("-last_message_at"),
    enabled: !!currentUser
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ["professionals"],
    queryFn: () => base44.entities.Professional.list()
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", selectedConversation?.id],
    queryFn: () => base44.entities.Message.filter({
      conversation_id: selectedConversation.id,
      "created_date": ""
    }),
    enabled: !!selectedConversation
  });

  // Real-time subscription for conversations
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = base44.entities.Conversation.subscribe((event) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });

    return unsubscribe;
  }, [currentUser, queryClient]);

  // Real-time subscription for messages
  useEffect(() => {
    if (!selectedConversation) return;

    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.data.conversation_id === selectedConversation.id) {
        queryClient.invalidateQueries({ queryKey: ["messages", selectedConversation.id] });
      }
    });

    return unsubscribe;
  }, [selectedConversation, queryClient]);

  const sendMessageMutation = useMutation({
    mutationFn: (text) => base44.entities.Message.create({
      conversation_id: selectedConversation.id,
      sender_id: currentUser.id,
      text,
      created_date: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", selectedConversation.id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  });

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white">
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h1 className="text-xl font-bold">Mensagens</h1>
          <button 
            onClick={() => setNewConversationOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <ConversationList 
          conversations={conversations}
          professionals={professionals}
          selectedId={selectedConversation?.id}
          onSelect={setSelectedConversation}
          currentUserId={currentUser?.id}
        />
      </div>

      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <MessageArea 
            conversation={selectedConversation}
            messages={messages}
            currentUser={currentUser}
            professionals={professionals}
            onSendMessage={(text) => sendMessageMutation.mutate(text)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>Selecione uma conversa para começar</p>
          </div>
        )}
      </div>

      <NewConversationDialog 
        open={newConversationOpen}
        onOpenChange={setNewConversationOpen}
        professionals={professionals}
        currentUserId={currentUser?.id}
        onSelectConversation={(conv) => {
          setSelectedConversation(conv);
          setNewConversationOpen(false);
        }}
      />
    </div>
  );
}
