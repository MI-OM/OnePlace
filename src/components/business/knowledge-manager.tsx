"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2, FileText, Eye, EyeOff, Edit3 } from "lucide-react";
import {
  createKnowledgeItem,
  updateKnowledgeItem,
  deleteKnowledgeItem,
} from "@/lib/business/knowledge-actions";
import type { KnowledgeItem } from "@/lib/business/knowledge-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  businessId: string;
  initialItems: KnowledgeItem[];
};

const CATEGORIES = [
  "FAQ",
  "Policies",
  "Services",
  "Pricing",
  "Hours",
  "Location",
  "About",
  "Other",
];

export function KnowledgeManager({ businessId, initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState(0);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory("");
    setPriority(0);
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!title.trim() || content.trim().length < 10) {
      toast.error("Title and content (10+ chars) required.");
      return;
    }

    startTransition(async () => {
      if (editingId) {
        const result = await updateKnowledgeItem(businessId, editingId, {
          title: title.trim(),
          content: content.trim(),
          category: category || undefined,
          priority,
        });
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Document updated.");
          setItems((prev) =>
            prev.map((item) =>
              item.id === editingId
                ? { ...item, title: title.trim(), content: content.trim(), category: category || null, priority }
                : item,
            ),
          );
          resetForm();
        }
      } else {
        const result = await createKnowledgeItem(businessId, {
          title: title.trim(),
          content: content.trim(),
          category: category || undefined,
          priority,
        });
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Document added.");
          // Refetch items
          const updated = items.concat({
            id: result.id!,
            title: title.trim(),
            content: content.trim(),
            category: category || null,
            priority,
            isActive: true,
            sourceUrl: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          setItems(updated);
          resetForm();
        }
      }
    });
  };

  const handleEdit = (item: KnowledgeItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setCategory(item.category ?? "");
    setPriority(item.priority);
    setShowForm(true);
  };

  const handleToggleActive = (item: KnowledgeItem) => {
    startTransition(async () => {
      const result = await updateKnowledgeItem(businessId, item.id, {
        isActive: !item.isActive,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, isActive: !i.isActive } : i)),
        );
      }
    });
  };

  const handleDelete = (itemId: string) => {
    if (!confirm("Delete this document?")) return;
    startTransition(async () => {
      const result = await deleteKnowledgeItem(businessId, itemId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Document deleted.");
        setItems((prev) => prev.filter((i) => i.id !== itemId));
      }
    });
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {items.length} document{items.length !== 1 ? "s" : ""}
        </span>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          disabled={showForm}
        >
          <Plus className="mr-1.5 size-4" aria-hidden />
          Add document
        </Button>
      </div>

      {showForm && (
        <div className="mt-4 rounded-xl border border-border p-4 space-y-3">
          <h3 className="text-sm font-medium">
            {editingId ? "Edit document" : "New document"}
          </h3>
          <div className="grid gap-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cancellation policy, Hair coloring FAQ"
              maxLength={200}
            />
          </div>
          <div className="grid gap-2">
            <Label>Content</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the content the AI will use to answer customer questions..."
              rows={6}
              maxLength={10000}
            />
            <p className="text-xs text-muted-foreground">
              {content.length}/10,000 characters. The AI uses this to answer questions about your business.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Priority (0–10)</Label>
              <Input
                type="number"
                min={0}
                max={10}
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={pending}>
              {pending ? "Saving..." : editingId ? "Update" : "Add"}
            </Button>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl border border-border p-4 ${!item.isActive ? "opacity-60" : ""}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <h3 className="truncate text-sm font-medium">{item.title}</h3>
                  {item.category && (
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                      {item.category}
                    </span>
                  )}
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                    P{item.priority}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {item.content}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleActive(item)}
                  title={item.isActive ? "Deactivate" : "Activate"}
                >
                  {item.isActive ? (
                    <Eye className="size-4" aria-hidden />
                  ) : (
                    <EyeOff className="size-4" aria-hidden />
                  )}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                  <Edit3 className="size-4" aria-hidden />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="size-4 text-muted-foreground" aria-hidden />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No knowledge documents yet. Add FAQs, policies, and business details for the AI to use.
          </div>
        )}
      </div>
    </div>
  );
}
