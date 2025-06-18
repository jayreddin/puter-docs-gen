import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Settings,
  Upload,
  FolderOpen,
  Send,
  Plus,
  FileText,
  Trash2,
  Menu,
  MessageSquare,
  Files,
  Globe,
  ArrowLeft,
  X,
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
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { URLScraper } from "@/components/url-scraper/URLScraper";
import { storage } from "@/lib/storage";

type MobileView = "chat" | "files" | "upload" | "url";

export function MobileChatInterface() {
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
  const [currentView, setCurrentView] = useState<MobileView>("chat");
  const [showSettings, setShowSettings] = useState(false);

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
    if (currentView === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatState.messages, currentView]);

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

      // Switch to chat view to see result
      setCurrentView("chat");

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

  // Mobile Header Component
  const MobileHeader = () => (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {currentView !== "chat" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView("chat")}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <div className="text-xs text-muted-foreground">
              {chatState.documentName && (
                <span>{chatState.documentName} • </span>
              )}
              {fileHandler.files.length} files •{" "}
              <span
                className={
                  ai.isReady ? "text-status-success" : "text-status-warning"
                }
              >
                {ai.isReady ? "AI Ready" : "Configure AI Service"}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(true)}
            className="p-2"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );

  // Mobile Bottom Navigation
  const MobileBottomNav = () => (
    <div className="sticky bottom-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border">
      <div className="flex items-center justify-around p-2">
        <Button
          variant={currentView === "chat" ? "default" : "ghost"}
          size="sm"
          onClick={() => setCurrentView("chat")}
          className="flex-1 flex-col gap-1 h-auto py-2"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-xs">Chat</span>
        </Button>

        <Button
          variant={currentView === "files" ? "default" : "ghost"}
          size="sm"
          onClick={() => setCurrentView("files")}
          className="flex-1 flex-col gap-1 h-auto py-2 relative"
        >
          <Files className="w-4 h-4" />
          <span className="text-xs">Files</span>
          {fileHandler.files.length > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs flex items-center justify-center">
              {fileHandler.files.length}
            </Badge>
          )}
        </Button>

        <Button
          variant={currentView === "upload" ? "default" : "ghost"}
          size="sm"
          onClick={() => setCurrentView("upload")}
          className="flex-1 flex-col gap-1 h-auto py-2"
        >
          <Upload className="w-4 h-4" />
          <span className="text-xs">Upload</span>
        </Button>

        <Button
          variant={currentView === "url" ? "default" : "ghost"}
          size="sm"
          onClick={() => setCurrentView("url")}
          className="flex-1 flex-col gap-1 h-auto py-2"
        >
          <Globe className="w-4 h-4" />
          <span className="text-xs">URL</span>
        </Button>
      </div>
    </div>
  );

  // Chat View Content
  const ChatViewContent = () => (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 pb-20">
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

      {/* Fixed Generate Button */}
      {canGenerate && currentView === "chat" && (
        <div className="absolute bottom-20 left-4 right-4 z-40">
          <Button
            onClick={handleGenerateDocument}
            disabled={chatState.isProcessing}
            className="w-full bg-chat-primary hover:bg-chat-primary/90 shadow-lg"
            size="lg"
          >
            <FileText className="w-5 h-5 mr-2" />
            {chatState.isProcessing ? "Generating..." : "Generate Document"}
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="sticky bottom-16 bg-background/95 backdrop-blur p-4 border-t border-border">
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
            className="flex-1 h-12"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || !ai.isReady || ai.isLoading}
            size="icon"
            className="h-12 w-12"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>

        {(ai.error || fileHandler.error) && (
          <div className="mt-2 text-sm text-status-error">
            {ai.error || fileHandler.error}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-background">
      <MobileHeader />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {currentView === "chat" && <ChatViewContent />}

        {currentView === "files" && (
          <div className="h-full p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Files</h2>
              {fileHandler.files.length > 0 && (
                <Button
                  onClick={fileHandler.clearAllFiles}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
            <FileList
              files={fileHandler.files}
              uploadProgress={fileHandler.uploadProgress}
              onFileRemove={fileHandler.removeFile}
              onFileUpdate={fileHandler.updateFile}
              onFileToggle={fileHandler.toggleFileExpansion}
            />
          </div>
        )}

        {currentView === "upload" && (
          <div className="h-full p-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">Upload Files</h2>
              <div className="flex gap-2 mb-4">
                <Button
                  onClick={fileHandler.openFileDialog}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Files
                </Button>
                <Button
                  onClick={fileHandler.openFolderDialog}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Folder
                </Button>
              </div>
            </div>
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

        {currentView === "url" && (
          <div className="h-full p-4">
            <h2 className="text-lg font-semibold mb-4">Add URL Content</h2>
            <URLScraper
              onUrlAdded={fileHandler.addScrapedUrl}
              isProcessing={fileHandler.isProcessing}
              onClose={() => setCurrentView("chat")}
            />
          </div>
        )}
      </div>

      <MobileBottomNav />

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

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings.settings}
        onUpdateSetting={settings.updateSetting}
        onResetSettings={settings.resetSettings}
        onToggleTheme={settings.toggleTheme}
        ai={ai}
      />
    </div>
  );
}
