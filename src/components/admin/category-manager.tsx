"use client";

import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import { Edit, Plus, Trash2 } from "lucide-react";

import type { AdminCategory } from "@/lib/admin";
import { createCategory, updateCategory, deleteCategory } from "@/lib/admin-actions";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ActiveToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-border transition-colors ${
        checked ? "bg-primary" : "bg-muted"
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`pointer-events-none block size-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

type Props = {
  categories: AdminCategory[];
};

export function CategoryManager({ categories: initial }: Props) {
  const [categories, setCategories] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", icon: "", imageUrl: "" });

  const handleCreate = useCallback(() => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Name and slug required.");
      return;
    }
    startTransition(async () => {
      const result = await createCategory({
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase().replace(/\s+/g, "-"),
        icon: form.icon || undefined,
        imageUrl: form.imageUrl || undefined,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Category created.");
        setForm({ name: "", slug: "", icon: "", imageUrl: "" });
        setShowCreate(false);
        setCategories((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            name: form.name.trim(),
            slug: form.slug.trim().toLowerCase().replace(/\s+/g, "-"),
            icon: form.icon || null,
            imageUrl: form.imageUrl || null,
            isActive: true,
            businessCount: 0,
          },
        ]);
      }
    });
  }, [form]);

  const handleUpdate = useCallback(
    (id: string, data: Partial<AdminCategory>) => {
      startTransition(async () => {
        const result = await updateCategory(id, {
          name: data.name,
          icon: data.icon ?? undefined,
          imageUrl: data.imageUrl ?? undefined,
          isActive: data.isActive,
        });
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Updated.");
          setCategories((prev) =>
            prev.map((c) => (c.id === id ? { ...c, ...data } : c)),
          );
          setEditingId(null);
        }
      });
    },
    [],
  );

  const handleDelete = useCallback((id: string) => {
    if (!confirm("Delete this category?")) return;
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Deleted.");
        setCategories((prev) => prev.filter((c) => c.id !== id));
      }
    });
  }, []);

  return (
    <div className="mt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowCreate(!showCreate)}
        disabled={pending}
      >
        <Plus className="mr-1 size-4" />
        Add category
      </Button>

      {showCreate && (
        <div className="mt-4 rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Category name"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="category-slug"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Icon (emoji)</Label>
              <Input
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                placeholder="e.g. 🧹"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Image URL (external link)</Label>
              <Input
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div>
              <ImageUpload
                bucket="business-images"
                path={`categories/${form.slug || "new"}`}
                value={null}
                onChange={(url) => {
                  if (url) setForm((f) => ({ ...f, imageUrl: url }));
                }}
                label="Or upload an image"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={pending}>
              {pending ? "Creating..." : "Create"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
          >
            <span className="text-lg">{cat.icon ?? "📂"}</span>
            <div className="flex-1 min-w-0">
              {editingId === cat.id ? (
                <EditForm
                  category={cat}
                  onSave={(data) => handleUpdate(cat.id, data)}
                  onCancel={() => setEditingId(null)}
                  pending={pending}
                />
              ) : (
                <div>
                  <p className="font-medium truncate">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">
                    /{cat.slug} · {cat.businessCount} businesses
                  </p>
                </div>
              )}
            </div>
            {editingId !== cat.id && (
              <div className="flex items-center gap-1">
                <ActiveToggle
                  checked={cat.isActive}
                  onChange={(val) => handleUpdate(cat.id, { isActive: val })}
                />
                <button
                  onClick={() => setEditingId(cat.id)}
                  className="p-1.5 text-muted-foreground hover:text-foreground"
                  aria-label="Edit"
                >
                  <Edit className="size-4" />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="p-1.5 text-muted-foreground hover:text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EditForm({
  category,
  onSave,
  onCancel,
  pending,
}: {
  category: AdminCategory;
  onSave: (data: Partial<AdminCategory>) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [name, setName] = useState(category.name);
  const [icon, setIcon] = useState(category.icon ?? "");
  const [imageUrl, setImageUrl] = useState(category.imageUrl ?? "");

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
        <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Icon" className="w-20" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL" className="flex-1" />
        <ImageUpload
          bucket="business-images"
          path={`categories/${category.slug}`}
          value={imageUrl || null}
          onChange={(url) => setImageUrl(url ?? "")}
          label="Or upload"
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave({ name, icon: icon || null, imageUrl: imageUrl || null })} disabled={pending}>
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
