import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export const ChatInput = ({ onSend, isLoading }: ChatInputProps) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about admissions, programs, fees..."
        className={cn(
          "min-h-[60px] pr-12 resize-none bg-[hsl(var(--chat-input-bg))]",
          "focus-visible:ring-primary"
        )}
        disabled={isLoading}
      />
      <Button
        type="submit"
        size="icon"
        className="absolute bottom-2 right-2 h-9 w-9"
        disabled={!input.trim() || isLoading}
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
};