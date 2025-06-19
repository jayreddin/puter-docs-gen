import { useState, useCallback, useEffect } from "react";
import { geminiService } from "@/lib/gemini";
import { puterService } from "@/lib/puter";
import { GeminiModel, PuterModel } from "@/types";
import { storage } from "@/lib/storage";

export function useAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<"gemini" | "puter">(
    "gemini",
  );
  const [isGeminiReady, setIsGeminiReady] = useState(false);
  const [isPuterReady, setIsPuterReady] = useState(false);
  const [availableModels, setAvailableModels] = useState<GeminiModel[]>([]);
  const [availablePuterModels, setAvailablePuterModels] = useState<
    PuterModel[]
  >([]);
  const [currentModel, setCurrentModel] = useState("gpt-4o-mini");

  // Initialize with stored settings
  useEffect(() => {
    const settings = storage.getSettings();

    // Initialize Gemini if API key exists
    if (settings.apiKey) {
      geminiService.setApiKey(settings.apiKey);
      setIsGeminiReady(true);

      if (settings.selectedModel && settings.selectedService === "gemini") {
        setCurrentModel(settings.selectedModel);
        geminiService.setModel(settings.selectedModel);
      }

      if (settings.availableModels) {
        setAvailableModels(settings.availableModels);
      }
    }

    // Initialize Puter
    if (puterService.isAvailable()) {
      setIsPuterReady(true);
      loadPuterModels();
    }

    // Set selected service
    if (settings.selectedService) {
      setSelectedService(settings.selectedService);
      if (settings.selectedService === "puter" && settings.selectedModel) {
        setCurrentModel(settings.selectedModel);
      }
    }
  }, []);

  const loadPuterModels = useCallback(async () => {
    try {
      const models = await puterService.getAvailableModels();
      setAvailablePuterModels(models);
      storage.saveSettings({ availablePuterModels: models });
    } catch (error) {
      console.error("Failed to load Puter models:", error);
    }
  }, []);

  const setApiKey = useCallback(async (apiKey: string) => {
    setIsLoading(true);
    setError(null);

    try {
      geminiService.setApiKey(apiKey);
      const isValid = await geminiService.testApiKey();

      if (isValid) {
        setIsGeminiReady(true);
        storage.saveSettings({ apiKey, isApiKeyValid: true });

        // Fetch available models
        const models = await geminiService.getAvailableModels();
        setAvailableModels(models);
        storage.saveSettings({ availableModels: models });
      } else {
        setIsGeminiReady(false);
        setError("Invalid API key. Please check your key and try again.");
        storage.saveSettings({ isApiKeyValid: false });
      }
    } catch (err) {
      setIsGeminiReady(false);
      setError("Failed to validate API key. Please try again.");
      console.error("API key validation error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const connectToPuter = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Starting Puter connection process...");

      // Wait for Puter to fully load
      const puterLoaded = await puterService.waitForPuter();
      if (!puterLoaded) {
        throw new Error(
          "Puter SDK failed to load. Please reload the page and try again.",
        );
      }

      // Perform health check
      const healthCheck = await puterService.healthCheck();
      console.log("Puter health check:", healthCheck);

      if (!healthCheck.healthy) {
        throw new Error(`Puter service not ready: ${healthCheck.message}`);
      }

      console.log("Puter service is healthy, checking sign-in status...");

      // Check if user is signed in
      const isSignedIn = await puterService.isSignedIn();
      console.log("Puter sign-in status:", isSignedIn);

      if (!isSignedIn) {
        console.log("User not signed in, attempting to sign in...");
        // Try to sign in
        await puterService.signIn();
        console.log("Sign-in completed");
      }

      console.log("Testing Puter connection...");

      // Test connection with better error handling
      try {
        const isConnected = await puterService.testConnection();
        console.log("Connection test result:", isConnected);

        if (isConnected) {
          setIsPuterReady(true);
          await loadPuterModels();
          storage.saveSettings({ isPuterConnected: true });
          console.log("Puter connection successful");
        } else {
          setIsPuterReady(false);
          setError(
            "Failed to connect to Puter AI services. Please check your internet connection and try again.",
          );
          storage.saveSettings({ isPuterConnected: false });
        }
      } catch (connectionError) {
        setIsPuterReady(false);
        const connectionErrorMessage =
          connectionError instanceof Error
            ? connectionError.message
            : "Failed to connect to Puter AI services.";
        setError(connectionErrorMessage);
        storage.saveSettings({ isPuterConnected: false });
        console.error("Connection test threw error:", connectionError);
      }
    } catch (err) {
      setIsPuterReady(false);
      console.error("Puter connection error details:");
      console.error("Error type:", typeof err);
      console.error(
        "Error message:",
        err instanceof Error ? err.message : "Unknown error",
      );
      console.error("Full error:", err);

      let errorMessage = "Failed to connect to Puter";

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      } else if (err && typeof err === "object" && "message" in err) {
        errorMessage = String(err.message);
      }

      setError(errorMessage);
      storage.saveSettings({ isPuterConnected: false });
    } finally {
      setIsLoading(false);
    }
  }, [loadPuterModels]);

  const switchService = useCallback(
    (service: "gemini" | "puter") => {
      setSelectedService(service);
      storage.saveSettings({ selectedService: service });

      // Reset current model when switching services
      if (service === "gemini" && availableModels.length > 0) {
        setCurrentModel(availableModels[0].name);
      } else if (service === "puter" && availablePuterModels.length > 0) {
        setCurrentModel(availablePuterModels[0].name);
      }
    },
    [availableModels, availablePuterModels],
  );

  const switchModel = useCallback(
    (modelName: string) => {
      setCurrentModel(modelName);

      if (selectedService === "gemini") {
        geminiService.setModel(modelName);
      }

      storage.saveSettings({ selectedModel: modelName });
    },
    [selectedService],
  );

  const refreshModels = useCallback(async () => {
    setIsLoading(true);
    try {
      if (selectedService === "gemini" && isGeminiReady) {
        const models = await geminiService.getAvailableModels();
        setAvailableModels(models);
        storage.saveSettings({ availableModels: models });
      } else if (selectedService === "puter" && isPuterReady) {
        await loadPuterModels();
      }
    } catch (err) {
      setError("Failed to refresh models");
      console.error("Model refresh error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedService, isGeminiReady, isPuterReady, loadPuterModels]);

  const generateResponse = useCallback(
    async (prompt: string): Promise<string> => {
      const isReady =
        selectedService === "gemini" ? isGeminiReady : isPuterReady;

      if (!isReady) {
        const serviceMessage =
          selectedService === "gemini"
            ? "Gemini service not ready. Please set API key first."
            : "Puter service not ready. Please connect to Puter first.";
        throw new Error(serviceMessage);
      }

      setIsLoading(true);
      setError(null);

      try {
        let response: string;

        if (selectedService === "gemini") {
          response = await geminiService.generateResponse(prompt);
        } else {
          // Ensure Puter is ready before making the request
          if (!puterService.isAvailable()) {
            throw new Error(
              "Puter service not available. Please connect to Puter first.",
            );
          }
          response = await puterService.generateResponse(prompt, {
            model: currentModel,
          });
        }

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
    [selectedService, isGeminiReady, isPuterReady, currentModel],
  );

  const processFiles = useCallback(
    async (
      files: Array<{ name: string; content: string }>,
      documentName: string,
    ): Promise<string> => {
      const isReady =
        selectedService === "gemini" ? isGeminiReady : isPuterReady;

      if (!isReady) {
        throw new Error("AI service not ready");
      }

      setIsLoading(true);
      setError(null);

      try {
        let response: string;

        if (selectedService === "gemini") {
          response = await geminiService.processFilesForCompilation(
            files,
            documentName,
          );
        } else {
          response = await puterService.processFilesForCompilation(
            files,
            documentName,
            currentModel,
          );
        }

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
    [selectedService, isGeminiReady, isPuterReady, currentModel],
  );

  const condenseContent = useCallback(
    async (content: string): Promise<string> => {
      const isReady =
        selectedService === "gemini" ? isGeminiReady : isPuterReady;

      if (!isReady) {
        throw new Error("AI service not ready");
      }

      setIsLoading(true);
      setError(null);

      try {
        let response: string;

        if (selectedService === "gemini") {
          response = await geminiService.condenseForLLM(content);
        } else {
          response = await puterService.condenseForLLM(content, currentModel);
        }

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
    [selectedService, isGeminiReady, isPuterReady, currentModel],
  );

  const handleUserMessage = useCallback(
    async (message: string, context?: string): Promise<string> => {
      if (selectedService === "gemini") {
        return generateResponse(context ? `${context}\n\n${message}` : message);
      } else {
        return puterService.handleUserMessage(message, context, currentModel);
      }
    },
    [selectedService, currentModel, generateResponse],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getAvailableModelsForCurrentService = useCallback(() => {
    return selectedService === "gemini"
      ? availableModels
      : availablePuterModels;
  }, [selectedService, availableModels, availablePuterModels]);

  const isReady = selectedService === "gemini" ? isGeminiReady : isPuterReady;

  return {
    isLoading,
    error,
    selectedService,
    isReady,
    isGeminiReady,
    isPuterReady,
    availableModels,
    availablePuterModels,
    currentModel,
    setApiKey,
    connectToPuter,
    switchService,
    switchModel,
    refreshModels,
    generateResponse,
    processFiles,
    condenseContent,
    handleUserMessage,
    clearError,
    getAvailableModelsForCurrentService,
    // Puter-specific features
    puterService,
  };
}
