"use client";

import { useCallback, useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { updateProfile } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Profile = {
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  location: string | null;
};

export function AccountProfileForm({
  profile,
  userEmail,
}: {
  profile: Profile | null;
  userEmail: string;
}) {
  const [displayName, setDisplayName] = useState(
    profile?.display_name ?? "",
  );
  const [location, setLocation] = useState(profile?.location ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be under 5MB.");
        return;
      }
      setUploading(true);
      try {
        const supabase = createClient();
        const ext = file.name.split(".").pop() ?? "jpg";
        const filePath = `avatars/${Date.now()}.${ext}`;

        const { error } = await supabase.storage
          .from("profile-images")
          .upload(filePath, file, { upsert: true });

        if (error) throw error;

        const { data } = supabase.storage
          .from("profile-images")
          .getPublicUrl(filePath);

        setAvatarUrl(data.publicUrl);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [],
  );

  const handleRemoveAvatar = useCallback(() => {
    setAvatarUrl(null);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);

    const result = await updateProfile({
      displayName,
      location: location || undefined,
      avatarUrl,
    });

    setPending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Profile updated.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-5">
        <div className="relative group">
          <Avatar size="lg" className="size-20">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={displayName} />
            ) : (
              <AvatarFallback className="text-lg">
                {initials || "?"}
              </AvatarFallback>
            )}
          </Avatar>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
            aria-label="Change profile picture"
          >
            {uploading ? (
              <Loader2 className="size-5 text-white animate-spin" />
            ) : (
              <Camera className="size-5 text-white" />
            )}
          </button>
          {avatarUrl && !uploading && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow transition-opacity group-hover:opacity-100"
              aria-label="Remove profile picture"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          <p>Click the photo to upload a profile picture.</p>
          <p>PNG, JPG, or WebP. Max 5MB.</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadAvatar(file);
            e.target.value = "";
          }}
          className="hidden"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={userEmail} disabled className="opacity-60" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          maxLength={60}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, province"
          maxLength={120}
        />
      </div>

      <Button type="submit" disabled={pending || uploading}>
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
