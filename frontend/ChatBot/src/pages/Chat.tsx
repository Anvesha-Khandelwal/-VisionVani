import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, ArrowLeft, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tenant-chat`;

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Message[];
  onDelta: (deltaText: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ messages }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        onError("Rate limit exceeded. Please try again later.");
        return;
      }
      if (resp.status === 402) {
        onError("Payment required. Please add funds to your workspace.");
        return;
      }
      throw new Error("Failed to start stream");
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          /* ignore partial leftovers */
        }
      }
    }

    onDone();
  } catch (error) {
    console.error("Chat stream error:", error);
    onError(error instanceof Error ? error.message : "Unknown error occurred");
  }
}

const Chat = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (input: string) => {
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let assistantContent = "";
    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    await streamChat({
      messages: [...messages, userMsg],
      onDelta: updateAssistant,
      onDone: () => setIsLoading(false),
      onError: (error) => {
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Error",
          description: error,
        });
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="flex flex-col w-full max-w-4xl mx-auto">
        <header className="border-b border-border bg-card px-6 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Your Domain Chatbot</h1>
              <p className="text-sm text-muted-foreground">Powered by your knowledge base</p>
            </div>
          </div>
        </header>

        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          <div className="space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                  <GraduationCap className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Welcome to Your AI Assistant</h2>
                <p className="text-muted-foreground max-w-md">
                  Ask me anything about your knowledge base. I have access to all the information
                  you've added in your dashboard.
                </p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <ChatMessage key={idx} role={msg.role} content={msg.content} />
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3 animate-pulse">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                  <div className="h-2 w-2 rounded-full bg-accent-foreground" />
                </div>
                <div className="rounded-2xl border border-border bg-card px-4 py-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.2s]" />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-border bg-card p-4 shadow-lg">
          <ChatInput onSend={handleSend} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default Chat;