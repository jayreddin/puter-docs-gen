import { useState, useCallback, useRef } from "react";
import {
  UploadedFile,
  FileUploadProgress,
  FolderScanResult,
  ScrapedUrl,
} from "@/types";
import {
  processFileUpload,
  scanFolder,
  validateFiles,
  scrapeUrl,
  generateFileId,
  MAX_TOTAL_FILES,
} from "@/lib/file-utils";
import { storage } from "@/lib/storage";

export function useFileHandler() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>(
    [],
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Load files from session storage on mount
  const loadStoredFiles = useCallback(() => {
    const storedFiles = storage.getFiles();
    setFiles(storedFiles);
  }, []);

  // Save files to session storage
  const saveFiles = useCallback((updatedFiles: UploadedFile[]) => {
    setFiles(updatedFiles);
    storage.saveFiles(updatedFiles);
  }, []);

  const addFile = useCallback(
    async (file: File): Promise<void> => {
      if (files.length >= MAX_TOTAL_FILES) {
        throw new Error(`Maximum ${MAX_TOTAL_FILES} files allowed`);
      }

      const fileId = generateFileId();
      const progress: FileUploadProgress = {
        fileId,
        progress: 0,
        status: "uploading",
      };

      setUploadProgress((prev) => [...prev, progress]);
      setError(null);

      try {
        // Update progress
        setUploadProgress((prev) =>
          prev.map((p) =>
            p.fileId === fileId
              ? { ...p, progress: 50, status: "processing" }
              : p,
          ),
        );

        const uploadedFile = await processFileUpload(file);

        // Update progress to complete
        setUploadProgress((prev) =>
          prev.map((p) =>
            p.fileId === fileId
              ? { ...p, progress: 100, status: "complete" }
              : p,
          ),
        );

        const updatedFiles = [...files, uploadedFile];
        saveFiles(updatedFiles);

        // Remove progress after a delay
        setTimeout(() => {
          setUploadProgress((prev) => prev.filter((p) => p.fileId !== fileId));
        }, 1000);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to process file";

        setUploadProgress((prev) =>
          prev.map((p) =>
            p.fileId === fileId
              ? { ...p, status: "error", error: errorMessage }
              : p,
          ),
        );

        setError(errorMessage);

        // Remove failed progress after delay
        setTimeout(() => {
          setUploadProgress((prev) => prev.filter((p) => p.fileId !== fileId));
        }, 3000);
      }
    },
    [files, saveFiles],
  );

  const addFiles = useCallback(
    async (fileList: FileList): Promise<void> => {
      setIsProcessing(true);
      const promises: Promise<void>[] = [];

      for (let i = 0; i < fileList.length; i++) {
        promises.push(addFile(fileList[i]));
      }

      try {
        await Promise.all(promises);
      } finally {
        setIsProcessing(false);
      }
    },
    [addFile],
  );

  const addTextContent = useCallback(
    (content: string, filename?: string): void => {
      const file: UploadedFile = {
        id: generateFileId(),
        name: filename || `pasted-content-${Date.now()}.txt`,
        content,
        type: "text",
        size: content.length,
        lastModified: Date.now(),
        preview:
          content.substring(0, 200) + (content.length > 200 ? "..." : ""),
        isExpanded: false,
      };

      const updatedFiles = [...files, file];
      saveFiles(updatedFiles);
    },
    [files, saveFiles],
  );

  const removeFile = useCallback(
    (fileId: string): void => {
      const updatedFiles = files.filter((file) => file.id !== fileId);
      saveFiles(updatedFiles);
    },
    [files, saveFiles],
  );

  const updateFile = useCallback(
    (fileId: string, updates: Partial<UploadedFile>): void => {
      const updatedFiles = files.map((file) =>
        file.id === fileId ? { ...file, ...updates } : file,
      );
      saveFiles(updatedFiles);
    },
    [files, saveFiles],
  );

  const toggleFileExpansion = useCallback(
    (fileId: string): void => {
      const updatedFiles = files.map((file) =>
        file.id === fileId ? { ...file, isExpanded: !file.isExpanded } : file,
      );
      saveFiles(updatedFiles);
    },
    [files, saveFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        const fileList = e.dataTransfer.files;
        await addFiles(fileList);
      }
    },
    [addFiles],
  );

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const openFolderDialog = useCallback(() => {
    folderInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (selectedFiles) {
        await addFiles(selectedFiles);
      }
      // Reset input
      if (e.target) {
        e.target.value = "";
      }
    },
    [addFiles],
  );

  const scanFolderContents = useCallback(
    async (fileList: FileList): Promise<FolderScanResult> => {
      return scanFolder(fileList);
    },
    [],
  );

  const addScrapedUrl = useCallback(
    async (url: string): Promise<void> => {
      setIsProcessing(true);
      setError(null);

      try {
        const scraped = await scrapeUrl(url);
        const file: UploadedFile = {
          id: generateFileId(),
          name: `${scraped.title}.md`,
          content: `# ${scraped.title}\n\nSource: ${url}\n\n${scraped.content}`,
          type: "markdown",
          size: scraped.content.length,
          lastModified: Date.now(),
          preview: scraped.content.substring(0, 200) + "...",
          isExpanded: false,
        };

        const updatedFiles = [...files, file];
        saveFiles(updatedFiles);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to scrape URL";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    },
    [files, saveFiles],
  );

  const validateAllFiles = useCallback(() => {
    return validateFiles(files);
  }, [files]);

  const clearAllFiles = useCallback(() => {
    setFiles([]);
    storage.saveFiles([]);
    setUploadProgress([]);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getFilesForCompilation = useCallback(() => {
    return files.map((file) => ({
      name: file.name,
      content: file.content,
    }));
  }, [files]);

  return {
    files,
    uploadProgress,
    isProcessing,
    error,
    dragOver,
    fileInputRef,
    folderInputRef,
    loadStoredFiles,
    addFile,
    addFiles,
    addTextContent,
    removeFile,
    updateFile,
    toggleFileExpansion,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    openFileDialog,
    openFolderDialog,
    handleFileInputChange,
    scanFolderContents,
    addScrapedUrl,
    validateAllFiles,
    clearAllFiles,
    clearError,
    getFilesForCompilation,
  };
}
