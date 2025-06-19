import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { puterService } from "@/lib/puter";
import { RefreshCw, Bug, CheckCircle, XCircle } from "lucide-react";

export function PuterDebugInfo() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostics = async () => {
    setIsLoading(true);
    const info: any = {
      timestamp: new Date().toISOString(),
      windowPuter: !!window.puter,
      puterModules: {},
      serviceReady: puterService.isAvailable(),
      healthCheck: null,
      connectionTest: null,
      authCheck: null,
      modelCheck: null,
    };

    try {
      // Check Puter modules
      if (window.puter) {
        info.puterModules = {
          ai: !!window.puter.ai,
          auth: !!window.puter.auth,
          fs: !!window.puter.fs,
          kv: !!window.puter.kv,
        };
      }

      // Health check
      try {
        info.healthCheck = await puterService.healthCheck();
      } catch (error) {
        info.healthCheck = {
          healthy: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }

      // Auth check
      try {
        info.authCheck = await puterService.isSignedIn();
      } catch (error) {
        info.authCheck = {
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }

      // Connection test
      try {
        info.connectionTest = await puterService.testConnection();
      } catch (error) {
        info.connectionTest = {
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }

      // Model check
      try {
        info.modelCheck = await puterService.getAvailableModels();
      } catch (error) {
        info.modelCheck = {
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    } catch (error) {
      info.globalError =
        error instanceof Error ? error.message : "Unknown error";
    }

    setDebugInfo(info);
    setIsLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const StatusBadge = ({
    status,
    label,
  }: {
    status: boolean | null;
    label: string;
  }) => (
    <Badge
      variant={
        status === true
          ? "default"
          : status === false
            ? "destructive"
            : "secondary"
      }
    >
      {status === true ? (
        <CheckCircle className="w-3 h-3 mr-1" />
      ) : status === false ? (
        <XCircle className="w-3 h-3 mr-1" />
      ) : (
        <RefreshCw className="w-3 h-3 mr-1" />
      )}
      {label}
    </Badge>
  );

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bug className="w-5 h-5" />
          <h3 className="font-semibold">Puter Debug Info</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={runDiagnostics}
          disabled={isLoading}
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh
        </Button>
      </div>

      {debugInfo && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={debugInfo.windowPuter} label="Puter SDK" />
            <StatusBadge
              status={debugInfo.serviceReady}
              label="Service Ready"
            />
            <StatusBadge
              status={debugInfo.healthCheck?.healthy}
              label="Health Check"
            />
            <StatusBadge status={debugInfo.connectionTest} label="Connection" />
            <StatusBadge status={debugInfo.authCheck} label="Auth" />
          </div>

          <div className="text-sm space-y-2">
            <div>
              <strong>Timestamp:</strong> {debugInfo.timestamp}
            </div>

            {debugInfo.puterModules && (
              <div>
                <strong>Puter Modules:</strong>
                <ul className="ml-4 mt-1">
                  {Object.entries(debugInfo.puterModules).map(
                    ([module, available]) => (
                      <li key={module} className="flex items-center gap-2">
                        {available ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-500" />
                        )}
                        {module}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}

            {debugInfo.healthCheck && (
              <div>
                <strong>Health Check:</strong>{" "}
                {debugInfo.healthCheck.message ||
                  JSON.stringify(debugInfo.healthCheck)}
              </div>
            )}

            {debugInfo.modelCheck && Array.isArray(debugInfo.modelCheck) && (
              <div>
                <strong>Available Models:</strong> {debugInfo.modelCheck.length}{" "}
                models found
              </div>
            )}

            {debugInfo.globalError && (
              <div className="text-red-500">
                <strong>Global Error:</strong> {debugInfo.globalError}
              </div>
            )}
          </div>

          <details className="text-xs">
            <summary className="cursor-pointer font-medium">
              Raw Debug Data
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </Card>
  );
}
