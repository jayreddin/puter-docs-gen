import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  FileText,
  Brain,
  Combine,
  AlertCircle,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  UploadedFile,
  ProcessingPipeline as PipelineType,
  ProcessingPipelineStep,
  CombinationOptions,
} from "@/types";
import { useFileExtraction } from "@/hooks/useFileExtraction";
import { useAI } from "@/hooks/useAI";

interface ProcessingPipelineProps {
  files: UploadedFile[];
  onPipelineComplete?: (pipeline: PipelineType) => void;
  className?: string;
}

const StepIcon = ({ step }: { step: ProcessingPipelineStep }) => {
  const iconProps = { className: "w-4 h-4" };

  switch (step.id) {
    case "extract":
      return <FileText {...iconProps} />;
    case "analyze":
      return <Brain {...iconProps} />;
    case "combine":
      return <Combine {...iconProps} />;
    default:
      return <Zap {...iconProps} />;
  }
};

const StepStatus = ({ step }: { step: ProcessingPipelineStep }) => {
  switch (step.status) {
    case "complete":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "error":
      return <XCircle className="w-4 h-4 text-red-500" />;
    case "running":
      return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
    case "skipped":
      return <Badge variant="outline">Skipped</Badge>;
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
};

export function ProcessingPipeline({
  files,
  onPipelineComplete,
  className,
}: ProcessingPipelineProps) {
  const {
    runProcessingPipeline,
    currentPipeline,
    cancelProcessing,
    clearResults,
    getProcessingSummary,
    isProcessing,
  } = useFileExtraction();

  const {
    selectedService,
    currentModel,
    availableModels,
    availablePuterModels,
  } = useAI();

  const [pipelineConfig, setPipelineConfig] = useState({
    extractText: true,
    analyzeFiles: true,
    combineFiles: true,
    aiModel: currentModel,
    aiService: selectedService,
    combinationOptions: {
      strategy: "smart" as const,
      includeTableOfContents: true,
      addSeparators: true,
      preserveStructure: true,
      removeEmptyLines: true,
      combineCodeBlocks: false,
      outputFormat: "markdown" as const,
      title: "Combined Document",
      description: "",
    } as CombinationOptions,
  });

  const handleStartPipeline = useCallback(async () => {
    if (files.length === 0) {
      toast.error("No files to process");
      return;
    }

    try {
      const pipeline = await runProcessingPipeline(files, pipelineConfig);
      onPipelineComplete?.(pipeline);
      toast.success("Processing pipeline completed!");
    } catch (error) {
      console.error("Pipeline failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Processing pipeline failed",
      );
    }
  }, [files, pipelineConfig, runProcessingPipeline, onPipelineComplete]);

  const handleCancelPipeline = useCallback(() => {
    cancelProcessing();
    toast.info("Processing cancelled");
  }, [cancelProcessing]);

  const handleResetPipeline = useCallback(() => {
    clearResults();
    toast.info("Pipeline reset");
  }, [clearResults]);

  const getAvailableModels = () => {
    return selectedService === "puter" ? availablePuterModels : availableModels;
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  const processingStats = getProcessingSummary();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10">
            <Zap className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Processing Pipeline</h3>
            <p className="text-sm text-muted-foreground">
              Automated file processing workflow for {files.length} files
            </p>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!isProcessing ? (
            <>
              <Button
                onClick={handleStartPipeline}
                disabled={files.length === 0}
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Pipeline
              </Button>
              {currentPipeline && (
                <Button
                  variant="outline"
                  onClick={handleResetPipeline}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              )}
            </>
          ) : (
            <Button
              variant="destructive"
              onClick={handleCancelPipeline}
              className="flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Pipeline Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Pipeline Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Processing Steps */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Processing Steps</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="extract" className="text-sm">
                  Extract Text
                </Label>
                <Switch
                  id="extract"
                  checked={pipelineConfig.extractText}
                  onCheckedChange={(checked) =>
                    setPipelineConfig({
                      ...pipelineConfig,
                      extractText: checked,
                    })
                  }
                  disabled={isProcessing}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="analyze" className="text-sm">
                  AI Analysis
                </Label>
                <Switch
                  id="analyze"
                  checked={pipelineConfig.analyzeFiles}
                  onCheckedChange={(checked) =>
                    setPipelineConfig({
                      ...pipelineConfig,
                      analyzeFiles: checked,
                    })
                  }
                  disabled={isProcessing}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="combine" className="text-sm">
                  Combine Files
                </Label>
                <Switch
                  id="combine"
                  checked={pipelineConfig.combineFiles}
                  onCheckedChange={(checked) =>
                    setPipelineConfig({
                      ...pipelineConfig,
                      combineFiles: checked,
                    })
                  }
                  disabled={isProcessing}
                />
              </div>
            </div>
          </div>

          {/* AI Configuration */}
          {pipelineConfig.analyzeFiles && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ai-service">AI Service</Label>
                <Select
                  value={pipelineConfig.aiService}
                  onValueChange={(value: "gemini" | "puter") =>
                    setPipelineConfig({
                      ...pipelineConfig,
                      aiService: value,
                    })
                  }
                  disabled={isProcessing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="puter">Puter AI (Free)</SelectItem>
                    <SelectItem value="gemini">Gemini (API Key)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-model">AI Model</Label>
                <Select
                  value={pipelineConfig.aiModel}
                  onValueChange={(value) =>
                    setPipelineConfig({ ...pipelineConfig, aiModel: value })
                  }
                  disabled={isProcessing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableModels().map((model) => (
                      <SelectItem key={model.name} value={model.name}>
                        {model.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pipeline Status */}
      {currentPipeline && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pipeline Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Overall Progress</Label>
                <Badge
                  variant={
                    currentPipeline.status === "complete"
                      ? "default"
                      : currentPipeline.status === "error"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {currentPipeline.status}
                </Badge>
              </div>
              <Progress
                value={currentPipeline.overallProgress}
                className="h-2"
              />
            </div>

            {/* Processing Stats */}
            {processingStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Completed Steps
                  </Label>
                  <p className="font-medium">
                    {processingStats.completedSteps} /{" "}
                    {processingStats.totalSteps}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Files Processed
                  </Label>
                  <p className="font-medium">
                    {processingStats.filesProcessed}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Processing Time
                  </Label>
                  <p className="font-medium">
                    {formatDuration(processingStats.processingTime)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Status
                  </Label>
                  <p className="font-medium capitalize">
                    {processingStats.status}
                  </p>
                </div>
              </div>
            )}

            {/* Pipeline Steps */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Processing Steps</Label>
              <ScrollArea className="h-48 touch-pan-y">
                <div className="space-y-3">
                  {currentPipeline.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border",
                        step.status === "running" &&
                          "bg-blue-50 border-blue-200",
                        step.status === "complete" &&
                          "bg-green-50 border-green-200",
                        step.status === "error" && "bg-red-50 border-red-200",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {index + 1}
                        </Badge>
                        <StepIcon step={step} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">{step.name}</h4>
                          <StepStatus step={step} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {step.description}
                        </p>

                        {/* Step Progress */}
                        {step.status === "running" && (
                          <Progress
                            value={step.progress}
                            className="mt-2 h-1"
                          />
                        )}

                        {/* Step Error */}
                        {step.error && (
                          <Alert className="mt-2">
                            <AlertCircle className="w-4 h-4" />
                            <AlertDescription className="text-xs">
                              {step.error}
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Step Duration */}
                        {step.endTime && step.startTime && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Completed in{" "}
                            {formatDuration(step.endTime - step.startTime)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Files Warning */}
      {files.length === 0 && (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Upload files to enable the processing pipeline. The pipeline will
            automatically extract text, analyze content with AI, and combine
            files intelligently.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
