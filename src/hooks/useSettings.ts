import { useState, useCallback, useEffect } from "react";
import { AppSettings } from "@/types";
import { storage } from "@/lib/storage";

const DEFAULT_SETTINGS: AppSettings = {
  apiKey: "",
  selectedModel: "gpt-4.1", // Default Puter model
  selectedService: "puter",
  theme: "system",
  isApiKeyValid: false,
  isPuterConnected: false,
  availableModels: [],
  availablePuterModels: [],
  authStatus: {
    isSignedIn: false,
    connectionQuality: 'disconnected',
    retryCount: 0,
  },
  processingPreferences: {
    autoExtractText: true,
    autoAnalyzeFiles: true,
    combinationStrategy: 'smart',
    outputFormat: 'markdown',
    includeMetadata: true,
    preserveFormatting: true,
  },
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isOpen, setIsOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Load settings from storage on mount
  useEffect(() => {
    const stored = storage.getSettings();
    const theme = storage.getTheme();

    const loadedSettings: AppSettings = {
      ...DEFAULT_SETTINGS,
      ...stored,
      theme,
    };

    setSettings(loadedSettings);
    applyTheme(loadedSettings.theme);
  }, []);

  // Apply theme to document
  const applyTheme = useCallback((theme: "light" | "dark" | "system") => {
    const root = document.documentElement;

    if (theme === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      root.classList.toggle("dark", prefersDark);
      root.classList.toggle("light", !prefersDark);
    } else {
      root.classList.toggle("dark", theme === "dark");
      root.classList.toggle("light", theme === "light");
    }
  }, []);

  const updateSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      setSettings((prev) => {
        const updated = { ...prev, [key]: value };

        // Apply theme immediately if it's being changed
        if (key === "theme") {
          applyTheme(value as "light" | "dark" | "system");
          storage.saveTheme(value as "light" | "dark" | "system");
        }

        return updated;
      });

      setIsDirty(true);
    },
    [applyTheme],
  );

  const saveSettings = useCallback(() => {
    const { theme, ...settingsToSave } = settings;
    storage.saveSettings(settingsToSave);
    storage.saveTheme(theme);
    setIsDirty(false);
  }, [settings]);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    storage.clearAll();
    applyTheme("system");
    setIsDirty(false);
  }, [applyTheme]);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    storage.saveSettings(DEFAULT_SETTINGS);
    setIsDirty(false);
    applyTheme(DEFAULT_SETTINGS.theme);
  }, []);

  const resetApp = useCallback(() => {
    // Clear all storage
    storage.clearAll();
    // Reset to default settings
    setSettings(DEFAULT_SETTINGS);
    applyTheme(DEFAULT_SETTINGS.theme);
    // Reload the page to ensure clean state
    window.location.reload();
  }, []);
      saveSettings();
    }
    setIsOpen(false);
  }, [isDirty, saveSettings]);

  const toggleTheme = useCallback(() => {
    const newTheme = settings.theme === "dark" ? "light" : "dark";
    updateSetting("theme", newTheme);
    saveSettings();
  }, [settings.theme, updateSetting, saveSettings]);

  // Listen for system theme changes
  useEffect(() => {
    if (settings.theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      const handleChange = () => {
        if (settings.theme === "system") {
          applyTheme("system");
        }
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [settings.theme, applyTheme]);

  const getStorageInfo = useCallback(() => {
    return storage.getStorageInfo();
  }, []);

  const exportSettings = useCallback(() => {
    const exportData = {
      settings: { ...settings, apiKey: "" }, // Don't export API key for security
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
  }, [settings]);

  const importSettings = useCallback(
    (file: File) => {
      return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          try {
            const data = JSON.parse(reader.result as string);

            if (data.settings) {
              const importedSettings = {
                ...DEFAULT_SETTINGS,
                ...data.settings,
                apiKey: settings.apiKey, // Keep current API key
              };

              setSettings(importedSettings);
              setIsDirty(true);
              resolve();
            } else {
              reject(new Error("Invalid settings file format"));
            }
          } catch (error) {
            reject(new Error("Failed to parse settings file"));
          }
        };

        reader.onerror = () => {
          reject(new Error("Failed to read settings file"));
        };

        reader.readAsText(file);
      });
    },
    [settings.apiKey],
  );

  return {
    settings,
    isOpen,
    isDirty,
    updateSetting,
    saveSettings,
    resetSettings,
    openSettings,
    closeSettings,
    toggleTheme,
    getStorageInfo,
    exportSettings,
    importSettings,
  };
}