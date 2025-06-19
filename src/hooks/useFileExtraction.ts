import { useState, useCallback, useEffect } from "react";
import {
  UploadedFile,
  ProcessingStatus,
  CombinationOptions,
  CombinationResult,
  ProcessingPipeline,
  ProcessingPipelineStep,
  FileAnalysis,
} from "@/types";
import { fileTextExtractor } from "@/lib/fileTextExtractor";
import { enhancedAI } from "@/lib/enhancedAI";
import { toast } from "sonner";

export function useFileExtraction() {
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    stage: "pending",
    progress: 0,
  });
  const [combinationResult, setCombinationResult] =
    useState<CombinationResult | null>(null);
  const [currentPipeline, setCurrentPipeline] =
    useState<ProcessingPipeline | null>(null);
  const [analysisResults, setAnalysisResults] = useState<
    Map<string, FileAnalysis>
  >(new Map());

  /**
   * Extract text from a single file
   */
  const extractTextFromFile = useCallback(
    async (file: UploadedFile): Promise<string> => {
      try {
        setProcessingStatus({
          stage: "extracting",
          progress: 0,
          message: `Extracting text from ${file.name}...`,
        });

        const extractedText = await fileTextExtractor.extractText(file);

        setProcessingStatus({
          stage: "complete",
          progress: 100,
          message: "Text extraction completed",
        });

        return extractedText;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to extract text";

        setProcessingStatus({
          stage: "error",
          progress: 0,
          error: errorMessage,
        });

        throw new Error(errorMessage);
      }
    },
    [],
  );

  /**
   * Extract metadata from files
   */
  const extractMetadata = useCallback((files: UploadedFile[]) => {
    return files.map((file) => ({
      ...file,
      metadata: fileTextExtractor.extractMetadata(file),
    }));
  }, []);

  /**
   * Analyze files with AI
   */
  const analyzeFiles = useCallback(
    async (
      files: UploadedFile[],
      model: string,
      service: "gemini" | "puter" = "puter",
    ): Promise<Map<string, FileAnalysis>> => {
      const results = new Map<string, FileAnalysis>();

      try {
        setProcessingStatus({
          stage: "analyzing",
          progress: 0,
          message: "Analyzing files with AI...",
        });

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const progress = ((i + 1) / files.length) * 100;

          setProcessingStatus({
            stage: "analyzing",
            progress,
            message: `Analyzing ${file.name}...`,
          });

          try {
            const analysis = await enhancedAI.analyzeFileContent(
              file,
              model,
              service,
            );
            results.set(file.id, analysis);
          } catch (error) {
            console.error(`Failed to analyze ${file.name}:`, error);
            toast.error(`Failed to analyze ${file.name}`);
          }
        }

        setAnalysisResults(results);

        setProcessingStatus({
          stage: "complete",
          progress: 100,
          message: "File analysis completed",
        });

        return results;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to analyze files";

        setProcessingStatus({
          stage: "error",
          progress: 0,
          error: errorMessage,
        });

        throw new Error(errorMessage);
      }
    },
    [],
  );

  /**
   * Combine files into a single document
   */
  const combineFiles = useCallback(
    async (
      files: UploadedFile[],
      options: CombinationOptions,
    ): Promise<CombinationResult> => {
      try {
        setProcessingStatus({
          stage: "combining",
          progress: 0,
          message: "Combining files...",
        });

        // Update progress during combination
        const progressInterval = setInterval(() => {
          setProcessingStatus((prev) => ({
            ...prev,
            progress: Math.min(prev.progress + 10, 90),
          }));
        }, 200);

        const result = await fileTextExtractor.combineFiles(files, options);

        clearInterval(progressInterval);

        setProcessingStatus({
          stage: "complete",
          progress: 100,
          message: "Files combined successfully",
        });

        setCombinationResult(result);
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to combine files";

        setProcessingStatus({
          stage: "error",
          progress: 0,
          error: errorMessage,
        });

        throw new Error(errorMessage);
      }
    },
    [],
  );

  /**
   * Run a complete processing pipeline
   */
  const runProcessingPipeline = useCallback(
    async (
      files: UploadedFile[],
      options: {
        extractText: boolean;
        analyzeFiles: boolean;
        combineFiles: boolean;
        combinationOptions?: CombinationOptions;
        aiModel?: string;
        aiService?: "gemini" | "puter";
      },
    ): Promise<ProcessingPipeline> => {
      const pipeline: ProcessingPipeline = {
        id: `pipeline_${Date.now()}`,
        name: "File Processing Pipeline",
        files,
        steps: [],
        overallProgress: 0,
        status: "running",
        startTime: Date.now(),
      };

      // Define pipeline steps
      if (options.extractText) {
        pipeline.steps.push({
          id: "extract",
          name: "Extract Text",
          description: "Extract text content from files",
          status: "pending",
          progress: 0,
        });
      }

      if (options.analyzeFiles) {
        pipeline.steps.push({
          id: "analyze",
          name: "Analyze Files",
          description: "Analyze files with AI",
          status: "pending",
          progress: 0,
        });
      }

      if (options.combineFiles) {
        pipeline.steps.push({
          id: "combine",
          name: "Combine Files",
          description: "Combine files into single document",
          status: "pending",
          progress: 0,
        });
      }

      setCurrentPipeline(pipeline);

      try {
        // Execute pipeline steps
        for (let i = 0; i < pipeline.steps.length; i++) {
          const step = pipeline.steps[i];
          step.status = "running";
          step.startTime = Date.now();

          setCurrentPipeline({ ...pipeline });

          try {
            switch (step.id) {
              case "extract":
                for (let j = 0; j < files.length; j++) {
                  const file = files[j];
                  await extractTextFromFile(file);
                  step.progress = ((j + 1) / files.length) * 100;
                  setCurrentPipeline({ ...pipeline });
                }
                break;

              case "analyze":
                if (options.aiModel && options.aiService) {
                  await analyzeFiles(files, options.aiModel, options.aiService);
                }
                step.progress = 100;
                break;

              case "combine":
                if (options.combinationOptions) {
                  const result = await combineFiles(
                    files,
                    options.combinationOptions,
                  );
                  step.result = result;
                }
                step.progress = 100;
                break;
            }

            step.status = "complete";
            step.endTime = Date.now();
          } catch (error) {
            step.status = "error";
            step.error = error instanceof Error ? error.message : "Step failed";
            step.endTime = Date.now();
            throw error;
          }

          pipeline.overallProgress = ((i + 1) / pipeline.steps.length) * 100;
          setCurrentPipeline({ ...pipeline });
        }

        pipeline.status = "complete";
        pipeline.endTime = Date.now();
        setCurrentPipeline({ ...pipeline });

        toast.success("Processing pipeline completed successfully!");
        return pipeline;
      } catch (error) {
        pipeline.status = "error";
        pipeline.endTime = Date.now();
        setCurrentPipeline({ ...pipeline });

        const errorMessage =
          error instanceof Error ? error.message : "Processing pipeline failed";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [extractTextFromFile, analyzeFiles, combineFiles],
  );

  /**
   * Cancel current processing
   */
  const cancelProcessing = useCallback(() => {
    setProcessingStatus({
      stage: "pending",
      progress: 0,
    });

    if (currentPipeline) {
      setCurrentPipeline({
        ...currentPipeline,
        status: "cancelled",
        endTime: Date.now(),
      });
    }

    toast.info("Processing cancelled");
  }, [currentPipeline]);

  /**
   * Clear processing results
   */
  const clearResults = useCallback(() => {
    setProcessingStatus({
      stage: "pending",
      progress: 0,
    });
    setCombinationResult(null);
    setCurrentPipeline(null);
    setAnalysisResults(new Map());
  }, []);

  /**
   * Get processing summary
   */
  const getProcessingSummary = useCallback(() => {
    if (!currentPipeline) return null;

    const completedSteps = currentPipeline.steps.filter(
      (step) => step.status === "complete",
    ).length;
    const totalSteps = currentPipeline.steps.length;
    const processingTime = currentPipeline.endTime
      ? currentPipeline.endTime - (currentPipeline.startTime || 0)
      : Date.now() - (currentPipeline.startTime || 0);

    return {
      completedSteps,
      totalSteps,
      processingTime,
      status: currentPipeline.status,
      filesProcessed: currentPipeline.files.length,
    };
  }, [currentPipeline]);

  /**
   * Get analysis result for a specific file
   */
  const getFileAnalysis = useCallback(
    (fileId: string): FileAnalysis | undefined => {
      return analysisResults.get(fileId);
    },
    [analysisResults],
  );

  /**
   * Check if processing is in progress
   */
  const isProcessing = processingStatus.stage !== "pending";

  return {
    // State
    processingStatus,
    combinationResult,
    currentPipeline,
    analysisResults,
    isProcessing,

    // Actions
    extractTextFromFile,
    extractMetadata,
    analyzeFiles,
    combineFiles,
    runProcessingPipeline,
    cancelProcessing,
    clearResults,

    // Getters
    getProcessingSummary,
    getFileAnalysis,
  };
}
