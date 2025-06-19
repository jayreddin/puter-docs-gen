import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Key,
  Palette,
  Database,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  Sun,
  Moon,
  Monitor,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  Settings,
  Brain,
  Zap,
  Shield,
  Users,
  Activity,
  X,
  Wifi,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProcessingPreferences, AuthStatus } from "@/types";
import { useAI } from "@/hooks/useAI";
import { useSettings } from "@/hooks/useSettings";
import { PuterDebugInfo } from "@/components/debug/PuterDebugInfo";
import { PuterAuthPrompt } from "@/components/puter/PuterAuthPrompt";

interface SettingsPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  settings?: any;
  onUpdateSetting?: (key: string, value: any) => void;
  onResetSettings?: () => void;
  onToggleTheme?: () => void;
  ai?: any;
}

export function SettingsPanel({
  isOpen,
  onClose,
  settings: externalSettings,
  onUpdateSetting,
  onResetSettings,
  onToggleTheme,
  ai: externalAI,
}: SettingsPanelProps) {
  const hookAI = useAI();
  const hookSettings = useSettings();

  // Use external props if provided, otherwise use hooks
  const ai = externalAI || hookAI;
  const settings = externalSettings || hookSettings.settings;
  const updateSetting = onUpdateSetting || hookSettings.updateSetting;
  const resetSettings = onResetSettings || hookSettings.resetSettings;
  const toggleTheme = onToggleTheme || hookSettings.toggleTheme;

  const [apiKey, setApiKey] = useState(settings.apiKey || "");
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [showPuterAuth, setShowPuterAuth] = useState(false);
  const [puterAuthStatus, setPuterAuthStatus] = useState<AuthStatus | null>(
    null,
  );
  const [processingPrefs, setProcessingPrefs] = useState<ProcessingPreferences>(
    settings.processingPreferences || {
      autoExtractText: true,
      autoAnalyzeFiles: true,
      combinationStrategy: "smart",
      outputFormat: "markdown",
      includeMetadata: true,
      preserveFormatting: true,
    },
  );
  const [pendingService, setPendingService] = useState<"gemini" | "puter">(
    ai.selectedService,
  );
  const [pendingModel, setPendingModel] = useState(ai.currentModel);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load Puter auth status on mount
  useEffect(() => {
    const loadAuthStatus = async () => {
      try {
        const status = await ai.getPuterAuthStatus();
        setPuterAuthStatus(status);
      } catch (error) {
        console.error("Failed to load auth status:", error);
      }
    };

    if (pendingService === "puter") {
      loadAuthStatus();
    }
  }, [pendingService, ai]);

  const handleApiKeyTest = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }

    setIsTestingKey(true);
    try {
      await ai.setApiKey(apiKey);
      if (ai.isGeminiReady) {
        updateSetting("apiKey", apiKey);
        updateSetting("isApiKeyValid", true);
        toast.success("API key is valid and saved!");
      } else {
        toast.error("Invalid API key");
      }
    } catch (error) {
      toast.error("Failed to validate API key");
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleServiceChange = (service: "gemini" | "puter") => {
    setPendingService(service);
    setHasUnsavedChanges(true);
  };

  const handleModelChange = (modelName: string) => {
    setPendingModel(modelName);
    setHasUnsavedChanges(true);
  };

  const handleSaveSettings = async () => {
    try {
      // Apply service change
      if (pendingService !== ai.selectedService) {
        ai.switchService(pendingService);
        updateSetting("selectedService", pendingService);

        if (pendingService === "puter") {
          // Load Puter auth status
          const status = await ai.getPuterAuthStatus();
          setPuterAuthStatus(status);
        }
      }

      // Apply model change
      if (pendingModel !== ai.currentModel) {
        ai.switchModel(pendingModel);
        updateSetting("selectedModel", pendingModel);
      }

      // Save processing preferences
      updateSetting("processingPreferences", processingPrefs);

      setHasUnsavedChanges(false);
      toast.success(
        `Settings saved! Now using ${pendingService === "puter" ? "Puter AI" : "Gemini AI"} with ${pendingModel}`,
      );
    } catch (error) {
      toast.error("Failed to save settings");
      console.error("Save settings error:", error);
    }
  };

  const handleDiscardChanges = () => {
    setPendingService(ai.selectedService);
    setPendingModel(ai.currentModel);
    setProcessingPrefs(
      settings.processingPreferences || {
        autoExtractText: true,
        autoAnalyzeFiles: true,
        combinationStrategy: "smart",
        outputFormat: "markdown",
        includeMetadata: true,
        preserveFormatting: true,
      },
    );
    setHasUnsavedChanges(false);
    toast.info("Changes discarded");
  };

  const handleRefreshModels = async () => {
    try {
      await ai.refreshModels();
      toast.success("Models refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh models");
    }
  };

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    updateSetting("theme", theme);
    // Apply theme logic would be handled by the theme provider
  };

  const handlePuterConnect = async () => {
    try {
      setIsTestingKey(true); // Reuse loading state
      await ai.connectToPuter();
      const status = await ai.getPuterAuthStatus();
      setPuterAuthStatus(status);
      toast.success("Connected to Puter successfully!");
    } catch (error) {
      console.error("Puter connection failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to connect to Puter";

      // Provide more helpful error messages
      if (
        errorMessage.includes("Sign-in was attempted but verification failed")
      ) {
        toast.error(
          "Sign-in failed. Please try closing any pop-ups and try again.",
        );
      } else if (errorMessage.includes("User not signed in")) {
        toast.error(
          "Please complete the sign-in process in the pop-up window.",
        );
      } else if (errorMessage.includes("SDK failed to load")) {
        toast.error(
          "Puter service unavailable. Please check your internet connection and refresh the page.",
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsTestingKey(false);
    }
  };

  const handlePuterSignOut = async () => {
    try {
      await ai.signOutPuter();
      setPuterAuthStatus(null);
      toast.success("Signed out from Puter successfully");
    } catch (error) {
      toast.error("Failed to sign out from Puter");
    }
  };

  const handleProcessingPrefChange = <K extends keyof ProcessingPreferences>(
    key: K,
    value: ProcessingPreferences[K],
  ) => {
    const newPrefs = { ...processingPrefs, [key]: value };
    setProcessingPrefs(newPrefs);
    setHasUnsavedChanges(true);
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ai-chat-docs-settings.json";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Settings exported successfully");
  };

  const getThemeIcon = () => {
    switch (settings.theme) {
      case "light":
        return <Sun className="w-4 h-4" />;
      case "dark":
        return <Moon className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getConnectionQualityIcon = (quality: string) => {
    switch (quality) {
      case "excellent":
        return <Wifi className="w-4 h-4 text-green-500" />;
      case "good":
        return <Wifi className="w-4 h-4 text-yellow-500" />;
      case "poor":
        return <WifiOff className="w-4 h-4 text-red-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-500" />;
    }
  };

  const panelContent = (
    <div className="flex flex-col h-full w-full max-w-lg mx-auto bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Settings</h2>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 touch-manipulation" // Better touch target
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Settings Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* Save/Discard Bar */}
          {hasUnsavedChanges && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium">
                    You have unsaved changes
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDiscardChanges}
                    className="h-9 px-3 touch-manipulation"
                  >
                    Discard
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveSettings}
                    className="h-9 px-3 touch-manipulation bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Save & Apply
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Tabs defaultValue="ai" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6 h-12 touch-manipulation">
              <TabsTrigger value="ai" className="flex items-center gap-2 h-10">
                <Brain className="w-4 h-4" />
                <span className="hidden sm:inline">AI</span>
              </TabsTrigger>
              <TabsTrigger
                value="processing"
                className="flex items-center gap-2 h-10"
              >
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Process</span>
              </TabsTrigger>
              <TabsTrigger
                value="appearance"
                className="flex items-center gap-2 h-10"
              >
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">Theme</span>
              </TabsTrigger>
              <TabsTrigger
                value="data"
                className="flex items-center gap-2 h-10"
              >
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Data</span>
              </TabsTrigger>
            </TabsList>

            {/* AI & Models Tab */}
            <TabsContent value="ai" className="space-y-6 mt-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    AI Service Selection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="service-select">Select AI Service</Label>
                    <Select
                      value={pendingService}
                      onValueChange={handleServiceChange}
                    >
                      <SelectTrigger
                        className="h-10 touch-manipulation mt-1"
                        id="service-select"
                      >
                        <SelectValue placeholder="Choose AI service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="puter">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full" />
                            <div>
                              <div className="font-medium">Puter AI</div>
                              <div className="text-xs text-muted-foreground">
                                Free with account • Multiple models
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="gemini">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <div>
                              <div className="font-medium">Google Gemini</div>
                              <div className="text-xs text-muted-foreground">
                                Requires API key • High quality
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Service Status */}
                  <div className="p-4 bg-muted/50 rounded-lg touch-manipulation">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Service Status
                      </span>
                      <Badge
                        variant={
                          (
                            pendingService === "gemini"
                              ? ai.isGeminiReady
                              : ai.isPuterReady
                          )
                            ? "default"
                            : "secondary"
                        }
                        className="px-3 py-1"
                      >
                        {(
                          pendingService === "gemini"
                            ? ai.isGeminiReady
                            : ai.isPuterReady
                        )
                          ? "Ready"
                          : "Not Ready"}
                      </Badge>
                    </div>

                    {pendingService === "puter" && puterAuthStatus && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          {getConnectionQualityIcon(
                            puterAuthStatus.connectionQuality,
                          )}
                          <span className="text-sm capitalize">
                            {puterAuthStatus.connectionQuality} connection
                          </span>
                        </div>
                        {puterAuthStatus.username && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-500" />
                            <span className="text-sm">
                              Signed in as {puterAuthStatus.username}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Gemini API Configuration */}
              {pendingService === "gemini" && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Gemini API Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="api-key">API Key</Label>
                      <div className="flex gap-2 mt-1">
                        <div className="relative flex-1">
                          <Input
                            id="api-key"
                            type={showApiKey ? "text" : "password"}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Enter your Gemini API key..."
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <Button
                          onClick={handleApiKeyTest}
                          disabled={!apiKey.trim() || isTestingKey}
                          className="flex items-center gap-2"
                        >
                          {isTestingKey ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : ai.isGeminiReady ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Key className="w-4 h-4" />
                          )}
                          {isTestingKey ? "Testing..." : "Test"}
                        </Button>
                      </div>
                    </div>

                    {ai.error && (
                      <Alert>
                        <AlertTriangle className="w-4 h-4" />
                        <AlertDescription>{ai.error}</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Puter Authentication */}
              {pendingService === "puter" && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Puter Authentication
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!ai.isPuterReady ? (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Connect to Puter to access free AI models and cloud
                          storage.
                        </p>
                        <Button
                          onClick={handlePuterConnect}
                          disabled={ai.isLoading || isTestingKey}
                          className="w-full flex items-center gap-2 touch-manipulation h-10"
                        >
                          {ai.isLoading || isTestingKey ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Shield className="w-4 h-4" />
                          )}
                          {ai.isLoading || isTestingKey
                            ? "Connecting..."
                            : "Connect to Puter"}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800 dark:text-green-200">
                              Connected to Puter
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePuterSignOut}
                            className="h-8 text-xs"
                          >
                            Sign Out
                          </Button>
                        </div>
                      </div>
                    )}

                    {ai.error && (
                      <Alert>
                        <AlertTriangle className="w-4 h-4" />
                        <AlertDescription>{ai.error}</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Model Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Model Selection
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefreshModels}
                      className="ml-auto h-8 w-8 p-0"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="model-select">AI Model</Label>
                    <Select
                      value={pendingModel}
                      onValueChange={handleModelChange}
                    >
                      <SelectTrigger
                        className="h-10 touch-manipulation mt-1"
                        id="model-select"
                      >
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {(pendingService === "gemini"
                          ? ai.availableModels
                          : ai.availablePuterModels
                        ).map((model) => (
                          <SelectItem key={model.name} value={model.name}>
                            <div className="flex flex-col items-start">
                              <span className="font-medium">
                                {model.displayName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {model.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Processing Tab */}
            <TabsContent value="processing" className="space-y-6 mt-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Default Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>File combination strategy</Label>
                    <Select
                      value={processingPrefs.combinationStrategy}
                      onValueChange={(
                        value: "smart" | "chronological" | "manual",
                      ) =>
                        handleProcessingPrefChange("combinationStrategy", value)
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="smart">
                          Smart (AI-optimized)
                        </SelectItem>
                        <SelectItem value="chronological">
                          Chronological order
                        </SelectItem>
                        <SelectItem value="manual">Manual order</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Default output format</Label>
                    <Select
                      value={processingPrefs.outputFormat}
                      onValueChange={(value: "markdown" | "html" | "text") =>
                        handleProcessingPrefChange("outputFormat", value)
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="markdown">Markdown</SelectItem>
                        <SelectItem value="html">HTML</SelectItem>
                        <SelectItem value="text">Plain Text</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-extract">Auto-extract text</Label>
                      <Switch
                        id="auto-extract"
                        checked={processingPrefs.autoExtractText}
                        onCheckedChange={(checked) =>
                          handleProcessingPrefChange("autoExtractText", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-analyze">Auto-analyze files</Label>
                      <Switch
                        id="auto-analyze"
                        checked={processingPrefs.autoAnalyzeFiles}
                        onCheckedChange={(checked) =>
                          handleProcessingPrefChange(
                            "autoAnalyzeFiles",
                            checked,
                          )
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="include-metadata">Include metadata</Label>
                      <Switch
                        id="include-metadata"
                        checked={processingPrefs.includeMetadata}
                        onCheckedChange={(checked) =>
                          handleProcessingPrefChange("includeMetadata", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="preserve-formatting">
                        Preserve formatting
                      </Label>
                      <Switch
                        id="preserve-formatting"
                        checked={processingPrefs.preserveFormatting}
                        onCheckedChange={(checked) =>
                          handleProcessingPrefChange(
                            "preserveFormatting",
                            checked,
                          )
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-6 mt-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Theme Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Theme Mode</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {[
                        { value: "light", label: "Light", icon: Sun },
                        { value: "dark", label: "Dark", icon: Moon },
                        { value: "system", label: "System", icon: Monitor },
                      ].map(({ value, label, icon: Icon }) => (
                        <Button
                          key={value}
                          variant={
                            settings.theme === value ? "default" : "outline"
                          }
                          className="flex flex-col gap-2 h-16 py-4 touch-manipulation"
                          onClick={() =>
                            handleThemeChange(
                              value as "light" | "dark" | "system",
                            )
                          }
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-sm">{label}</span>
                        </Button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="quick-toggle">Quick Theme Toggle</Label>
                      <Button
                        id="quick-toggle"
                        variant="outline"
                        size="sm"
                        onClick={toggleTheme}
                        className="flex items-center gap-2"
                      >
                        {getThemeIcon()}
                        Toggle
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data & Export Tab */}
            <TabsContent value="data" className="space-y-6 mt-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Data Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Export Settings</Label>
                      <p className="text-xs text-muted-foreground">
                        Download your current settings configuration
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportSettings}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Reset All Settings</Label>
                      <p className="text-xs text-muted-foreground">
                        This will reset all settings to their default values
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (resetConfirm) {
                          resetSettings();
                          setResetConfirm(false);
                          toast.success("Settings reset successfully");
                        } else {
                          setResetConfirm(true);
                          setTimeout(() => setResetConfirm(false), 3000);
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {resetConfirm ? "Confirm Reset" : "Reset"}
                    </Button>
                  </div>

                  {resetConfirm && (
                    <Alert>
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription>
                        Click "Confirm Reset" again to permanently reset all
                        settings. This action cannot be undone.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Debug Information */}
              {pendingService === "puter" && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Debug Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PuterDebugInfo />
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      {/* Bottom Save Bar for Mobile */}
      {hasUnsavedChanges && (
        <div className="border-t bg-background/95 backdrop-blur p-4">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleDiscardChanges}
              className="flex-1 h-12 touch-manipulation"
            >
              Discard Changes
            </Button>
            <Button
              onClick={handleSaveSettings}
              className="flex-1 h-12 touch-manipulation bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Save & Apply
            </Button>
          </div>
        </div>
      )}

      {/* Puter Auth Modal */}
      {showPuterAuth && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-md mx-4">
            <PuterAuthPrompt
              onSuccess={() => {
                setShowPuterAuth(false);
                ai.getPuterAuthStatus().then(setPuterAuthStatus);
                toast.success("Successfully connected to Puter!");
              }}
              onCancel={() => setShowPuterAuth(false)}
            />
          </div>
        </div>
      )}
    </div>
  );

  // If isOpen prop is provided, wrap in Dialog
  if (isOpen !== undefined) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
          <DialogTitle className="sr-only">Settings</DialogTitle>
          <div className="flex flex-col h-full max-h-[90vh]">
            {panelContent}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Otherwise return panel content directly
  return panelContent;
}
