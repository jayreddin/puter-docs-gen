import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Settings,
  Upload,
  Send,
  Plus,
  FileText,
  MessageSquare,
  Files,
  Globe,
  ArrowLeft,
  Brain,
  Combine,
  Zap,
  BarChart3,
  Eye,
  Lightbulb,
  Network,
  Menu,
  AlertCircle,
  CheckCircle,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage, ChatState, UploadedFile } from "@/types";
import { useAI } from "@/hooks/useAI";
import { useFileHandler } from "@/hooks/useFileHandler";
import { useSettings } from "@/hooks/useSettings";
import { useFileExtraction } from "@/hooks/useFileExtraction";
import { useEnhancedAI } from "@/hooks/useEnhancedAI";
import { MessageBubble } from "./MessageBubble";
import { GeneratedContent } from "./GeneratedContent";
import { FileList } from "@/components/file-handler/FileList";
import { FileUploader } from "@/components/file-handler/FileUploader";
import { FileCombiner } from "@/components/file-handler/FileCombiner";
import { ProcessingPipeline } from "@/components/file-handler/ProcessingPipeline";
import { FileAnalyzer } from "@/components/file-handler/FileAnalyzer";
import { AIFileChat } from "@/components/ai/AIFileChat";
import { AIServiceErrorAlert } from "@/components/ai/AIServiceErrorAlert";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { URLScraper } from "@/components/url-scraper/URLScraper";
import { storage } from "@/lib/storage";

