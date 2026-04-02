import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CompilationLog {
  id: string;
  timestamp: Date;
  level: "info" | "error" | "warning" | "success";
  message: string;
  source?: string;
}

interface BuildPanel {
  isOpen: boolean;
  onToggle: () => void;
  logs: CompilationLog[];
  isBuilding: boolean;
  lastBuildTime?: Date;
}

export const BuildPanel: React.FC<BuildPanel> = ({
  isOpen,
  onToggle,
  logs,
  isBuilding,
  lastBuildTime,
}) => {
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const errorCount = logs.filter((l) => l.level === "error").length;
  const warningCount = logs.filter((l) => l.level === "warning").length;

  const getLogColor = (level: string) => {
    switch (level) {
      case "error":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      case "success":
        return "text-green-400";
      default:
        return "text-gray-400";
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "success":
        return "✅";
      default:
        return "ℹ️";
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 border-t border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 hover:bg-gray-800 transition-colors">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 flex-1 text-left"
        >
          {isOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          <span className="font-semibold text-sm">Build Output</span>
          
          {/* Status indicators */}
          <div className="flex items-center gap-2 ml-auto">
            {isBuilding && (
              <Loader className="w-4 h-4 animate-spin text-blue-400" />
            )}
            {errorCount > 0 && (
              <div className="flex items-center gap-1 text-red-400 text-xs">
                <AlertCircle size={14} />
                {errorCount}
              </div>
            )}
            {warningCount > 0 && (
              <div className="flex items-center gap-1 text-yellow-400 text-xs">
                ⚠️ {warningCount}
              </div>
            )}
            {!isBuilding && errorCount === 0 && (
              <CheckCircle className="w-4 h-4 text-green-400" />
            )}
          </div>
        </button>
      </div>

      {/* Content */}
      {isOpen && (
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Logs container */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto overflow-x-hidden p-4 font-mono text-xs bg-gray-950"
          >
            {logs.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                <p>No build logs yet</p>
                <p className="text-xs mt-2">Logs will appear here when building</p>
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={cn(
                      "flex gap-2 text-xs",
                      getLogColor(log.level)
                    )}
                  >
                    <span className="flex-shrink-0">
                      {getLogIcon(log.level)}
                    </span>
                    <span className="text-gray-500 flex-shrink-0">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    {log.source && (
                      <span className="text-blue-400 flex-shrink-0">
                        [{log.source}]
                      </span>
                    )}
                    <span className="break-words">{log.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-900 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="w-3 h-3"
              />
              Auto scroll
            </label>
            <div>
              {lastBuildTime && (
                <span>
                  Last build: {lastBuildTime.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
