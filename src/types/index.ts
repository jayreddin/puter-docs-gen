export interface UploadedFile {
  id: string;
  name: string;
  content: string;
  type: string;
  size: number;
  lastModified: number;
  preview?: string;
  isExpanded?: boolean;
}

export interface ChatMessage {
  id: string;
  type: "user" | "ai" | "system";
  content: string;
  timestamp: number;
  isLoading?: boolean;
}

export interface GeminiModel {
  name: string;
  displayName: string;
  description?: string;
}

export interface AppSettings {
  apiKey: string;
  selectedModel: string;
  theme: "light" | "dark" | "system";
  isApiKeyValid: boolean;
  availableModels: GeminiModel[];
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
