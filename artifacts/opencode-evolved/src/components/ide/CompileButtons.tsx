import React, { useState, useCallback } from "react";
import { Play, Square, RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CompileButtonsProps {
  projectId?: number;
  isCompiling?: boolean;
  onCompile?: () => void;
  onStop?: () => void;
  onRefresh?: () => void;
}

export const CompileButtons: React.FC<CompileButtonsProps> = ({
  projectId,
  isCompiling = false,
  onCompile,
  onStop,
  onRefresh,
}) => {
  const handleCompile = useCallback(async () => {
    if (!projectId) {
      toast.error("No project selected");
      return;
    }

    try {
      onCompile?.();
      
      // Aquí se podría llamar a un endpoint de compilación
      const response = await fetch(`/api/projects/${projectId}/compile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Compilation failed");
      }

      toast.success("Project compiled successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    }
  }, [projectId, onCompile]);

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant={isCompiling ? "destructive" : "default"}
        onClick={isCompiling ? onStop : handleCompile}
        className="gap-2"
      >
        {isCompiling ? (
          <>
            <Square className="w-4 h-4" /> Stop
          </>
        ) : (
          <>
            <Play className="w-4 h-4" /> Compile
          </>
        )}
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={onRefresh}
        className="gap-2"
        disabled={isCompiling}
      >
        <RefreshCw className="w-4 h-4" /> Refresh
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          if (projectId) {
            window.open(`/api/projects/${projectId}/export`, "_blank");
          }
        }}
        className="gap-2"
        disabled={isCompiling}
      >
        <Download className="w-4 h-4" /> Export
      </Button>
    </div>
  );
};
