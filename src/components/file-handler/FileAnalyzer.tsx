import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Brain,
  FileText,
  TrendingUp,
  Target,
  Lightbulb,
  BarChart3,
  Network,
  Eye,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Zap,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  UploadedFile,
  FileAnalysis,
  DocumentAnalysis,
  ComparisonResult,
  FileRelationship,
} from "@/types";
import { useEnhancedAI } from "@/hooks/useEnhancedAI";
import { useAI } from "@/hooks/useAI";

interface FileAnalyzerProps {
  files: UploadedFile[];
  selectedFileId?: string;
  onAnalysisComplete?: (analysis: FileAnalysis | DocumentAnalysis) => void;
  className?: string;
}

const SentimentBadge = ({ sentiment }: { sentiment: string }) => {
  const colors = {
    positive: "bg-green-100 text-green-800",
    negative: "bg-red-100 text-red-800",
    neutral: "bg-gray-100 text-gray-800",
  };

  return (
    <Badge
      className={colors[sentiment as keyof typeof colors] || colors.neutral}
    >
      {sentiment}
    </Badge>
  );
};

const ComplexityBadge = ({ complexity }: { complexity: string }) => {
  const colors = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  };

  return (
    <Badge
      className={colors[complexity as keyof typeof colors] || colors.medium}
    >
      {complexity} complexity
    </Badge>
  );
};

const QualityBar = ({ label, value }: { label: string; value: number }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-sm">
      <span>{label}</span>
      <span className="font-medium">{Math.round(value * 100)}%</span>
    </div>
    <Progress value={value * 100} className="h-2" />
  </div>
);

