"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Download, Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExportButton } from "@/components/ui/export-button";
import { exportAdminAuditCSV } from "@/lib/admin-reports";

type AuditLog = {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  actor_user_id: string | null;
  business_id: string | null;
  ip_address: string | null;
  created_at: string;
};

const ENTITY_TYPES = [
  "businesses",
  "business_members",
  "reviews",
  "conversations",
  "user_roles",
  "service_requests",
];

const ACTION_TYPES = ["INSERT", "UPDATE", "DELETE"];

function DiffView({
  oldValues,
  newValues,
}: {
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
}) {
  if (!oldValues && !newValues) return <span className="text-muted-foreground">—</span>;

  const allKeys = new Set([
    ...Object.keys(oldValues ?? {}),
    ...Object.keys(newValues ?? {}),
  ]);

  const changes: { key: string; old: string; new: string }[] = [];
  for (const key of allKeys) {
    const oldVal = oldValues?.[key];
    const newVal = newValues?.[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({
        key,
        old: oldVal == null ? "—" : String(oldVal),
        new: newVal == null ? "—" : String(newVal),
      });
    }
  }

  if (changes.length === 0) return <span className="text-muted-foreground">No changes</span>;

  return (
    <div className="space-y-1">
      {changes.map((c) => (
        <div key={c.key} className="text-xs">
          <span className="font-medium">{c.key}:</span>{" "}
          <span className="text-red-600 line-through">{c.old}</span>
          {" → "}
          <span className="text-green-600">{c.new}</span>
        </div>
      ))}
    </div>
  );
}

export function AuditLogViewer({ initialLogs }: { initialLogs: AuditLog[] }) {
  const [logs, setLogs] = useState(initialLogs);
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [daysFilter, setDaysFilter] = useState<string>("30");
  const [pending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/audit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityType: entityFilter === "all" ? undefined : entityFilter,
            action: actionFilter === "all" ? undefined : actionFilter,
            days: Number(daysFilter),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs ?? []);
          toast.success("Audit log refreshed.");
        }
      } catch {
        toast.error("Failed to refresh audit log.");
      }
    });
  };

  const filtered = logs.filter((log) => {
    if (entityFilter !== "all" && log.entity_type !== entityFilter) return false;
    if (actionFilter !== "all" && !log.action.includes(actionFilter)) return false;
    return true;
  });

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-end gap-4">
        <div className="grid gap-1.5">
          <Label className="text-sm">Entity type</Label>
          <Select value={entityFilter} onValueChange={(v) => setEntityFilter(v ?? "all")}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All entities</SelectItem>
              {ENTITY_TYPES.map((et) => (
                <SelectItem key={et} value={et}>
                  {et}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label className="text-sm">Action</Label>
          <Select value={actionFilter} onValueChange={(v) => setActionFilter(v ?? "all")}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {ACTION_TYPES.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label className="text-sm">Time range</Label>
          <Select value={daysFilter} onValueChange={(v) => setDaysFilter(v ?? "30")}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={pending}>
          <RefreshCw className={`mr-1 size-3.5 ${pending ? "animate-spin" : ""}`} />
          Refresh
        </Button>

        <ExportButton
          label="Export"
          fetchCSV={() =>
            exportAdminAuditCSV({
              entityType: entityFilter === "all" ? undefined : entityFilter,
              action: actionFilter === "all" ? undefined : actionFilter,
              days: Number(daysFilter),
            })
          }
          filename={`audit-log-${new Date().toISOString().slice(0, 10)}`}
        />
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Showing {filtered.length} of {logs.length} entries
      </p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                Timestamp
              </th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                Action
              </th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                Entity
              </th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                Actor
              </th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                Changes
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                  No audit log entries found.
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        log.action === "INSERT"
                          ? "bg-green-100 text-green-800"
                          : log.action === "UPDATE"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    <span className="font-medium">{log.entity_type}</span>
                    {log.entity_id && (
                      <span className="ml-1 text-muted-foreground">
                        {log.entity_id.slice(0, 8)}…
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">
                    {log.actor_user_id
                      ? `${log.actor_user_id.slice(0, 8)}…`
                      : "system"}
                  </td>
                  <td className="max-w-xs px-3 py-2.5">
                    <DiffView
                      oldValues={log.old_values}
                      newValues={log.new_values}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
