import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Upload,
  FileText,
  Paperclip,
  Plus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  onFilesAdded: (files: FileList) => Promise<void>;
  onTextAdded: (content: string, filename?: string) => void;
  dragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isProcessing: boolean;
}

export function FileUploader({
  onFilesAdded,
  onTextAdded,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  isProcessing,
}: FileUploaderProps) {
  const [pastedText, setPastedText] = useState("");
  const [filename, setFilename] = useState("");
  const [activeTab, setActiveTab] = useState("upload");

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await onFilesAdded(files);
    }
    // Reset input
    e.target.value = "";
  };

  const handleAddText = () => {
    if (!pastedText.trim()) return;

    const finalFilename = filename.trim() || `pasted-content-${Date.now()}.txt`;
    onTextAdded(pastedText, finalFilename);

    // Reset form
    setPastedText("");
    setFilename("");
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) {
          const fileList = new DataTransfer();
          fileList.items.add(file);
          onFilesAdded(fileList.files);
        }
      }
    }
  };

  return (
    <Card className="border-dashed">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Files</TabsTrigger>
          <TabsTrigger value="paste">Paste Text</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="p-4 space-y-4">
          {/* Drag & Drop Area */}
          <div
            className={cn(
              "upload-area p-8 text-center transition-all duration-200",
              dragOver && "drag-over",
            )}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onPaste={handlePaste}
          >
            <div className="flex flex-col items-center space-y-4">
              {isProcessing ? (
                <Loader2 className="w-8 h-8 text-chat-primary animate-spin" />
              ) : (
                <Upload
                  className={cn(
                    "w-8 h-8 transition-colors",
                    dragOver ? "text-chat-primary" : "text-muted-foreground",
                  )}
                />
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {isProcessing
                    ? "Processing files..."
                    : "Drop files here or click to upload"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports: .md, .txt, .js, .ts, .py, .html, .css, .json, .doc,
                  etc.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => document.getElementById("file-input")?.click()}
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  Choose Files
                </Button>
              </div>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            id="file-input"
            type="file"
            multiple
            accept=".md,.mdx,.txt,.js,.ts,.jsx,.tsx,.py,.html,.css,.json,.yml,.yaml,.doc,.docx"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="w-3 h-3" />
            <span>Max 10MB per file, 50 files total</span>
          </div>
        </TabsContent>

        <TabsContent value="paste" className="p-4 space-y-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="filename" className="text-sm font-medium">
                Filename (optional)
              </Label>
              <Input
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="my-document.md"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="content" className="text-sm font-medium">
                Content
              </Label>
              <Textarea
                id="content"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste your text content here..."
                rows={8}
                className="mt-1 font-mono text-sm"
              />
            </div>

            <Button
              onClick={handleAddText}
              disabled={!pastedText.trim() || isProcessing}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Text Content
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
