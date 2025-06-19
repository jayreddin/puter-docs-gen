import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/types";
import { Bot, User, FileText, Paperclip, Lightbulb, Loader2 } from "lucide-react";

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
          {/* Loading State */}
          {message.isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">AI is thinking...</span>
            </div>
          ) : (
            <>
              {/* Message Text */}
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {message.content.split('\n').map((line, index) => (
                  <p key={index} className="mb-2 last:mb-0">
                    {line}
                  </p>
                ))}
              </div>

              {/* Context Summary */}
              {message.contextSummary && !isUser && (
                <div className="mt-3 pt-3 border-t border-muted-foreground/20">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      {message.contextSummary}
                    </p>
                  </div>
                </div>
              )}

              {/* Attached Files */}
              {message.attachedFiles && message.attachedFiles.length > 0 && (
                <div className="mt-3 pt-3 border-t border-muted-foreground/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">
                      Referenced Files ({message.attachedFiles.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {message.attachedFiles.slice(0, 3).map((fileId, index) => (
                      <Badge key={fileId} variant="outline" className="text-xs">
                        File {index + 1}
                      </Badge>
                    ))}
                    {message.attachedFiles.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{message.attachedFiles.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* AI Insights */}
              {message.aiInsights && message.aiInsights.length > 0 && !isUser && (
                <div className="mt-3 pt-3 border-t border-muted-foreground/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs text-muted-foreground font-medium">
                      AI Insights
                    </span>
                  </div>
                  <div className="space-y-1">
                    {message.aiInsights.slice(0, 2).map((insight, index) => (
                      <p key={index} className="text-xs text-muted-foreground">
                        • {insight}
                      </p>
                    ))}
                    {message.aiInsights.length > 2 && (
                      <p className="text-xs text-muted-foreground">
                        • And {message.aiInsights.length - 2} more insights...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Timestamp */}
        <div
          className={cn(
            "mt-1 text-xs text-muted-foreground",
            isUser ? "text-right" : "text-left",
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
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