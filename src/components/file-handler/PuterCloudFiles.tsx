import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Cloud,
  Download,
  Upload,
  FileText,
  Folder,
  RefreshCw,
  Plus,
  Save,
  Loader2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { puterService } from "@/lib/puter";

interface PuterCloudFilesProps {
  onFileSelected: (content: string, filename: string) => void;
  onFilesImported: (files: Array<{ name: string; content: string }>) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function PuterCloudFiles({
  onFileSelected,
  onFilesImported,
  isOpen,
  onClose,
}: PuterCloudFilesProps) {
  const [cloudFiles, setCloudFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && puterService.isAvailable()) {
      loadCloudFiles();
    }
  }, [isOpen]);

  const loadCloudFiles = async () => {
    setIsLoading(true);
    try {
      const files = await puterService.listCloudFiles();
      setCloudFiles(files.filter((file) => !file.is_dir)); // Only show files, not directories
    } catch (error) {
      toast.error("Failed to load cloud files");
      console.error("Load cloud files error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (file: any) => {
    try {
      const content = await puterService.readFileFromCloud(file.path);
      onFileSelected(content, file.name);
      toast.success(`Imported ${file.name} from Puter cloud`);
    } catch (error) {
      toast.error(`Failed to read ${file.name}`);
      console.error("Read file error:", error);
    }
  };

  const handleMultiSelect = (filePath: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(filePath)) {
      newSelected.delete(filePath);
    } else {
      newSelected.add(filePath);
    }
    setSelectedFiles(newSelected);
  };

  const handleImportSelected = async () => {
    if (selectedFiles.size === 0) {
      toast.error("No files selected");
      return;
    }

    setIsLoading(true);
    try {
      const files: Array<{ name: string; content: string }> = [];

      for (const filePath of selectedFiles) {
        const file = cloudFiles.find((f) => f.path === filePath);
        if (file) {
          try {
            const content = await puterService.readFileFromCloud(file.path);
            files.push({ name: file.name, content });
          } catch (error) {
            console.error(`Failed to read ${file.name}:`, error);
          }
        }
      }

      if (files.length > 0) {
        onFilesImported(files);
        toast.success(`Imported ${files.length} files from Puter cloud`);
        setSelectedFiles(new Set());
        onClose();
      } else {
        toast.error("Failed to import any files");
      }
    } catch (error) {
      toast.error("Failed to import selected files");
      console.error("Import files error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToCloud = async (filename: string, content: string) => {
    setIsUploading(true);
    try {
      await puterService.saveFileToCloud(filename, content);
      toast.success(`Saved ${filename} to Puter cloud`);
      loadCloudFiles(); // Refresh the list
    } catch (error) {
      toast.error(`Failed to save ${filename}`);
      console.error("Save file error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.toLowerCase().split(".").pop();
    if (["md", "mdx", "txt"].includes(ext || "")) {
      return <FileText className="w-4 h-4 text-blue-500" />;
    }
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  if (!isOpen) return null;

  return (
    <Card className="border border-chat-primary/20">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-chat-primary" />
            <h3 className="font-semibold">Puter Cloud Storage</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadCloudFiles}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
        </div>

        {!puterService.isAvailable() && (
          <div className="text-center text-muted-foreground py-8">
            <Cloud className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Puter service not available</p>
            <p className="text-sm">
              Please reload the page to use cloud features
            </p>
          </div>
        )}

        {puterService.isAvailable() && (
          <>
            <ScrollArea className="h-64 mb-4">
              {cloudFiles.length === 0 && !isLoading && (
                <div className="text-center text-muted-foreground py-8">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No files found in your cloud storage</p>
                  <p className="text-sm">Upload some files to get started</p>
                </div>
              )}

              {cloudFiles.map((file) => (
                <div
                  key={file.path}
                  className={cn(
                    "flex items-center justify-between p-3 border rounded-lg mb-2 cursor-pointer transition-colors",
                    selectedFiles.has(file.path)
                      ? "border-chat-primary bg-chat-primary/10"
                      : "border-border hover:border-chat-primary/50",
                  )}
                  onClick={() => handleMultiSelect(file.path)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {selectedFiles.has(file.path) ? (
                        <div className="w-4 h-4 bg-chat-primary rounded-sm flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        getFileIcon(file.name)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)} •{" "}
                        {new Date(file.modified).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileSelect(file);
                    }}
                    className="flex-shrink-0"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </ScrollArea>

            <div className="flex gap-2">
              <Button
                onClick={handleImportSelected}
                disabled={selectedFiles.size === 0 || isLoading}
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Import Selected ({selectedFiles.size})
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  // This would open a file upload dialog or similar
                  toast.info("File upload feature coming soon!");
                }}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
              </Button>
            </div>

            <div className="mt-3 text-xs text-muted-foreground bg-muted/50 p-3 rounded">
              <p>
                Select multiple files and click "Import Selected" to add them to
                your document compilation. Files are imported from your Puter
                cloud storage.
              </p>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
