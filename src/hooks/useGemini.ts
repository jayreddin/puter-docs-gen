import { useState, useCallback, useEffect } from "react";
import { geminiService } from "@/lib/gemini";
import { GeminiModel } from "@/types";
import { storage } from "@/lib/storage";

export function useGemini() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [availableModels, setAvailableModels] = useState<GeminiModel[]>([]);
  const [currentModel, setCurrentModel] = useState("gemini-1.5-flash");

  // Initialize with stored settings
  useEffect(() => {
    const settings = storage.getSettings();
    if (settings.apiKey) {
      geminiService.setApiKey(settings.apiKey);
      setIsReady(true);

      if (settings.selectedModel) {
        setCurrentModel(settings.selectedModel);
        geminiService.setModel(settings.selectedModel);
      }

      if (settings.availableModels) {
        setAvailableModels(settings.availableModels);
      }
    }
  }, []);

  const setApiKey = useCallback(async (apiKey: string) => {
    setIsLoading(true);
    setError(null);

    try {
      geminiService.setApiKey(apiKey);
      const isValid = await geminiService.testApiKey();

      if (isValid) {
        setIsReady(true);
        storage.saveSettings({ apiKey, isApiKeyValid: true });

        // Fetch available models
        const models = await geminiService.getAvailableModels();
        setAvailableModels(models);
        storage.saveSettings({ availableModels: models });
      } else {
        setIsReady(false);
        setError("Invalid API key. Please check your key and try again.");
        storage.saveSettings({ isApiKeyValid: false });
      }
    } catch (err) {
      setIsReady(false);
      setError("Failed to validate API key. Please try again.");
      console.error("API key validation error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchModel = useCallback((modelName: string) => {
    setCurrentModel(modelName);
    geminiService.setModel(modelName);
    storage.saveSettings({ selectedModel: modelName });
  }, []);

  const refreshModels = useCallback(async () => {
    if (!isReady) return;

    setIsLoading(true);
    try {
      const models = await geminiService.getAvailableModels();
      setAvailableModels(models);
      storage.saveSettings({ availableModels: models });
    } catch (err) {
      setError("Failed to refresh models");
      console.error("Model refresh error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isReady]);

  const generateResponse = useCallback(
    async (prompt: string): Promise<string> => {
      if (!isReady) {
        throw new Error("Gemini service not ready. Please set API key first.");
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await geminiService.generateResponse(prompt);
        return response;
      } catch (err) {
        const errorMessage = "Failed to generate response";
        setError(errorMessage);
        console.error("Generate response error:", err);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [isReady],
  );

  const startChat = useCallback(async (): Promise<string> => {
    return generateResponse("start_chat_command");
  }, [generateResponse]);

  const processFiles = useCallback(
    async (
      files: Array<{ name: string; content: string }>,
      documentName: string,
    ): Promise<string> => {
      if (!isReady) {
        throw new Error("Gemini service not ready");
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await geminiService.processFilesForCompilation(
          files,
          documentName,
        );
        return response;
      } catch (err) {
        const errorMessage = "Failed to process files";
        setError(errorMessage);
        console.error("Process files error:", err);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [isReady],
  );

  const condenseContent = useCallback(
    async (content: string): Promise<string> => {
      if (!isReady) {
        throw new Error("Gemini service not ready");
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await geminiService.condenseForLLM(content);
        return response;
      } catch (err) {
        const errorMessage = "Failed to condense content";
        setError(errorMessage);
        console.error("Condense content error:", err);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [isReady],
  );

  const handleUserMessage = useCallback(
    async (message: string, context?: string): Promise<string> => {
      return generateResponse(context ? `${context}\n\n${message}` : message);
    },
    [generateResponse],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    isReady,
    availableModels,
    currentModel,
    setApiKey,
    switchModel,
    refreshModels,
    generateResponse,
    startChat,
    processFiles,
    condenseContent,
    handleUserMessage,
    clearError,
  };
}
