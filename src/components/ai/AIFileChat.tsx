import React, { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Send,
  FileText,
  Brain,
  User,
  Bot,
  Paperclip,
  Lightbulb,
  MessageSquare,
  Sparkles,
  X,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadedFile, ChatMessage } from "@/types";
import { useEnhancedAI } from "@/hooks/useEnhancedAI";
import { useAI } from "@/hooks/useAI";
import { MessageBubble } from "@/components/chat/MessageBubble";

interface AIFileChatProps {
  files: UploadedFile[];
  onFileSelect?: (fileIds: string[]) => void;
  className?: string;
}

export function AIFileChat({
  files,
  onFileSelect,
  className,
}: AIFileChatProps) {
  const { chatWithFiles, generateContentSuggestions, isLoading } =
    useEnhancedAI();
  const { isReady, selectedService, currentModel } = useAI();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Generate suggestions when files change
  useEffect(() => {
    if (files.length > 0 && suggestions.length === 0) {
      generateSuggestions();
    }
  }, [files]);

  const generateSuggestions = useCallback(async () => {
    if (files.length === 0) return;

    setIsGeneratingSuggestions(true);
    try {
      const newSuggestions = await generateContentSuggestions(files);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error("Failed to generate suggestions:", error);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  }, [files, generateContentSuggestions]);

  const handleSendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || !isReady) return;

      // Get selected files for context
      const contextFiles =
        selectedFiles.length > 0
          ? files.filter((f) => selectedFiles.includes(f.id))
          : files;

      // Create user message
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        type: "user",
        content: messageText,
        timestamp: Date.now(),
        attachedFiles: contextFiles.map((f) => f.id),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");

      // Create loading AI message
      const loadingMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        type: "ai",
        content: "",
        timestamp: Date.now(),
        isLoading: true,
      };

      setMessages((prev) => [...prev, loadingMessage]);

      try {
        const response = await chatWithFiles(messageText, contextFiles);

        // Update AI message with response
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === loadingMessage.id
              ? {
                  ...msg,
                  content: response,
                  isLoading: false,
                  contextSummary:
                    contextFiles.length > 0
                      ? `Based on ${contextFiles.length} file${contextFiles.length > 1 ? "s" : ""}: ${contextFiles.map((f) => f.name).join(", ")}`
                      : undefined,
                }
              : msg,
          ),
        );
      } catch (error) {
        console.error("Chat failed:", error);

        // Update AI message with error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === loadingMessage.id
              ? {
                  ...msg,
                  content:
                    "Sorry, I encountered an error processing your request. Please try again.",
                  isLoading: false,
                }
              : msg,
          ),
        );

        toast.error(
          error instanceof Error ? error.message : "Failed to get AI response",
        );
      }
    },
    [isReady, selectedFiles, files, chatWithFiles],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      handleSendMessage(input);
    },
    [input, handleSendMessage],
  );

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  }, []);

  const handleFileToggle = useCallback(
    (fileId: string) => {
      setSelectedFiles((prev) => {
        const newSelection = prev.includes(fileId)
          ? prev.filter((id) => id !== fileId)
          : [...prev, fileId];

        onFileSelect?.(newSelection);
        return newSelection;
      });
    },
    [onFileSelect],
  );

  const handleSelectAllFiles = useCallback(() => {
    const allFileIds = files.map((f) => f.id);
    setSelectedFiles(allFileIds);
    onFileSelect?.(allFileIds);
  }, [files, onFileSelect]);

  const handleClearSelection = useCallback(() => {
    setSelectedFiles([]);
    onFileSelect?.([]);
  }, [onFileSelect]);

  const getSelectedFilesContext = useCallback(() => {
    const contextFiles =
      selectedFiles.length > 0
        ? files.filter((f) => selectedFiles.includes(f.id))
        : files;

    return contextFiles;
  }, [selectedFiles, files]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={cn("flex flex-col h-full space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-green-500/10">
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">AI File Chat</h3>
            <p className="text-sm text-muted-foreground">
              Chat with AI about your {files.length} uploaded file
              {files.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Service Status */}
        <div className="flex items-center gap-2">
          <Badge variant={isReady ? "default" : "secondary"}>
            {selectedService} ({currentModel})
          </Badge>
          {!isReady && <Badge variant="destructive">Not Ready</Badge>}
        </div>
      </div>

      {/* File Selection */}
      {files.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                File Context ({selectedFiles.length} of {files.length} selected)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllFiles}
                  disabled={selectedFiles.length === files.length}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearSelection}
                  disabled={selectedFiles.length === 0}
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-24">
              <div className="flex flex-wrap gap-2">
                {files.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => handleFileToggle(file.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors",
                      selectedFiles.includes(file.id)
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-muted/50 border-muted hover:bg-muted",
                    )}
                  >
                    <FileText className="w-4 h-4" />
                    <span className="font-medium truncate max-w-32">
                      {file.name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {file.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Suggested Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 4).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-left px-3 py-2 text-sm bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 rounded-lg border border-purple-200 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Conversation
            {getSelectedFilesContext().length > 0 && (
              <Badge variant="outline" className="text-xs">
                Context:{" "}
                {getSelectedFilesContext()
                  .map((f) => f.name)
                  .join(", ")}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 pr-4 touch-pan-y" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Start a conversation about your files!
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ask questions, request analysis, or get insights about your
                    documents.
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.type === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    {message.type === "ai" && (
                      <Avatar className="w-8 h-8">
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      </Avatar>
                    )}

                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-4 py-3",
                        message.type === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-muted",
                      )}
                    >
                      {message.isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                          <span className="text-sm">AI is thinking...</span>
                        </div>
                      ) : (
                        <>
                          <MessageBubble message={message} />

                          {/* Context Summary */}
                          {message.contextSummary && (
                            <div className="mt-2 pt-2 border-t border-muted-foreground/20">
                              <p className="text-xs text-muted-foreground">
                                {message.contextSummary}
                              </p>
                            </div>
                          )}

                          {/* Attached Files */}
                          {message.attachedFiles &&
                            message.attachedFiles.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-muted-foreground/20">
                                <div className="flex flex-wrap gap-1">
                                  {message.attachedFiles.map((fileId) => {
                                    const file = files.find(
                                      (f) => f.id === fileId,
                                    );
                                    return file ? (
                                      <Badge
                                        key={fileId}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {file.name}
                                      </Badge>
                                    ) : null;
                                  })}
                                </div>
                              </div>
                            )}
                        </>
                      )}
                    </div>

                    {message.type === "user" && (
                      <Avatar className="w-8 h-8">
                        <div className="w-full h-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      </Avatar>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  !isReady
                    ? "AI service not ready..."
                    : files.length === 0
                      ? "Upload files to start chatting..."
                      : "Ask about your files..."
                }
                disabled={!isReady || isLoading}
                className="pr-10"
              />
              {getSelectedFilesContext().length > 0 && (
                <Badge
                  variant="outline"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
                >
                  {getSelectedFilesContext().length}
                </Badge>
              )}
            </div>
            <Button
              type="submit"
              disabled={!input.trim() || !isReady || isLoading}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>

          {/* Status */}
          {!isReady && (
            <Alert className="mt-2">
              <AlertDescription className="text-xs">
                AI service not ready. Please configure your API settings.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
