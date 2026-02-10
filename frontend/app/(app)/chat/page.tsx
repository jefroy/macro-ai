"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  deleteSession,
  getSessionMessages,
  listSessions,
  type ChatSession,
} from "@/lib/api/chat";
import {
  generateMessageId,
  useChatStore,
  type Message,
} from "@/lib/stores/chat-store";
import { ChatWebSocket } from "@/lib/websocket";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageSquarePlus, Send, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export default function ChatPage() {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const wsRef = useRef<ChatWebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    sessionId,
    messages,
    isStreaming,
    wsStatus,
    setSessionId,
    setMessages,
    addMessage,
    appendToLastMessage,
    finalizeLastMessage,
    setIsStreaming,
    setWsStatus,
    clearChat,
  } = useChatStore();

  const { data: sessions = [] } = useQuery({
    queryKey: ["chat-sessions"],
    queryFn: listSessions,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSession,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      if (sessionId === deletedId) {
        clearChat();
      }
    },
  });

  // Connect WebSocket on mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const ws = new ChatWebSocket({
      onToken: (content, sid) => {
        useChatStore.getState().appendToLastMessage(content);
      },
      onDone: (sid) => {
        useChatStore.getState().finalizeLastMessage();
        queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      },
      onError: (error, code) => {
        useChatStore.getState().finalizeLastMessage();
        if (code === "AI_NOT_CONFIGURED") {
          useChatStore.getState().addMessage({
            id: generateMessageId(),
            role: "assistant",
            content:
              "AI provider not configured. Go to **Settings** to add your API key and model.",
          });
        } else {
          useChatStore.getState().addMessage({
            id: generateMessageId(),
            role: "assistant",
            content: `Error: ${error}`,
          });
        }
      },
      onSessionCreated: (sid, title) => {
        useChatStore.getState().setSessionId(sid);
        queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      },
      onStatusChange: (status) => {
        useChatStore.getState().setWsStatus(status);
      },
    });

    ws.connect(token);
    wsRef.current = ws;

    return () => {
      ws.disconnect();
      wsRef.current = null;
    };
  }, [queryClient]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load session messages
  const loadSession = useCallback(
    async (sid: string) => {
      setSessionId(sid);
      setIsStreaming(false);
      try {
        const history = await getSessionMessages(sid);
        setMessages(
          history.map((m) => ({
            id: generateMessageId(),
            role: m.role,
            content: m.content,
          }))
        );
      } catch {
        setMessages([]);
      }
      inputRef.current?.focus();
    },
    [setSessionId, setMessages, setIsStreaming]
  );

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming || wsStatus !== "connected") return;

    // Add user message to UI
    addMessage({ id: generateMessageId(), role: "user", content: text });

    // Add placeholder for assistant streaming
    addMessage({
      id: generateMessageId(),
      role: "assistant",
      content: "",
      streaming: true,
    });
    setIsStreaming(true);

    // Send via WebSocket
    wsRef.current?.send(text, sessionId ?? undefined);
    setInput("");
  }

  function handleNewChat() {
    clearChat();
    inputRef.current?.focus();
  }

  const statusColor =
    wsStatus === "connected"
      ? "bg-green-500"
      : wsStatus === "connecting"
        ? "bg-yellow-500"
        : "bg-red-500";

  return (
    <div className="flex h-[calc(100vh-10rem)] gap-4">
      {/* Sidebar: Session List */}
      <div className="hidden w-64 flex-col gap-2 md:flex">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleNewChat}
        >
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          New Chat
        </Button>

        <div className="flex-1 space-y-1 overflow-y-auto">
          {sessions.map((s: ChatSession) => (
            <div
              key={s.id}
              className={`group flex items-center rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-accent ${
                sessionId === s.id ? "bg-accent" : ""
              }`}
              onClick={() => loadSession(s.id)}
            >
              <span className="flex-1 truncate">{s.title}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMutation.mutate(s.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className={`h-2 w-2 rounded-full ${statusColor}`} />
          {wsStatus === "connected"
            ? "Connected"
            : wsStatus === "connecting"
              ? "Connecting..."
              : "Disconnected"}
        </div>
      </div>

      {/* Main Chat Area */}
      <Card className="flex flex-1 flex-col">
        {/* Mobile: New Chat + Status */}
        <div className="flex items-center justify-between border-b p-3 md:hidden">
          <Button variant="ghost" size="sm" onClick={handleNewChat}>
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            New Chat
          </Button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className={`h-2 w-2 rounded-full ${statusColor}`} />
          </div>
        </div>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-center text-muted-foreground">
                Ask me anything about nutrition, meal planning, or your fitness
                goals.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg: Message) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.content || (msg.streaming && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ))}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>

        {/* Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                wsStatus === "connected"
                  ? "Type a message..."
                  : "Connecting..."
              }
              className="flex-1"
              disabled={wsStatus !== "connected"}
              autoFocus
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isStreaming || wsStatus !== "connected"}
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
