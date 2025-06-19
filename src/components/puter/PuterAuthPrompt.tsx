import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LogIn,
  Shield,
  Zap,
  Gift,
  CheckCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { puterService } from "@/lib/puter";
import { toast } from "sonner";

interface PuterAuthPromptProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export function PuterAuthPrompt({ onSuccess, onCancel }: PuterAuthPromptProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<
    "excellent" | "good" | "poor" | "disconnected"
  >("disconnected");

  const handleSignIn = async () => {
    setIsLoading(true);
    setProgress(0);
    setAuthStatus("Initiating sign-in...");

    try {
      // Step 1: Check if already signed in
      setProgress(20);
      const alreadySignedIn = await puterService.isSignedIn();
      if (alreadySignedIn) {
        setProgress(100);
        setAuthStatus("Already signed in!");

        // Get auth status for connection quality
        const status = await puterService.getAuthStatus();
        setConnectionQuality(status.connectionQuality);

        toast.success("Already authenticated with Puter!");
        onSuccess();
        return;
      }

      // Step 2: Initiate sign-in
      setProgress(40);
      setAuthStatus("Opening sign-in window...");
      await puterService.signIn();

      // Step 3: Verify authentication
      setProgress(70);
      setAuthStatus("Verifying authentication...");
      const isSignedIn = await puterService.isSignedIn();

      if (isSignedIn) {
        // Step 4: Get connection status
        setProgress(90);
        setAuthStatus("Checking connection quality...");
        const status = await puterService.getAuthStatus();
        setConnectionQuality(status.connectionQuality);

        setProgress(100);
        setAuthStatus("Authentication successful!");
        toast.success(
          `Successfully signed in to Puter! Connection: ${status.connectionQuality}`,
        );
        onSuccess();
      } else {
        throw new Error("Sign-in completed but verification failed");
      }
    } catch (error) {
      console.error("Sign-in error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to sign in to Puter";
      setAuthStatus(`Error: ${errorMessage}`);
      setProgress(0);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Connect to Puter AI</h2>
          <p className="text-muted-foreground">
            Sign in to access free AI models and cloud storage
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center space-y-2">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Gift className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-medium">Free AI Access</h3>
            <p className="text-sm text-muted-foreground">
              GPT-4o, Claude, Gemini & more
            </p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-medium">Cloud Storage</h3>
            <p className="text-sm text-muted-foreground">
              Save & sync your documents
            </p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-medium">No API Keys</h3>
            <p className="text-sm text-muted-foreground">
              Just sign in and start using
            </p>
          </div>
        </div>

        {/* Available Models */}
        <div className="space-y-3">
          <h3 className="font-medium">Available AI Models:</h3>
          <div className="flex flex-wrap gap-2">
            {[
              "GPT-4o",
              "GPT-4o Mini",
              "Claude 3.5 Sonnet",
              "Gemini 2.0 Flash",
              "DeepSeek Chat",
              "Llama 3.1",
              "Mistral Large",
              "Grok Beta",
            ].map((model) => (
              <Badge key={model} variant="outline" className="text-xs">
                {model}
              </Badge>
            ))}
          </div>
        </div>

        {/* Status */}
        {authStatus && (
          <Alert>
            <AlertDescription className="space-y-3">
              <div className="flex items-center gap-2">
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {authStatus}
              </div>

              {/* Progress Bar */}
              {isLoading && (
                <div className="space-y-1">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {progress}% complete
                  </p>
                </div>
              )}

              {/* Connection Quality */}
              {connectionQuality !== "disconnected" && !isLoading && (
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      connectionQuality === "excellent" && "bg-green-500",
                      connectionQuality === "good" && "bg-yellow-500",
                      connectionQuality === "poor" && "bg-red-500",
                    )}
                  />
                  <span className="text-sm capitalize">
                    {connectionQuality} connection
                  </span>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In to Puter
              </>
            )}
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild className="flex-1">
              <a
                href="https://puter.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Create Account
              </a>
            </Button>

            {onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Privacy Note */}
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>
            Puter is privacy-focused and doesn't track or monetize your data.
          </p>
          <p>Your usage costs are covered by your Puter account.</p>
        </div>
      </div>
    </Card>
  );
}
