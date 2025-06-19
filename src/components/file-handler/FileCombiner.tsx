import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  FileText,
  Combine,
  Settings,
  Download,
  Eye,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  UploadedFile,
  CombinationOptions,
  CombinationResult,
  CombinationMetadata,
} from "@/types";
import { useFileExtraction } from "@/hooks/useFileExtraction";

interface FileCombinerProps {
  files: UploadedFile[];
  onCombinationComplete?: (result: CombinationResult) => void;
  className?: string;
}

export function FileCombiner({
  files,
  onCombinationComplete,
  className,
}: FileCombinerProps) {
  const { combineFiles, processingStatus, combinationResult, isProcessing } =
    useFileExtraction();

  const [options, setOptions] = useState<CombinationOptions>({
    strategy: "smart",
    includeTableOfContents: true,
    addSeparators: true,
    preserveStructure: true,
    removeEmptyLines: true,
    combineCodeBlocks: false,
    outputFormat: "markdown",
    title: "",
    description: "",
  });

  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState("");

  const handleCombine = useCallback(async () => {
    if (files.length === 0) {
      toast.error("No files to combine");
      return;
    }

    try {
      const result = await combineFiles(files, options);
      setPreviewContent(result.content);
      onCombinationComplete?.(result);
      toast.success("Files combined successfully!");
    } catch (error) {
      console.error("Combination failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Combination failed",
      );
    }
  }, [files, options, combineFiles, onCombinationComplete]);

  const handleDownload = useCallback(() => {
    if (!combinationResult) return;

    const filename = options.title
      ? `${options.title.replace(/[^a-z0-9]/gi, "_")}.md`
      : `combined_document_${Date.now()}.md`;

    const blob = new Blob([combinationResult.content], {
      type: "text/markdown",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Downloaded ${filename}`);
  }, [combinationResult, options.title]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatProcessingTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10">
          <Combine className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">File Combiner</h3>
          <p className="text-sm text-muted-foreground">
            Intelligently combine {files.length} files into a single document
          </p>
        </div>
      </div>

      {/* File List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Files to Combine ({files.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Badge variant="outline" className="text-xs">
                      {index + 1}
                    </Badge>
                    <span className="text-sm font-medium truncate">
                      {file.name}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {file.type}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Combination Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Combination Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Document Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Document Title</Label>
              <Input
                id="title"
                placeholder="Combined Document"
                value={options.title}
                onChange={(e) =>
                  setOptions({ ...options, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="strategy">Combination Strategy</Label>
              <Select
                value={options.strategy}
                onValueChange={(value: "smart" | "chronological" | "manual") =>
                  setOptions({ ...options, strategy: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="smart">Smart (AI-Optimized)</SelectItem>
                  <SelectItem value="chronological">Chronological</SelectItem>
                  <SelectItem value="manual">Manual Order</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the combined document..."
              rows={2}
              value={options.description}
              onChange={(e) =>
                setOptions({ ...options, description: e.target.value })
              }
            />
          </div>

          {/* Structure Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="toc" className="text-sm">
                Table of Contents
              </Label>
              <Switch
                id="toc"
                checked={options.includeTableOfContents}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, includeTableOfContents: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="separators" className="text-sm">
                Add Separators
              </Label>
              <Switch
                id="separators"
                checked={options.addSeparators}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, addSeparators: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="structure" className="text-sm">
                Preserve Structure
              </Label>
              <Switch
                id="structure"
                checked={options.preserveStructure}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, preserveStructure: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="empty-lines" className="text-sm">
                Remove Empty Lines
              </Label>
              <Switch
                id="empty-lines"
                checked={options.removeEmptyLines}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, removeEmptyLines: checked })
                }
              />
            </div>
          </div>

          {/* Output Format */}
          <div className="space-y-2">
            <Label htmlFor="format">Output Format</Label>
            <Select
              value={options.outputFormat}
              onValueChange={(value: "markdown" | "html" | "plain") =>
                setOptions({ ...options, outputFormat: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="markdown">Markdown</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="plain">Plain Text</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Processing Status */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-sm font-medium">
                  {processingStatus.message || "Processing files..."}
                </span>
              </div>
              <Progress value={processingStatus.progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Stage: {processingStatus.stage}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Results */}
      {combinationResult && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Combination Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Files Processed
                </Label>
                <p className="font-medium">
                  {combinationResult.metadata.filesProcessed}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Word Count
                </Label>
                <p className="font-medium">
                  {combinationResult.metadata.totalWordCount.toLocaleString()}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Processing Time
                </Label>
                <p className="font-medium">
                  {formatProcessingTime(
                    combinationResult.metadata.processingTime,
                  )}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Size</Label>
                <p className="font-medium">
                  {formatFileSize(
                    combinationResult.metadata.totalCharacterCount,
                  )}
                </p>
              </div>
            </div>

            {/* Warnings and Suggestions */}
            {combinationResult.warnings.length > 0 && (
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  <strong>Warnings:</strong>{" "}
                  {combinationResult.warnings.join(", ")}
                </AlertDescription>
              </Alert>
            )}

            {combinationResult.suggestions.length > 0 && (
              <Alert>
                <FileCheck className="w-4 h-4" />
                <AlertDescription>
                  <strong>Suggestions:</strong>{" "}
                  {combinationResult.suggestions.join(", ")}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? "Hide" : "Preview"}
              </Button>
              <Button
                size="sm"
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {showPreview && combinationResult && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <pre className="text-xs whitespace-pre-wrap">
                {combinationResult.content.substring(0, 2000)}
                {combinationResult.content.length > 2000 && "..."}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleCombine}
          disabled={files.length === 0 || isProcessing}
          className="flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          {isProcessing ? "Combining..." : "Combine Files"}
        </Button>

        {files.length === 0 && (
          <p className="text-sm text-muted-foreground flex items-center">
            Upload files to enable combination
          </p>
        )}
      </div>
    </div>
  );
}
