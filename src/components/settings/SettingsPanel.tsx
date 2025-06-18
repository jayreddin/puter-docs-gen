import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppSettings } from "@/types";
import { useGemini } from "@/hooks/useGemini";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => void;
  onResetSettings: () => void;
  onToggleTheme: () => void;
  gemini: ReturnType<typeof useGemini>;
}

export function SettingsPanel({
  isOpen,
  onClose,
  settings,
  onUpdateSetting,
  onResetSettings,
  onToggleTheme,
  gemini,
}: SettingsPanelProps) {
  const [apiKey, setApiKey] = useState(settings.apiKey || "");
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleApiKeyTest = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }

    setIsTestingKey(true);
    try {
      await gemini.setApiKey(apiKey);
      if (gemini.isReady) {
        onUpdateSetting("apiKey", apiKey);
        onUpdateSetting("isApiKeyValid", true);
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

  const handleRefreshModels = async () => {
    if (!gemini.isReady) {
      toast.error("Please set a valid API key first");
      return;
    }

    try {
      await gemini.refreshModels();
      toast.success("Models refreshed successfully!");
    } catch (error) {
      toast.error("Failed to refresh models");
    }
  };

  const handleModelChange = (modelName: string) => {
    gemini.switchModel(modelName);
    onUpdateSetting("selectedModel", modelName);
    toast.success(`Switched to ${modelName}`);
  };

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    onUpdateSetting("theme", theme);
  };

  const handleReset = () => {
    if (resetConfirm) {
      onResetSettings();
      setApiKey("");
      setResetConfirm(false);
      toast.success("Settings reset successfully!");
    } else {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 5000);
    }
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

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.settings) {
          // Import settings except API key for security
          Object.entries(data.settings).forEach(([key, value]) => {
            if (key !== "apiKey" && key in settings) {
              onUpdateSetting(key as keyof AppSettings, value as any);
            }
          });
          toast.success("Settings imported successfully!");
        }
      } catch (error) {
        toast.error("Invalid settings file");
      }
    };
    reader.readAsText(file);
  };

  const handleExportSettings = () => {
    const exportData = {
      settings: { ...settings, apiKey: "" }, // Don't export API key
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-chat-settings-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Settings exported!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="api" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="api">API & Models</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="data">Data & Export</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4">
            <TabsContent value="api" className="space-y-6">
              {/* API Key Section */}
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    <h3 className="font-medium">Google Gemini API Key</h3>
                    {settings.isApiKeyValid && (
                      <Badge variant="outline" className="text-status-success">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Valid
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="apiKey">API Key</Label>
                      <div className="flex gap-2 mt-1">
                        <div className="relative flex-1">
                          <Input
                            id="apiKey"
                            type={showApiKey ? "text" : "password"}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Enter your Gemini API key..."
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
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
                        >
                          {isTestingKey ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Test & Save"
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
                      <p>
                        Get your API key from{" "}
                        <a
                          href="https://makersuite.google.com/app/apikey"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-chat-primary hover:underline"
                        >
                          Google AI Studio
                        </a>
                        . Your key is stored locally and never shared.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Model Selection */}
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      <h3 className="font-medium">Model Selection</h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshModels}
                      disabled={!gemini.isReady || gemini.isLoading}
                    >
                      {gemini.isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Refresh
                    </Button>
                  </div>

                  <div>
                    <Label>Current Model</Label>
                    <Select
                      value={settings.selectedModel}
                      onValueChange={handleModelChange}
                      disabled={!gemini.isReady}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {gemini.availableModels.map((model) => (
                          <SelectItem key={model.name} value={model.name}>
                            <div>
                              <div className="font-medium">
                                {model.displayName}
                              </div>
                              {model.description && (
                                <div className="text-xs text-muted-foreground">
                                  {model.description}
                                </div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6">
              {/* Theme Settings */}
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    <h3 className="font-medium">Theme</h3>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
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
                        className="flex flex-col gap-2 h-auto py-4"
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
                      onClick={onToggleTheme}
                      className="flex items-center gap-2"
                    >
                      {getThemeIcon()}
                      Toggle
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
              {/* Data Management */}
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    <h3 className="font-medium">Data Management</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={handleExportSettings}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export Settings
                    </Button>

                    <div>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileImport}
                        className="hidden"
                        id="import-settings"
                      />
                      <Button
                        variant="outline"
                        onClick={() =>
                          document.getElementById("import-settings")?.click()
                        }
                        className="flex items-center gap-2 w-full"
                      >
                        <Upload className="w-4 h-4" />
                        Import Settings
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-status-warning" />
                      <h4 className="font-medium text-status-warning">
                        Danger Zone
                      </h4>
                    </div>

                    <Button
                      variant="destructive"
                      onClick={handleReset}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {resetConfirm
                        ? "Click again to confirm reset"
                        : "Reset All Settings"}
                    </Button>

                    {resetConfirm && (
                      <div className="text-xs text-status-warning bg-status-warning/10 p-2 rounded">
                        This will clear all settings including your API key.
                        Click the button again to confirm.
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Storage Info */}
              <Card className="p-4">
                <div className="space-y-4">
                  <h3 className="font-medium">Storage Information</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Settings are stored locally in your browser</p>
                    <p>• API keys are encrypted and never shared</p>
                    <p>• Session data (files, messages) is temporary</p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
