import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  FileText,
  Code,
  FileCode,
  Globe,
  File,
  ChevronDown,
  ChevronRight,
  Edit3,
  X,
  Trash2,
  Save,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadedFile, FileUploadProgress, FileType } from "@/types";
import { formatFileSize } from "@/lib/file-utils";

interface FileListProps {
  files: UploadedFile[];
  uploadProgress: FileUploadProgress[];
  onFileRemove: (fileId: string) => void;
  onFileUpdate: (fileId: string, updates: Partial<UploadedFile>) => void;
  onFileToggle: (fileId: string) => void;
}

const FILE_TYPE_ICONS: Record<FileType, React.ElementType> = {
  markdown: FileText,
  text: FileText,
  code: Code,
  html: Globe,
  document: File,
  unknown: File,
};

const FILE_TYPE_COLORS: Record<FileType, string> = {
  markdown: "text-blue-500",
  text: "text-gray-500",
  code: "text-green-500",
  html: "text-orange-500",
  document: "text-purple-500",
  unknown: "text-gray-400",
};

export function FileList({
  files,
  uploadProgress,
  onFileRemove,
  onFileUpdate,
  onFileToggle,
}: FileListProps) {
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleEditStart = (file: UploadedFile) => {
    setEditingFile(file.id);
    setEditContent(file.content);
  };

  const handleEditSave = (fileId: string) => {
    onFileUpdate(fileId, { content: editContent });
    setEditingFile(null);
    setEditContent("");
    toast.success("File updated successfully!");
  };

  const handleEditCancel = () => {
    setEditingFile(null);
    setEditContent("");
  };

  if (files.length === 0 && uploadProgress.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No files uploaded yet</p>
        <p className="text-xs">Upload files to get started</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3">
        {/* Upload Progress */}
        {uploadProgress.map((progress) => (
          <Card
            key={progress.fileId}
            className="p-3 border-dashed border-chat-primary/30"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{progress.progress}%</span>
              </div>
              <Progress value={progress.progress} className="h-1" />
              {progress.status === "error" && progress.error && (
                <div className="flex items-center gap-1 text-xs text-status-error">
                  <AlertCircle className="w-3 h-3" />
                  {progress.error}
                </div>
              )}
            </div>
          </Card>
        ))}

        {/* File List */}
        {files.map((file) => {
          const Icon = FILE_TYPE_ICONS[file.type];
          const colorClass = FILE_TYPE_COLORS[file.type];
          const isEditing = editingFile === file.id;

          return (
            <Card key={file.id} className="overflow-hidden">
              {/* File Header */}
              <div className="p-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFileToggle(file.id)}
                      className="p-0 h-auto"
                    >
                      {file.isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>

                    <Icon className={cn("w-4 h-4 flex-shrink-0", colorClass)} />

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-2xs">
                          {file.type}
                        </Badge>
                        <span>{formatFileSize(file.size)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditStart(file)}
                        className="p-1 h-auto"
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFileRemove(file.id)}
                      className="p-1 h-auto text-status-error hover:text-status-error"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* File Content */}
              {file.isExpanded && (
                <div className="p-3">
                  {isEditing ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={10}
                        className="font-mono text-xs"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEditSave(file.id)}
                          className="flex-1"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleEditCancel}
                          className="flex-1"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="code-block max-h-64 overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap">
                          {file.content.length > 2000
                            ? file.content.substring(0, 2000) +
                              "\n\n... (truncated)"
                            : file.content}
                        </pre>
                      </div>

                      {file.content.length > 2000 && (
                        <div className="text-xs text-muted-foreground">
                          Showing first 2,000 characters. Click edit to view
                          full content.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Preview when collapsed */}
              {!file.isExpanded && file.preview && (
                <div className="p-3 bg-muted/30">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {file.preview}
                  </p>
                </div>
              )}
            </Card>
          );
        })}

        {/* Summary */}
        {files.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground text-center">
              {files.length} file{files.length !== 1 ? "s" : ""} •{" "}
              {formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}{" "}
              total
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
