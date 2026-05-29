"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api-client";
import { Building2, ChevronDown, Check } from "lucide-react";

interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
}

export function WorkspaceSwitcher() {
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load workspaces and current workspace
    api
      .listWorkspaces()
      .then((res) => {
        setWorkspaces(res.workspaces);
        // Determine current workspace from localStorage or default
        const storedId = localStorage.getItem("ai_orchestration_workspace_id");
        if (storedId && res.workspaces.some((w) => w.id === storedId)) {
          setCurrentId(storedId);
        } else if (res.workspaces.length > 0) {
          setCurrentId(res.workspaces[0].id);
          localStorage.setItem("ai_orchestration_workspace_id", res.workspaces[0].id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = workspaces.find((w) => w.id === currentId);

  const handleSwitch = async (ws: WorkspaceSummary) => {
    try {
      await api.switchWorkspace(ws.id);
      localStorage.setItem("ai_orchestration_workspace_id", ws.id);
      setCurrentId(ws.id);
      setOpen(false);
      // Reload page to refresh all data for the new workspace
      window.location.reload();
    } catch {
      // best-effort
    }
  };

  if (workspaces.length === 0) return null;

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left hover:bg-bg-hover transition-colors"
      >
        <Building2 className="w-4 h-4 text-primary shrink-0" />
        <span className="flex-1 text-xs font-medium truncate">{current?.name ?? "Workspace"}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-border bg-bg-card shadow-lg overflow-hidden z-50">
          <div className="px-3 py-1.5 text-[10px] text-text-muted font-medium uppercase tracking-wider">
            Workspaces
          </div>
          <div className="max-h-48 overflow-y-auto">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => handleSwitch(ws)}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-bg-hover transition-colors text-left"
              >
                <Building2 className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span className="flex-1 truncate">{ws.name}</span>
                {ws.id === currentId && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
              </button>
            ))}
          </div>
          
        </div>
      )}
    </div>
  );
}