type MobileView =
  | "chat"
  | "files"
  | "upload"
  | "url"
  | "analyze"
  | "combine"
  | "pipeline"
  | "ai-chat";

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
  const [selectedFileForAnalysis, setSelectedFileForAnalysis] = useState<
    string | undefined
  >();
  const [aiServiceError, setAiServiceError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ai = useAI();
  const fileHandler = useFileHandler();
  const settings = useSettings();
  const fileExtraction = useFileExtraction();
  const enhancedAI = useEnhancedAI();

  // Load stored data on mount
  useEffect(() => {
    const storedMessages = storage.getMessages();
    fileHandler.loadStoredFiles();

    if (storedMessages.length > 0) {
      setChatState((prev) => ({ ...prev, messages: storedMessages }));
    } else {
      // Start with enhanced initial AI message
      const initialMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        type: "ai",
        content: `Hello! I'm your AI assistant for document processing and analysis. I can help you:

📁 **Manage Files**: Upload, organize, and combine multiple documents
🧠 **AI Analysis**: Analyze content, extract insights, and identify relationships
🔄 **Smart Processing**: Automated pipelines for text extraction and combination
💬 **File Chat**: Ask questions about your documents with full context

**Quick Start:**
1. Upload files using the Files tab
2. Use AI Chat to ask questions about your documents
3. Try the Analyzer for AI-powered insights
4. Use the Combiner to merge files intelligently

What would you like to do first?`,
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

  // Generate AI insights when files change
  useEffect(() => {
    if (fileHandler.files.length > 0 && enhancedAI.aiInsights.length === 0) {
      enhancedAI.generateInsights(fileHandler.files).catch((error) => {
        console.error("AI insights generation failed:", error);
        if (error instanceof Error) {
          setAiServiceError(error.message);
        }
      });
    }
  }, [fileHandler.files.length]);

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
      // Use enhanced message handling with file context
      const response = await ai.handleUserMessageWithFiles(
        userMessage,
        fileHandler.files.map((f) => ({ name: f.name, content: f.content })),
      );

      // Update loading message with response
      setChatState((prev) => ({
        ...prev,
        messages: prev.messages.map((msg) =>
          msg.id === loadingMessage.id
            ? {
                ...msg,
                content: response,
                isLoading: false,
                attachedFiles: fileHandler.files.map((f) => f.id),
                contextSummary:
                  fileHandler.files.length > 0
                    ? `Context from ${fileHandler.files.length} file${fileHandler.files.length > 1 ? "s" : ""}: ${fileHandler.files.map((f) => f.name).join(", ")}`
                    : undefined,
              }
            : msg,
        ),
      }));
      } catch (error) {
        console.error("Message handling failed:", error);

        // Set AI service error for the error alert
        if (error instanceof Error) {
          setAiServiceError(error.message);
        }

        // Update loading message with error
        setChatState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === loadingMessage.id
              ? {
                  ...msg,
                  content:
                    "Sorry, I encountered an error processing your request. Please check the AI service status below.",
                  isLoading: false,
                }
              : msg,
          ),
        }));

        toast.error(
          error instanceof Error ? error.message : "Failed to get AI response",
        );
      }
  };

  const getStatusInfo = () => {
    const fileCount = fileHandler.files.length;
    const isProcessing = fileExtraction.isProcessing || enhancedAI.isLoading;
    const serviceStatus = ai.isReady ? "AI Ready" : "AI Not Ready";

    return {
      fileCount,
      isProcessing,
      serviceStatus,
      hasInsights: enhancedAI.aiInsights.length > 0,
      hasCombination: !!fileExtraction.combinationResult,
      hasPipeline: !!fileExtraction.currentPipeline,
    };
  };

  const status = getStatusInfo();

  // Mobile Bottom Navigation
  const renderBottomNavigation = () => (
    <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="grid grid-cols-4 gap-1 p-2">
        {/* Chat Tab */}
        <Button
          variant={currentView === "chat" ? "default" : "ghost"}
          size="sm"
          onClick={() => setCurrentView("chat")}
          className="flex flex-col gap-1 h-auto py-2"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-xs">Chat</span>
          {status.isProcessing && (
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
          )}
        </Button>

        {/* Files Tab */}
        <Button
          variant={
            ["files", "upload", "url"].includes(currentView)
              ? "default"
              : "ghost"
          }
          size="sm"
          onClick={() => setCurrentView("files")}
          className="flex flex-col gap-1 h-auto py-2"
        >
          <Files className="w-4 h-4" />
          <span className="text-xs">Files</span>
          {status.fileCount > 0 && (
            <Badge variant="secondary" className="text-xs h-4 px-1">
              {status.fileCount}
            </Badge>
          )}
        </Button>

        {/* AI Tools Tab */}
        <Button
          variant={
            ["analyze", "combine", "pipeline", "ai-chat"].includes(currentView)
              ? "default"
              : "ghost"
          }
          size="sm"
          onClick={() => setCurrentView("analyze")}
          className="flex flex-col gap-1 h-auto py-2"
        >
          <Brain className="w-4 h-4" />
          <span className="text-xs">AI Tools</span>
          {status.hasInsights && (
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
          )}
        </Button>

        {/* Settings Tab */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
          className="flex flex-col gap-1 h-auto py-2"
        >
          <Settings className="w-4 h-4" />
          <span className="text-xs">Settings</span>
          {!ai.isReady && (
            <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
          )}
        </Button>
      </div>
    </div>
  );

  // Chat View
  const renderChatView = () => {
    const providerInfo = ai.getCurrentProviderInfo();

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <h1 className="text-lg font-semibold">AI Chat</h1>
            {providerInfo.isActive ? (
              <div className="flex items-center gap-1">
                <Badge variant="default" className="text-xs">
                  {providerInfo.provider}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {providerInfo.model}
                </Badge>
              </div>
            ) : (
              <Badge variant="secondary" className="text-xs">
                {status.serviceStatus}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {status.fileCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {status.fileCount} files
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (confirm("Clear all files and reset the app? This cannot be undone.")) {
                  settings.resetApp();
                }
              }}
              className="h-8 w-8"
              title="Clear/New - Reset app and clear all files"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      );
    };

      {/* AI Service Error Alert */}
      {aiServiceError && (
        <div className="m-4 mb-0">
          <AIServiceErrorAlert
            error={aiServiceError}
            currentService={ai.selectedService}
            onSwitchService={(service) => {
              ai.switchService(service);
              setAiServiceError(null);
              toast.success(`Switched to ${service === "puter" ? "Puter AI" : "Gemini AI"}`);
            }}
            onOpenSettings={() => setShowSettings(true)}
            onRetry={() => {
              setAiServiceError(null);
              if (fileHandler.files.length > 0) {
                enhancedAI.generateInsights(fileHandler.files).catch((error) => {
                  if (error instanceof Error) {
                    setAiServiceError(error.message);
                  }
                });
              }
            }}
          />
        </div>
      )}

      {/* AI Insights Banner */}
      {!aiServiceError && enhancedAI.aiInsights.length > 0 && (
        <Alert className="m-4 mb-0">
          <Lightbulb className="w-4 h-4" />
          <AlertDescription>
            <div className="space-y-1">
              {enhancedAI.aiInsights.slice(0, 2).map((insight, index) => (
                <p key={index} className="text-sm">
                  {insight}
                </p>
              ))}
              {enhancedAI.aiInsights.length > 2 && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => setCurrentView("analyze")}
                >
                  View all insights →
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {chatState.messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-background/95 backdrop-blur">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              !ai.isReady
                ? "Configure AI settings first..."
                : status.fileCount === 0
                  ? "Upload files to chat about them..."
                  : "Ask about your files..."
            }
            disabled={!ai.isReady}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputMessage.trim() || !ai.isReady}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );

  // Files View with sub-tabs
  const renderFilesView = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <h1 className="text-lg font-semibold">File Manager</h1>
        <Badge variant="outline">{status.fileCount} files</Badge>
      </div>

      {/* Sub-tabs */}
      <Tabs defaultValue="list" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            List
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="url" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="flex-1 mt-4">
          <FileList
            files={fileHandler.files}
            uploadProgress={fileHandler.uploadProgress}
            onFileRemove={fileHandler.removeFile}
            onFileUpdate={fileHandler.updateFile}
            onFileToggle={fileHandler.toggleFileExpansion}
          />
        </TabsContent>

        <TabsContent value="upload" className="flex-1 mt-4">
          <FileUploader
            onFilesAdded={fileHandler.addFiles}
            onTextAdded={fileHandler.addTextContent}
            dragOver={fileHandler.dragOver}
            onDragOver={fileHandler.handleDragOver}
            onDragLeave={fileHandler.handleDragLeave}
            onDrop={fileHandler.handleDrop}
            isProcessing={fileHandler.isProcessing}
          />
        </TabsContent>

        <TabsContent value="url" className="flex-1 mt-4">
          <URLScraper
            onUrlAdd={fileHandler.addScrapedUrl}
            isProcessing={fileHandler.isProcessing}
          />
        </TabsContent>
      </Tabs>
    </div>
  );

  // AI Tools View with sub-tabs
  const renderAIToolsView = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <h1 className="text-lg font-semibold">AI Tools</h1>
        <Badge variant={ai.isReady ? "default" : "secondary"}>
          {ai.selectedService}
        </Badge>
      </div>

      {/* Sub-tabs */}
      <Tabs defaultValue="chat" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 mx-4 mt-4">
          <TabsTrigger value="chat" className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            <span className="text-xs">Chat</span>
          </TabsTrigger>
          <TabsTrigger value="analyze" className="flex items-center gap-1">
            <Brain className="w-3 h-3" />
            <span className="text-xs">Analyze</span>
          </TabsTrigger>
          <TabsTrigger value="combine" className="flex items-center gap-1">
            <Combine className="w-3 h-3" />
            <span className="text-xs">Combine</span>
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span className="text-xs">Pipeline</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 mt-4">
          <div className="px-4">
            <AIFileChat
              files={fileHandler.files}
              onFileSelect={(fileIds) => setSelectedFileForAnalysis(fileIds[0])}
            />
          </div>
        </TabsContent>

        <TabsContent value="analyze" className="flex-1 mt-4">
          <div className="px-4">
            <FileAnalyzer
              files={fileHandler.files}
              selectedFileId={selectedFileForAnalysis}
              onAnalysisComplete={(analysis) => {
                toast.success("Analysis completed!");
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="combine" className="flex-1 mt-4">
          <div className="px-4">
            <FileCombiner
              files={fileHandler.files}
              onCombinationComplete={(result) => {
                toast.success(
                  `Combined ${result.metadata.filesProcessed} files successfully!`,
                );
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="flex-1 mt-4">
          <div className="px-4">
            <ProcessingPipeline
              files={fileHandler.files}
              onPipelineComplete={(pipeline) => {
                toast.success("Processing pipeline completed!");
              }}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  // Main content renderer
  const renderMainContent = () => {
    switch (currentView) {
      case "chat":
        return renderChatView();
      case "files":
      case "upload":
      case "url":
        return renderFilesView();
      case "analyze":
      case "combine":
      case "pipeline":
      case "ai-chat":
        return renderAIToolsView();
      default:
        return renderChatView();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">{renderMainContent()}</div>

      {/* Bottom Navigation */}
      {renderBottomNavigation()}

      {/* Settings Sheet */}
      <Sheet open={showSettings} onOpenChange={setShowSettings}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SettingsPanel onClose={() => setShowSettings(false)} />
        </SheetContent>
      </Sheet>

      {/* Processing Status Overlay */}
      {(fileExtraction.isProcessing || enhancedAI.isLoading) && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-80 mx-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fileExtraction.processingStatus.message && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {fileExtraction.processingStatus.message}
                  </p>
                  <Progress
                    value={fileExtraction.processingStatus.progress}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {fileExtraction.processingStatus.progress}% complete
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}