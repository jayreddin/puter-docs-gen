import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  RefreshCw,
  Settings,
  Zap,
  Clock,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AIServiceErrorAlertProps {
  error: string;
  currentService: "gemini" | "puter";
  onSwitchService?: (service: "gemini" | "puter") => void;
  onOpenSettings?: () => void;
  onRetry?: () => void;
  className?: string;
}

export function AIServiceErrorAlert({
  error,
  currentService,
  onSwitchService,
  onOpenSettings,
  onRetry,
  className,
}: AIServiceErrorAlertProps) {
  const isUsageLimitError =
    error.includes("usage limit") || error.includes("Permission denied");
  const isAuthError =
    error.includes("Authentication required") || error.includes("sign in");
  const isNetworkError =
    error.includes("Network error") || error.includes("connection");
  const isQuotaError = error.includes("quota") || error.includes("API quota");

  const getErrorType = () => {
    if (isUsageLimitError) return "usage";
    if (isAuthError) return "auth";
    if (isNetworkError) return "network";
    if (isQuotaError) return "quota";
    return "general";
  };

  const getErrorIcon = () => {
    const errorType = getErrorType();
    switch (errorType) {
      case "usage":
        return <Clock className="w-4 h-4" />;
      case "auth":
        return <Shield className="w-4 h-4" />;
      case "network":
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getAlternativeService = () => {
    return currentService === "puter" ? "gemini" : "puter";
  };

  const getAlternativeServiceName = () => {
    return currentService === "puter" ? "Gemini AI" : "Puter AI";
  };

  const getSuggestions = () => {
    const suggestions = [];
    const errorType = getErrorType();

    switch (errorType) {
      case "usage":
        suggestions.push("Wait a few minutes and try again");
        suggestions.push(`Switch to ${getAlternativeServiceName()}`);
        if (currentService === "puter") {
          suggestions.push("Upgrade your Puter account for higher limits");
        }
        break;
      case "auth":
        suggestions.push("Sign in to your account");
        suggestions.push("Check your authentication settings");
        break;
      case "network":
        suggestions.push("Check your internet connection");
        suggestions.push("Try refreshing the page");
        break;
      case "quota":
        suggestions.push("Wait for quota to reset");
        suggestions.push(`Switch to ${getAlternativeServiceName()}`);
        break;
      default:
        suggestions.push("Try again in a few moments");
        suggestions.push(`Switch to ${getAlternativeServiceName()}`);
        break;
    }

    return suggestions;
  };

  return (
    <Alert className={cn("border-l-4 border-l-yellow-500", className)}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{getErrorIcon()}</div>
        <div className="flex-1 space-y-3">
          <AlertDescription>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">AI Service Issue</span>
                <Badge variant="outline" className="text-xs">
                  {currentService === "puter" ? "Puter AI" : "Gemini AI"}
                </Badge>
              </div>
              <p className="text-sm">{error}</p>
            </div>
          </AlertDescription>

          {/* Suggestions */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Suggested Actions:</p>
            <div className="space-y-1">
              {getSuggestions().map((suggestion, index) => (
                <p key={index} className="text-sm text-muted-foreground">
                  • {suggestion}
                </p>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-3 h-3" />
                Try Again
              </Button>
            )}

            {onSwitchService && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSwitchService(getAlternativeService())}
                className="flex items-center gap-2"
              >
                <Zap className="w-3 h-3" />
                Switch to {getAlternativeServiceName()}
              </Button>
            )}

            {onOpenSettings && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenSettings}
                className="flex items-center gap-2"
              >
                <Settings className="w-3 h-3" />
                Settings
              </Button>
            )}
          </div>

          {/* Additional Info */}
          {isUsageLimitError && currentService === "puter" && (
            <div className="pt-2 border-t border-muted-foreground/20">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Tip:</strong> Puter AI offers free usage with daily
                limits. Consider upgrading your Puter account or using Gemini AI
                with your own API key for unlimited access.
              </p>
            </div>
          )}

          {getErrorType() === "auth" && currentService === "gemini" && (
            <div className="pt-2 border-t border-muted-foreground/20">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Tip:</strong> Get a free Gemini API key from Google
                AI Studio, or switch to Puter AI for free usage without API
                keys.
              </p>
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
}
