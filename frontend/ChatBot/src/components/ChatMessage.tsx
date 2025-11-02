import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export const ChatMessage = ({ role, content }: ChatMessageProps) => {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg bg-accent">
          <Bot className="h-4 w-4 text-accent-foreground" />
        </div>
      )}
      
      <div
        className={cn(
          "rounded-2xl px-4 py-3 max-w-[80%] shadow-sm",
          isUser
            ? "bg-[hsl(var(--chat-user-bg))] text-[hsl(var(--chat-user-fg))]"
            : "bg-[hsl(var(--chat-bot-bg))] text-[hsl(var(--chat-bot-fg))] border border-border"
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {content}
        </p>
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg bg-primary">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
    </div>
  );
};