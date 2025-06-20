import { useState, useCallback, useEffect } from "react";
import {
  UploadedFile,
  DocumentAnalysis,
  ComparisonResult,
  AIFileContext,
  FileRelationship,
  ChatMessage,
} from "@/types";
import { enhancedAI } from "@/lib/enhancedAI";
import { useAI } from "./useAI";
import { toast } from "sonner";

export function useEnhancedAI() {
  const {
    selectedService,
    currentModel,
    isReady,
    generateResponse,
    isLoading: baseIsLoading,
    error: baseError,
  } = useAI();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [documentAnalysis, setDocumentAnalysis] =
    useState<DocumentAnalysis | null>(null);
  const [comparisonResult, setComparisonResult] =
    useState<ComparisonResult | null>(null);
  const [fileRelationships, setFileRelationships] = useState<
    FileRelationship[]
  >([]);
  const [fileContext, setFileContext] = useState<AIFileContext>({
    files: [],
    analysisResults: new Map(),
    relationships: [],
  });
  const [aiInsights, setAiInsights] = useState<string[]>([]);

  /**
   * Analyze a single document with AI
   */
  const analyzeDocument = useCallback(
    async (file: UploadedFile): Promise<DocumentAnalysis> => {
      if (!isReady) {
        throw new Error("AI service not ready");
      }

      setIsAnalyzing(true);
      try {
        const analysis = await enhancedAI.analyzeDocument(
          file,
          currentModel,
          selectedService,
        );

        setDocumentAnalysis(analysis);
        toast.success(`Document analysis completed for ${file.name}`);
        return analysis;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Analysis failed";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [isReady, currentModel, selectedService],
  );

  /**
   * Compare multiple documents
   */
  const compareDocuments = useCallback(
    async (files: UploadedFile[]): Promise<ComparisonResult> => {
      if (!isReady) {
        throw new Error("AI service not ready");
      }

      if (files.length < 2) {
        throw new Error("At least 2 files required for comparison");
      }

      setIsComparing(true);
      try {
        const result = await enhancedAI.compareDocuments(
          files,
          currentModel,
          selectedService,
        );

        setComparisonResult(result);
        toast.success(`Comparison completed for ${files.length} files`);
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Comparison failed";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsComparing(false);
      }
    },
    [isReady, currentModel, selectedService],
  );

  /**
   * Generate an outline from multiple files
   */
  const generateOutline = useCallback(
    async (files: UploadedFile[]): Promise<string> => {
      if (!isReady) {
        throw new Error("AI service not ready");
      }

      if (files.length === 0) {
        throw new Error("No files provided for outline generation");
      }

      setIsGeneratingOutline(true);
      try {
        const outline = await enhancedAI.generateOutline(
          files,
          currentModel,
          selectedService,
        );

        toast.success("Outline generated successfully");
        return outline;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Outline generation failed";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsGeneratingOutline(false);
      }
    },
    [isReady, currentModel, selectedService],
  );

  /**
   * Summarize multiple files
   */
  const summarizeFiles = useCallback(
    async (files: UploadedFile[]): Promise<string> => {
      if (!isReady) {
        throw new Error("AI service not ready");
      }

      try {
        const summary = await enhancedAI.summarizeFiles(
          files,
          currentModel,
          selectedService,
        );

        toast.success("Summary generated successfully");
        return summary;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Summarization failed";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [isReady, currentModel, selectedService],
  );

  /**
   * Extract key points from content
   */
  const extractKeyPoints = useCallback(
    async (content: string): Promise<string[]> => {
      if (!isReady) {
        throw new Error("AI service not ready");
      }

      try {
        const keyPoints = await enhancedAI.extractKeyPoints(
          content,
          currentModel,
          selectedService,
        );

        return keyPoints;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Key point extraction failed";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [isReady, currentModel, selectedService],
  );

  /**
   * Chat with AI using file context
   */
  const chatWithFiles = useCallback(
    async (prompt: string, files: UploadedFile[]): Promise<string> => {
      if (!isReady) {
        throw new Error("AI service not ready");
      }

      try {
        const response = await enhancedAI.chatWithFiles(
          prompt,
          files,
          currentModel,
          selectedService,
        );

        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Chat failed";
        throw new Error(errorMessage);
      }
    },
    [isReady, currentModel, selectedService],
  );

  /**
   * Identify relationships between files
   */
  const identifyFileRelationships = useCallback(
    async (files: UploadedFile[]): Promise<FileRelationship[]> => {
      if (!isReady) {
        throw new Error("AI service not ready");
      }

      try {
        const relationships = await enhancedAI.identifyFileRelationships(
          files,
          currentModel,
          selectedService,
        );

        setFileRelationships(relationships);
        toast.success(
          `Found ${relationships.length} relationships between files`,
        );
        return relationships;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Relationship analysis failed";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [isReady, currentModel, selectedService],
  );

  /**
   * Generate AI insights for the current file context
   */
  const generateInsights = useCallback(
    async (files: UploadedFile[]): Promise<string[]> => {
      if (!isReady || files.length === 0) {
        return [];
      }

      try {
        const insights: string[] = [];

        // Always provide basic file analysis (doesn't require AI)
        const totalSize = files.reduce((sum, f) => sum + f.size, 0);
        const formatSize = (bytes: number) => {
          if (bytes === 0) return "0 Bytes";
          const k = 1024;
          const sizes = ["Bytes", "KB", "MB"];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return (
            parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
          );
        };

        insights.push(
          `📁 **Files**: Analyzing ${files.length} file${files.length > 1 ? "s" : ""} totaling ${formatSize(totalSize)}.`,
        );

        // File type distribution (doesn't require AI)
        const typeDistribution = files.reduce(
          (acc, file) => {
            acc[file.type] = (acc[file.type] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );

        const typeList = Object.entries(typeDistribution)
          .map(([type, count]) => `${count} ${type}`)
          .join(", ");
        insights.push(`📊 **Types**: ${typeList} files detected.`);

        // Try to generate AI-powered insights with fallbacks
        try {
          const summary = await summarizeFiles(files);
          if (summary && summary.length > 0) {
            const firstSentence = summary.split(".")[0];
            if (firstSentence.length > 10) {
              insights.push(`📋 **Overview**: ${firstSentence}.`);
            }
          }
        } catch (summaryError) {
          console.warn(
            "Failed to generate summary, using fallback:",
            summaryError,
          );
          // Provide a basic content overview
          const avgSize = totalSize / files.length;
          if (avgSize > 10000) {
            insights.push(
              `📋 **Overview**: Large documents detected with substantial content.`,
            );
          } else if (avgSize < 1000) {
            insights.push(
              `📋 **Overview**: Small files detected, likely snippets or notes.`,
            );
          } else {
            insights.push(
              `📋 **Overview**: Medium-sized documents ready for analysis.`,
            );
          }
        }

        // Try to identify relationships if multiple files
        if (files.length > 1) {
          try {
            const relationships = await identifyFileRelationships(files);
            if (relationships.length > 0) {
              insights.push(
                `🔗 **Connections**: Found ${relationships.length} relationship${relationships.length > 1 ? "s" : ""} between files.`,
              );
            } else {
              insights.push(
                `🔗 **Connections**: Files appear to be independent documents.`,
              );
            }
          } catch (relationshipError) {
            console.warn(
              "Failed to analyze relationships, using fallback:",
              relationshipError,
            );
            // Provide basic relationship insight based on file names/types
            const sameTypeFiles = Object.values(typeDistribution).some(
              (count) => count > 1,
            );
            if (sameTypeFiles) {
              insights.push(
                `🔗 **Connections**: Multiple files of similar types detected.`,
              );
            } else {
              insights.push(
                `🔗 **Connections**: Diverse file types suggest varied content.`,
              );
            }
          }
        }

        // Add action suggestions
        if (files.length > 1) {
          insights.push(
            `💡 **Suggestions**: Try combining files or analyzing relationships between documents.`,
          );
        } else {
          insights.push(
            `💡 **Suggestions**: Upload more files to compare and analyze relationships.`,
          );
        }

        setAiInsights(insights);
        return insights;
      } catch (error) {
        console.error("Failed to generate insights:", error);

        // Fallback to basic insights even if everything fails
        const fallbackInsights = [
          `📁 **Files**: ${files.length} file${files.length > 1 ? "s" : ""} available for analysis.`,
          `⚠️ **Status**: AI analysis temporarily unavailable. Basic file information shown.`,
          `💡 **Tip**: Try refreshing the page or checking your connection.`,
        ];

        setAiInsights(fallbackInsights);
        return fallbackInsights;
      }
    },
    [isReady, summarizeFiles, identifyFileRelationships],
  );

  /**
   * Update file context
   */
  const updateFileContext = useCallback(
    async (files: UploadedFile[]) => {
      const newContext: AIFileContext = {
        files,
        analysisResults: new Map(),
        relationships: [],
      };

      // Analyze each file
      for (const file of files) {
        try {
          const analysis = await enhancedAI.analyzeFileContent(
            file,
            currentModel,
            selectedService,
          );
          newContext.analysisResults.set(file.id, analysis);
        } catch (error) {
          console.error(`Failed to analyze ${file.name}:`, error);
        }
      }

      // Identify relationships between files
      if (files.length > 1) {
        try {
          newContext.relationships = await identifyFileRelationships(files);
        } catch (error) {
          console.error("Failed to identify relationships:", error);
        }
      }

      setFileContext(newContext);
    },
    [currentModel, selectedService, identifyFileRelationships],
  );

  /**
   * Generate content suggestions based on files
   */
  const generateContentSuggestions = useCallback(
    async (files: UploadedFile[]): Promise<string[]> => {
      if (!isReady || files.length === 0) {
        return [];
      }

      try {
        const prompt = `Based on these ${files.length} files, suggest 5 useful actions or questions a user might want to perform:

Files: ${files.map((f) => f.name).join(", ")}

Provide suggestions as a JSON array: ["suggestion1", "suggestion2", ...]`;

        const response = await generateResponse(prompt);

        try {
          const suggestions = JSON.parse(response);
          return Array.isArray(suggestions) ? suggestions : [];
        } catch {
          // If JSON parsing fails, extract suggestions manually
          const lines = response
            .split("\n")
            .filter(
              (line) =>
                line.includes("•") || line.includes("-") || line.includes("1."),
            );
          return lines.slice(0, 5);
        }
      } catch (error) {
        console.error("Failed to generate suggestions:", error);
        return [
          "📝 Summarize the key information",
          "🔍 Compare and analyze differences",
          "📋 Generate an outline or table of contents",
          "💡 Extract main insights and conclusions",
          "🔗 Find relationships between documents",
        ];
      }
    },
    [isReady, generateResponse],
  );

  /**
   * Clear all analysis results
   */
  const clearAnalysis = useCallback(() => {
    setDocumentAnalysis(null);
    setComparisonResult(null);
    setFileRelationships([]);
    setFileContext({
      files: [],
      analysisResults: new Map(),
      relationships: [],
    });
    setAiInsights([]);
  }, []);

  /**
   * Check if any AI operation is in progress
   */
  const isLoading =
    baseIsLoading || isAnalyzing || isComparing || isGeneratingOutline;

  return {
    // State
    isLoading,
    error: baseError,
    isAnalyzing,
    isComparing,
    isGeneratingOutline,
    documentAnalysis,
    comparisonResult,
    fileRelationships,
    fileContext,
    aiInsights,

    // Core AI operations
    analyzeDocument,
    compareDocuments,
    generateOutline,
    summarizeFiles,
    extractKeyPoints,
    chatWithFiles,

    // Advanced features
    identifyFileRelationships,
    generateInsights,
    updateFileContext,
    generateContentSuggestions,

    // Utilities
    clearAnalysis,
  };
}
