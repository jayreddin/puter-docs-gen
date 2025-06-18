import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Copy,
  Download,
  Eye,
  EyeOff,
  Minimize2,
  Maximize2,
  FileText,
  Shrink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GeneratedContent as GeneratedContentType } from "@/types";
import { downloadFile } from "@/lib/file-utils";

interface GeneratedContentProps {
  content: GeneratedContentType;
  onCondense: (content: string) => Promise<string>;
  documentName: string;
}

export function GeneratedContent({
  content,
  onCondense,
  documentName,
}: GeneratedContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAsMarkdown, setShowAsMarkdown] = useState(
    content.showAsMarkdown ?? true,
  );
  const [isCondensing, setIsCondensing] = useState(false);
  const [condensedContent, setCondensedContent] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content.content);
      toast.success("Content copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy content");
    }
  };

  const handleDownload = () => {
    const filename = `${documentName || "compiled-document"}.md`;
    downloadFile(content.content, filename, "text/markdown");
    toast.success("Document downloaded!");
  };

  const handleCondense = async () => {
    setIsCondensing(true);
    try {
      const condensed = await onCondense(content.content);
      setCondensedContent(condensed);
      toast.success("Content condensed for LLM use!");
    } catch (error) {
      toast.error("Failed to condense content");
    } finally {
      setIsCondensing(false);
    }
  };

  const handleCopyCondensed = async () => {
    if (!condensedContent) return;

    try {
      await navigator.clipboard.writeText(condensedContent);
      toast.success("Condensed content copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy condensed content");
    }
  };

  const contentToShow = condensedContent || content.content;
  const isCondensed = !!condensedContent;

  return (
    <div className="w-full">
      <Card className="border border-chat-primary/20 bg-gradient-to-r from-chat-surface/50 to-chat-surface-alt/50">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-chat-primary" />
              <h3 className="font-semibold">Generated Document</h3>
              {isCondensed && (
                <Badge variant="secondary" className="text-xs">
                  Condensed
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAsMarkdown(!showAsMarkdown)}
                title={showAsMarkdown ? "Show Raw Text" : "Show Markdown"}
              >
                {showAsMarkdown ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Minimize" : "Expand"}
              >
                {isExpanded ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Generated: {new Date(content.timestamp).toLocaleString()} •{" "}
            {content.content.length.toLocaleString()} characters
          </div>
        </div>

        {/* Content */}
        <div className={cn("p-4", !isExpanded && "max-h-96 overflow-hidden")}>
          <ScrollArea className={cn(isExpanded ? "h-[60vh]" : "h-full")}>
            <div
              className={cn(
                "font-mono text-sm leading-relaxed",
                showAsMarkdown ? "prose prose-invert max-w-none" : "code-block",
              )}
            >
              {showAsMarkdown ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: contentToShow
                      .replace(/\n/g, "<br>")
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\*(.*?)\*/g, "<em>$1</em>")
                      .replace(/`(.*?)`/g, "<code>$1</code>")
                      .replace(/^# (.*$)/gm, "<h1>$1</h1>")
                      .replace(/^## (.*$)/gm, "<h2>$1</h2>")
                      .replace(/^### (.*$)/gm, "<h3>$1</h3>"),
                  }}
                />
              ) : (
                <pre className="whitespace-pre-wrap">{contentToShow}</pre>
              )}
            </div>
          </ScrollArea>

          {!isExpanded && (
            <div className="absolute bottom-4 left-4 right-4 h-8 bg-gradient-to-t from-chat-surface to-transparent pointer-events-none" />
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className="flex-1 min-w-[120px]"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>

            <Button
              onClick={handleDownload}
              variant="outline"
              size="sm"
              className="flex-1 min-w-[120px]"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>

            <Button
              onClick={handleCondense}
              disabled={isCondensing || isCondensed}
              variant="outline"
              size="sm"
              className="flex-1 min-w-[120px]"
            >
              <Shrink className="w-4 h-4 mr-2" />
              {isCondensing
                ? "Condensing..."
                : isCondensed
                  ? "Condensed"
                  : "Condense"}
            </Button>

            {condensedContent && (
              <Button
                onClick={handleCopyCondensed}
                variant="outline"
                size="sm"
                className="flex-1 min-w-[120px] border-chat-accent text-chat-accent"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Condensed
              </Button>
            )}
          </div>

          {isCondensed && (
            <div className="mt-2 text-xs text-muted-foreground">
              Original: {content.content.length.toLocaleString()} chars →
              Condensed: {condensedContent?.length.toLocaleString()} chars (
              {Math.round(
                ((content.content.length - (condensedContent?.length || 0)) /
                  content.content.length) *
                  100,
              )}
              % reduction)
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