export function FileAnalyzer({
  files,
  selectedFileId,
  onAnalysisComplete,
  className,
}: FileAnalyzerProps) {
  const {
    analyzeDocument,
    compareDocuments,
    generateInsights,
    identifyFileRelationships,
    fileRelationships,
    documentAnalysis,
    comparisonResult,
    aiInsights,
    isAnalyzing,
    isComparing,
    clearAnalysis,
  } = useEnhancedAI();

  const { isReady, currentModel, selectedService } = useAI();

  const [analysisResults, setAnalysisResults] = useState<
    Map<string, FileAnalysis>
  >(new Map());
  const [activeTab, setActiveTab] = useState("single");
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  // Get selected file
  const selectedFile = selectedFileId
    ? files.find((f) => f.id === selectedFileId)
    : files[0];

  // Analyze single file
  const handleAnalyzeFile = useCallback(
    async (file: UploadedFile) => {
      if (!isReady) {
        toast.error("AI service not ready");
        return;
      }

      try {
        const analysis = await analyzeDocument(file);
        setAnalysisResults((prev) =>
          new Map(prev).set(file.id, analysis as any),
        );
        onAnalysisComplete?.(analysis);
        toast.success(`Analysis completed for ${file.name}`);
      } catch (error) {
        console.error("Analysis failed:", error);
        toast.error(error instanceof Error ? error.message : "Analysis failed");
      }
    },
    [isReady, analyzeDocument, onAnalysisComplete],
  );

  // Compare multiple files
  const handleCompareFiles = useCallback(async () => {
    if (files.length < 2) {
      toast.error("At least 2 files required for comparison");
      return;
    }

    try {
      await compareDocuments(files);
      toast.success("File comparison completed");
    } catch (error) {
      console.error("Comparison failed:", error);
      toast.error(error instanceof Error ? error.message : "Comparison failed");
    }
  }, [files, compareDocuments]);

  // Generate AI insights
  const handleGenerateInsights = useCallback(async () => {
    if (files.length === 0) {
      toast.error("No files to analyze");
      return;
    }

    setIsGeneratingInsights(true);
    try {
      await generateInsights(files);
      toast.success("AI insights generated");
    } catch (error) {
      console.error("Insights generation failed:", error);
      toast.error("Failed to generate insights");
    } finally {
      setIsGeneratingInsights(false);
    }
  }, [files, generateInsights]);

  // Identify relationships
  const handleIdentifyRelationships = useCallback(async () => {
    if (files.length < 2) {
      toast.error("At least 2 files required for relationship analysis");
      return;
    }

    try {
      await identifyFileRelationships(files);
      toast.success("File relationships identified");
    } catch (error) {
      console.error("Relationship analysis failed:", error);
      toast.error("Failed to identify relationships");
    }
  }, [files, identifyFileRelationships]);

  // Auto-analyze when file selection changes
  useEffect(() => {
    if (selectedFile && !analysisResults.has(selectedFile.id)) {
      handleAnalyzeFile(selectedFile);
    }
  }, [selectedFile, analysisResults, handleAnalyzeFile]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10">
            <Brain className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">File Analyzer</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered analysis of {files.length} file
              {files.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateInsights}
            disabled={files.length === 0 || isGeneratingInsights}
            className="flex items-center gap-2"
          >
            <Lightbulb className="w-4 h-4" />
            {isGeneratingInsights ? "Generating..." : "AI Insights"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAnalysis}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Clear
          </Button>
        </div>
      </div>

      {/* AI Insights Panel */}
      {aiInsights.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {aiInsights.map((insight, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 text-sm"
                >
                  {insight}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="single" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Single File
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Compare
          </TabsTrigger>
          <TabsTrigger
            value="relationships"
            className="flex items-center gap-2"
          >
            <Network className="w-4 h-4" />
            Relationships
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Overview
          </TabsTrigger>
        </TabsList>

        {/* Single File Analysis */}
        <TabsContent value="single" className="space-y-4">
          {selectedFile ? (
            <>
              {/* File Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Analyzing: {selectedFile.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{selectedFile.type}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAnalyzeFile(selectedFile)}
                      disabled={isAnalyzing}
                      className="flex items-center gap-2"
                    >
                      <Brain className="w-4 h-4" />
                      {isAnalyzing ? "Analyzing..." : "Re-analyze"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Results */}
              {documentAnalysis && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Analysis Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Quality Metrics */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Quality Metrics</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <QualityBar
                          label="Completeness"
                          value={documentAnalysis.quality.completeness}
                        />
                        <QualityBar
                          label="Clarity"
                          value={documentAnalysis.quality.clarity}
                        />
                        <QualityBar
                          label="Consistency"
                          value={documentAnalysis.quality.consistency}
                        />
                        <QualityBar
                          label="Organization"
                          value={documentAnalysis.quality.organization}
                        />
                      </div>
                    </div>

                    {/* Insights */}
                    {documentAnalysis.insights.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium">Key Insights</h4>
                        <div className="space-y-2">
                          {documentAnalysis.insights.map((insight, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-2 text-sm"
                            >
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{insight}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {documentAnalysis.recommendations.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium">Recommendations</h4>
                        <div className="space-y-2">
                          {documentAnalysis.recommendations.map(
                            (recommendation, index) => (
                              <div
                                key={index}
                                className="flex items-start gap-2 text-sm"
                              >
                                <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                <span>{recommendation}</span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                No file selected for analysis.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* File Comparison */}
        <TabsContent value="compare" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                File Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Compare {files.length} files to identify similarities and
                  differences
                </p>
                <Button
                  onClick={handleCompareFiles}
                  disabled={files.length < 2 || isComparing}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  {isComparing ? "Comparing..." : "Compare Files"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Results */}
          {comparisonResult && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Comparison Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Similarity Score */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Overall Similarity
                    </span>
                    <Badge variant="outline">
                      {Math.round(comparisonResult.score * 100)}%
                    </Badge>
                  </div>
                  <Progress
                    value={comparisonResult.score * 100}
                    className="h-2"
                  />
                </div>

                {/* Similarities */}
                {comparisonResult.similarities.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-green-600">
                      Similarities
                    </h4>
                    <div className="space-y-1">
                      {comparisonResult.similarities.map(
                        (similarity, index) => (
                          <div
                            key={index}
                            className="text-sm p-2 bg-green-50 rounded"
                          >
                            {similarity}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Differences */}
                {comparisonResult.differences.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-orange-600">
                      Differences
                    </h4>
                    <div className="space-y-1">
                      {comparisonResult.differences.map((difference, index) => (
                        <div
                          key={index}
                          className="text-sm p-2 bg-orange-50 rounded"
                        >
                          {difference}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {comparisonResult.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-blue-600">
                      Recommendations
                    </h4>
                    <div className="space-y-1">
                      {comparisonResult.recommendations.map((rec, index) => (
                        <div
                          key={index}
                          className="text-sm p-2 bg-blue-50 rounded"
                        >
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* File Relationships */}
        <TabsContent value="relationships" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Network className="w-4 h-4" />
                File Relationships
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Identify relationships and connections between files
                </p>
                <Button
                  onClick={handleIdentifyRelationships}
                  disabled={files.length < 2}
                  className="flex items-center gap-2"
                >
                  <Network className="w-4 h-4" />
                  Analyze Relationships
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Relationships Results */}
          {fileRelationships.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Discovered Relationships ({fileRelationships.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {fileRelationships.map((relationship, index) => {
                      const file1 = files.find(
                        (f) => f.id === relationship.file1Id,
                      );
                      const file2 = files.find(
                        (f) => f.id === relationship.file2Id,
                      );

                      return (
                        <div
                          key={index}
                          className="p-3 border rounded-lg space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {relationship.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {Math.round(relationship.strength * 100)}%
                                strength
                              </span>
                            </div>
                          </div>
                          <div className="text-sm">
                            <strong>{file1?.name}</strong> ↔{" "}
                            <strong>{file2?.name}</strong>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {relationship.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Analysis Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Total Files
                  </Label>
                  <p className="font-medium">{files.length}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Analyzed
                  </Label>
                  <p className="font-medium">{analysisResults.size}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Relationships
                  </Label>
                  <p className="font-medium">{fileRelationships.length}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    AI Service
                  </Label>
                  <p className="font-medium capitalize">{selectedService}</p>
                </div>
              </div>

              {/* Service Status */}
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                {isReady ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      AI service ready ({currentModel})
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm">AI service not ready</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* No Files Alert */}
      {files.length === 0 && (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Upload files to enable AI-powered analysis. The analyzer can provide
            insights, compare documents, and identify relationships between your
            files.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
