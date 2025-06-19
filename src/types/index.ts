export interface UploadedFile {
  id: string;
  name: string;
  content: string;
  type: string;
  size: number;
  lastModified: number;
  preview?: string;
  isExpanded?: boolean;
  // Enhanced fields for text extraction
  extractedText?: string;
  analysisResult?: FileAnalysis;
  processingStatus?: ProcessingStatus;
  metadata?: FileMetadata;
}

export interface FileMetadata {
  wordCount?: number;
  lineCount?: number;
  characterCount?: number;
  language?: string;
  encoding?: string;
  fileStructure?: FileStructure;
}

export interface FileStructure {
  headers: HeaderInfo[];
  sections: SectionInfo[];
  codeBlocks: CodeBlockInfo[];
  lists: ListInfo[];
}

export interface HeaderInfo {
  level: number;
  text: string;
  line: number;
}

export interface SectionInfo {
  title: string;
  content: string;
  startLine: number;
  endLine: number;
}

export interface CodeBlockInfo {
  language?: string;
  content: string;
  startLine: number;
  endLine: number;
}

export interface ListInfo {
  type: "ordered" | "unordered";
  items: string[];
  startLine: number;
  endLine: number;
}

export interface FileAnalysis {
  summary: string;
  keyPoints: string[];
  topics: string[];
  sentiment?: "positive" | "negative" | "neutral";
  complexity?: "low" | "medium" | "high";
  readabilityScore?: number;
  suggestions: string[];
}

export interface ProcessingStatus {
  stage:
    | "pending"
    | "extracting"
    | "analyzing"
    | "combining"
    | "complete"
    | "error";
  progress: number;
  message?: string;
  error?: string;
}

export interface ChatMessage {
  id: string;
  type: "user" | "ai" | "system";
  content: string;
  timestamp: number;
  isLoading?: boolean;
  // Enhanced fields for file-aware chat
  attachedFiles?: string[]; // File IDs
  contextSummary?: string;
  aiInsights?: string[];
}

export interface GeminiModel {
  name: string;
  displayName: string;
  description?: string;
}

export interface PuterModel {
  name: string;
  displayName: string;
  description?: string;
  provider?: string;
}

export interface AppSettings {
  apiKey: string;
  selectedModel: string;
  selectedService: "gemini" | "puter";
  theme: "light" | "dark" | "system";
  isApiKeyValid: boolean;
  isPuterConnected: boolean;
  availableModels: GeminiModel[];
  availablePuterModels: PuterModel[];
  // Enhanced settings
  authStatus: AuthStatus;
  processingPreferences: ProcessingPreferences;
}

export interface AuthStatus {
  isSignedIn: boolean;
  username?: string;
  lastConnected?: number;
  connectionQuality: "excellent" | "good" | "poor" | "disconnected";
  retryCount?: number;
}

export interface ProcessingPreferences {
  autoExtractText: boolean;
  autoAnalyzeFiles: boolean;
  combinationStrategy: "smart" | "chronological" | "manual";
  outputFormat: "markdown" | "html" | "plain";
  includeMetadata: boolean;
  preserveFormatting: boolean;
}

export interface GeneratedContent {
  id: string;
  content: string;
  timestamp: number;
  isCondensed?: boolean;
  showAsMarkdown?: boolean;
}

export interface FileProcessingOptions {
  includeMetadata: boolean;
  preserveFormatting: boolean;
  addSeparators: boolean;
}

export interface ScrapedUrl {
  url: string;
  title: string;
  content: string;
  timestamp: number;
}

export type FileType =
  | "markdown"
  | "text"
  | "code"
  | "html"
  | "document"
  | "unknown";

export interface FileUploadProgress {
  fileId: string;
  progress: number;
  status: "uploading" | "processing" | "complete" | "error";
  error?: string;
}

export interface ChatState {
  messages: ChatMessage[];
  files: UploadedFile[];
  generatedContent: GeneratedContent | null;
  isProcessing: boolean;
  currentStep:
    | "initial"
    | "collecting_files"
    | "ready_to_generate"
    | "generated";
  expectedFileCount: number;
  documentName: string;
}

export interface FolderScanResult {
  files: File[];
  totalFiles: number;
  supportedFiles: number;
  unsupportedFiles: string[];
}

// File Combination Interfaces
export interface CombinationOptions {
  strategy: "smart" | "chronological" | "manual";
  includeTableOfContents: boolean;
  addSeparators: boolean;
  preserveStructure: boolean;
  removeEmptyLines: boolean;
  combineCodeBlocks: boolean;
  outputFormat: "markdown" | "html" | "plain";
  title?: string;
  description?: string;
}

export interface CombinationResult {
  content: string;
  metadata: CombinationMetadata;
  warnings: string[];
  suggestions: string[];
}

export interface CombinationMetadata {
  filesProcessed: number;
  totalWordCount: number;
  totalCharacterCount: number;
  duplicatesRemoved: number;
  sectionsCreated: number;
  processingTime: number;
}

// AI Enhancement Interfaces
export interface AIFileContext {
  files: UploadedFile[];
  combinedContent?: string;
  analysisResults: Map<string, FileAnalysis>;
  relationships: FileRelationship[];
}

export interface FileRelationship {
  file1Id: string;
  file2Id: string;
  type: "similar" | "complementary" | "duplicate" | "reference";
  strength: number; // 0-1
  description: string;
}

export interface DocumentAnalysis {
  structure: FileStructure;
  quality: QualityMetrics;
  insights: string[];
  recommendations: string[];
}

export interface QualityMetrics {
  completeness: number; // 0-1
  clarity: number; // 0-1
  consistency: number; // 0-1
  organization: number; // 0-1
}

export interface ComparisonResult {
  similarities: string[];
  differences: string[];
  recommendations: string[];
  score: number; // 0-1
}

// Processing Pipeline Interfaces
export interface ProcessingPipelineStep {
  id: string;
  name: string;
  description: string;
  status: "pending" | "running" | "complete" | "error" | "skipped";
  progress: number;
  startTime?: number;
  endTime?: number;
  error?: string;
  result?: any;
}

export interface ProcessingPipeline {
  id: string;
  name: string;
  files: UploadedFile[];
  steps: ProcessingPipelineStep[];
  overallProgress: number;
  status: "idle" | "running" | "complete" | "error" | "cancelled";
  startTime?: number;
  endTime?: number;
  result?: CombinationResult;
}

// Export Options
export interface ExportOptions {
  format: "markdown" | "html" | "pdf" | "docx" | "txt";
  includeMetadata: boolean;
  includeTableOfContents: boolean;
  filename?: string;
  destination: "download" | "cloud" | "clipboard";
}

export interface ExportResult {
  success: boolean;
  filename?: string;
  url?: string;
  error?: string;
  size?: number;
}
