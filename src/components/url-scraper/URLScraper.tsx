import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Globe, Loader2, X, AlertCircle } from "lucide-react";

interface URLScraperProps {
  onUrlAdded: (url: string) => Promise<void>;
  isProcessing: boolean;
  onClose: () => void;
}

export function URLScraper({
  onUrlAdded,
  isProcessing,
  onClose,
}: URLScraperProps) {
  const [url, setUrl] = useState("");
  const [isValid, setIsValid] = useState(true);

  const validateUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (value) {
      setIsValid(validateUrl(value));
    } else {
      setIsValid(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    if (!validateUrl(url)) {
      toast.error("Please enter a valid URL");
      setIsValid(false);
      return;
    }

    try {
      await onUrlAdded(url);
      setUrl("");
      toast.success("URL content added successfully!");
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to scrape URL";
      toast.error(message);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && validateUrl(text)) {
        handleUrlChange(text);
      } else {
        toast.error("Clipboard doesn't contain a valid URL");
      }
    } catch (error) {
      toast.error("Failed to read from clipboard");
    }
  };

  return (
    <Card className="border-dashed border-chat-accent/30">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-chat-accent" />
            <h3 className="text-sm font-medium">Add URL Content</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 h-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="url" className="text-sm font-medium">
              Website URL
            </Label>
            <div className="mt-1 flex gap-2">
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://example.com/article"
                className={cn(
                  "flex-1",
                  !isValid && "border-status-error focus:ring-status-error",
                )}
                disabled={isProcessing}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePaste}
                disabled={isProcessing}
              >
                Paste
              </Button>
            </div>
            {!isValid && (
              <div className="mt-1 flex items-center gap-1 text-xs text-status-error">
                <AlertCircle className="w-3 h-3" />
                Please enter a valid URL
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-3 h-3 mt-0.5 text-status-warning" />
              <div>
                <p className="font-medium mb-1">Note about URL scraping:</p>
                <p>
                  Due to CORS restrictions, some websites may not be accessible.
                  This works best with sites that allow cross-origin requests or
                  simple HTML pages.
                </p>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={!url.trim() || !isValid || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scraping URL...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add URL Content
              </>
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
}

function cn(...args: any[]) {
  return args.filter(Boolean).join(" ");
}
