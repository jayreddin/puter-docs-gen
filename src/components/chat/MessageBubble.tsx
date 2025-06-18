import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/types";
import { Bot, User } from "lucide-react";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.type === "user";
  const isSystem = message.type === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center my-6">
        <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <Avatar className="w-8 h-8 mt-1">
        <AvatarFallback
          className={cn(
            isUser
              ? "bg-chat-primary text-white"
              : "bg-chat-secondary text-white",
          )}
        >
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className={cn("flex-1 max-w-[80%]", isUser && "max-w-[70%]")}>
        <Card
          className={cn(
            "p-4 relative",
            isUser
              ? "message-user border-none"
              : "message-ai border border-border",
          )}
        >
          {message.isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="loading-dots">
                <div style={{ "--i": 0 } as React.CSSProperties}></div>
                <div style={{ "--i": 1 } as React.CSSProperties}></div>
                <div style={{ "--i": 2 } as React.CSSProperties}></div>
              </div>
              <span className="text-sm text-muted-foreground">
                AI is thinking...
              </span>
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
            </div>
          )}

          {/* Timestamp */}
          <div
            className={cn(
              "text-2xs mt-2 opacity-60",
              isUser ? "text-white/70" : "text-muted-foreground",
            )}
          >
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </Card>
      </div>
    </div>
  );
}
