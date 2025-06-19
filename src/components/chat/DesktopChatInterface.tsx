import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Upload,
  FolderOpen,
  Send,
  Plus,
  FileText,
  Trash2,
  Brain,
  MessageSquare,
  Combine,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage, ChatState } from "@/types";
import { useAI } from "@/hooks/useAI";
import { useFileHandler } from "@/hooks/useFileHandler";
import { useSettings } from "@/hooks/useSettings";
import { MessageBubble } from "./MessageBubble";
import { GeneratedContent } from "./GeneratedContent";
import { FileList } from "@/components/file-handler/FileList";
import { FileUploader } from "@/components/file-handler/FileUploader";
import { FileAnalyzer } from "@/components/file-handler/FileAnalyzer";
import { FileCombiner } from "@/components/file-handler/FileCombiner";
import { ProcessingPipeline } from "@/components/file-handler/ProcessingPipeline";
import { AIFileChat } from "@/components/ai/AIFileChat";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { URLScraper } from "@/components/url-scraper/URLScraper";
import { storage } from "@/lib/storage";

export function DesktopChatInterface() {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    files: [],
    generatedContent: null,
    isProcessing: false,
    currentStep: "initial",
    expectedFileCount: 0,
    documentName: "",
  });
  const [inputMessage, setInputMessage] = useState("");
  const [showFileUploader, setShowFileUploader] = useState(false);
  const [showURLScraper, setShowURLScraper] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ai = useAI();
  const fileHandler = useFileHandler();
  const settings = useSettings();

  // Load stored data on mount
  useEffect(() => {
    const storedMessages = storage.getMessages();
    fileHandler.loadStoredFiles();

    if (storedMessages.length > 0) {
      setChatState((prev) => ({ ...prev, messages: storedMessages }));
    } else {
      // Start with initial AI message
      const initialMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        type: "ai",
        content: `Hello! I'm your AI assistant for document compilation. I'll help you combine multiple files into a single markdown document.

To get started, please tell me:
1. What would you like to name your compiled document?
2. How many files do you plan to upload or add?

Once you provide this information, you can start uploading files, pasting content, or adding URLs to scrape. I'll wait until you've added all the files before compiling them into your final document.`,
        timestamp: Date.now(),
      };

      setChatState((prev) => ({ ...prev, messages: [initialMessage] }));
      storage.saveMessages([initialMessage]);
    }
  }, []);

  // Sync files with chat state
  useEffect(() => {
    setChatState((prev) => ({ ...prev, files: fileHandler.files }));
  }, [fileHandler.files]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatState.messages]);

  // Save messages when they change
  useEffect(() => {
    if (chatState.messages.length > 0) {
      storage.saveMessages(chatState.messages);
    }
  }, [chatState.messages]);

  const addMessage = (message: Omit<ChatMessage, "id" | "timestamp">) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    setChatState((prev) => ({
      ...prev,
      messages: [...prev.messages, newMessage],
    }));
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !ai.isReady) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");

    // Add user message
    addMessage({
      type: "user",
      content: userMessage,
    });

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: `loading_${Date.now()}`,
      type: "ai",
      content: "",
      timestamp: Date.now(),
      isLoading: true,
    };

    setChatState((prev) => ({
      ...prev,
      messages: [...prev.messages, loadingMessage],
    }));

    try {
      let context = "";

      // Check if user is providing document info
      if (chatState.currentStep === "initial") {
        // Parse document name and file count from message
        const nameMatch = userMessage.match(/name[:\s]+([^\n,]+)/i);
        const countMatch = userMessage.match(/(\d+)\s*files?/i);

        if (nameMatch && countMatch) {
          const docName = nameMatch[1].trim();
          const fileCount = parseInt(countMatch[1]);

          setChatState((prev) => ({
            ...prev,
            documentName: docName,
            expectedFileCount: fileCount,
            currentStep: "collecting_files",
          }));

          context = `Document name: ${docName}, Expected files: ${fileCount}`;
        }
      }

      // Add current files context if any
      if (fileHandler.files.length > 0) {
        context += `\nCurrent files uploaded: ${fileHandler.files.length}/${chatState.expectedFileCount}`;
        context += `\nFiles: ${fileHandler.files.map((f) => f.name).join(", ")}`;
      }

      const response = await ai.handleUserMessage(userMessage, context);

      // Remove loading message and add actual response
      setChatState((prev) => ({
        ...prev,
        messages: prev.messages.map((msg) =>
          msg.id === loadingMessage.id
            ? { ...msg, content: response, isLoading: false }
            : msg,
        ),
      }));
    } catch (error) {
      // Remove loading message and add error
      setChatState((prev) => ({
        ...prev,
        messages: prev.messages.map((msg) =>
          msg.id === loadingMessage.id
            ? {
                ...msg,
                content: "Sorry, I encountered an error. Please try again.",
                isLoading: false,
              }
            : msg,
        ),
      }));
    }
  };

  const handleGenerateDocument = async () => {
    if (!ai.isReady || fileHandler.files.length === 0) return;

    setChatState((prev) => ({ ...prev, isProcessing: true }));

    try {
      const filesForCompilation = fileHandler.getFilesForCompilation();
      const content = await ai.processFiles(
        filesForCompilation,
        chatState.documentName || "Compiled Document",
      );

      setChatState((prev) => ({
        ...prev,
        generatedContent: {
          id: `gen_${Date.now()}`,
          content,
          timestamp: Date.now(),
          isCondensed: false,
          showAsMarkdown: true,
        },
        currentStep: "generated",
        isProcessing: false,
      }));

      // Add success message
      addMessage({
        type: "ai",
        content: `Great! I've compiled all ${fileHandler.files.length} files into your document "${chatState.documentName || "Compiled Document"}". You can now download it or copy the content below.`,
      });
    } catch (error) {
      setChatState((prev) => ({ ...prev, isProcessing: false }));
      addMessage({
        type: "ai",
        content:
          "Sorry, I encountered an error while generating the document. Please try again.",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const canGenerate =
    ai.isReady &&
    fileHandler.files.length > 0 &&
    fileHandler.files.length >= chatState.expectedFileCount &&
    chatState.documentName;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r border-border bg-chat-surface flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold gradient-text">
              AI Chat Docs
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={settings.openSettings}
              className="text-muted-foreground hover:text-foreground"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* Status */}
          <div className="text-xs text-muted-foreground">
            {chatState.documentName && (
              <div>Document: {chatState.documentName}</div>
            )}
            <div>
              Files: {fileHandler.files.length}
              {chatState.expectedFileCount > 0 &&
                ` / ${chatState.expectedFileCount}`}
            </div>
            <div
              className={cn(
                "mt-1",
                ai.isReady ? "text-status-success" : "text-status-warning",
              )}
            >
              {ai.isReady ? "AI Ready" : "Configure AI Service"}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 space-y-2">
          <Button
            onClick={() => setShowFileUploader(!showFileUploader)}
            variant="outline"
            size="sm"
            className="w-full justify-start"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
          </Button>

          <Button
            onClick={fileHandler.openFolderDialog}
            variant="outline"
            size="sm"
            className="w-full justify-start"
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Upload Folder
          </Button>

          <Button
            onClick={() => setShowURLScraper(!showURLScraper)}
            variant="outline"
            size="sm"
            className="w-full justify-start"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add URL
          </Button>

          {canGenerate && (
            <Button
              onClick={handleGenerateDocument}
              disabled={chatState.isProcessing}
              className="w-full bg-chat-primary hover:bg-chat-primary/90"
            >
              <FileText className="w-4 h-4 mr-2" />
              {chatState.isProcessing ? "Generating..." : "Generate Document"}
            </Button>
          )}

          {fileHandler.files.length > 0 && (
            <Button
              onClick={fileHandler.clearAllFiles}
              variant="destructive"
              size="sm"
              className="w-full justify-start"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Files
            </Button>
          )}
        </div>

        {/* File Uploader */}
        {showFileUploader && (
          <div className="px-4 pb-4">
            <FileUploader
              onFilesAdded={fileHandler.addFiles}
              onTextAdded={fileHandler.addTextContent}
              dragOver={fileHandler.dragOver}
              onDragOver={fileHandler.handleDragOver}
              onDragLeave={fileHandler.handleDragLeave}
              onDrop={fileHandler.handleDrop}
              isProcessing={fileHandler.isProcessing}
            />
          </div>
        )}

        {/* URL Scraper */}
        {showURLScraper && (
          <div className="px-4 pb-4">
            <URLScraper
              onUrlAdded={fileHandler.addScrapedUrl}
              isProcessing={fileHandler.isProcessing}
              onClose={() => setShowURLScraper(false)}
            />
          </div>
        )}

        <Separator />

        {/* File List */}
        <div className="flex-1 min-h-0">
          <FileList
            files={fileHandler.files}
            uploadProgress={fileHandler.uploadProgress}
            onFileRemove={fileHandler.removeFile}
            onFileUpdate={fileHandler.updateFile}
            onFileToggle={fileHandler.toggleFileExpansion}
          />
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileHandler.fileInputRef}
          type="file"
          multiple
          accept=".md,.mdx,.txt,.js,.ts,.jsx,.tsx,.py,.html,.css,.json,.yml,.yaml,.doc,.docx"
          onChange={fileHandler.handleFileInputChange}
          className="hidden"
        />
        <input
          ref={fileHandler.folderInputRef}
          type="file"
          /* @ts-ignore */
          webkitdirectory=""
          directory=""
          multiple
          onChange={fileHandler.handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {chatState.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {/* Generated Content */}
            {chatState.generatedContent && (
              <GeneratedContent
                content={chatState.generatedContent}
                onCondense={ai.condenseContent}
                documentName={chatState.documentName}
              />
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  !ai.isReady
                    ? "Configure AI service in settings first..."
                    : chatState.currentStep === "initial"
                      ? "Tell me the document name and number of files..."
                      : "Type your message..."
                }
                disabled={!ai.isReady || ai.isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || !ai.isReady || ai.isLoading}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {ai.error && (
              <div className="mt-2 text-sm text-status-error">{ai.error}</div>
            )}

            {fileHandler.error && (
              <div className="mt-2 text-sm text-status-error">
                {fileHandler.error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={settings.isOpen}
        onClose={settings.closeSettings}
        settings={settings.settings}
        onUpdateSetting={settings.updateSetting}
        onResetSettings={settings.resetSettings}
        onToggleTheme={settings.toggleTheme}
        ai={ai}
      />
    </div>
  );
}
