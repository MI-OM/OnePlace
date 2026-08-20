"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Volume2, VolumeX } from "lucide-react";
import {
  getSoundPrefs,
  setSoundPrefs,
  playNotification,
  playIncomingCall,
  playRinging,
  playConnected,
  playEnded,
} from "@/lib/sounds";
import type { SoundPrefs } from "@/lib/sounds";
import { Button } from "@/components/ui/button";

export function SoundSettings() {
  const [prefs, setPrefs] = useState<SoundPrefs>(getSoundPrefs);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPrefs(getSoundPrefs());
    setMounted(true);
  }, []);

  const update = (key: keyof SoundPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSoundPrefs(next);
    toast.success(`${key.replace(/([A-Z])/g, " $1").trim()} ${value ? "on" : "off"}`);
  };

  if (!mounted) return null;

  const items: { key: keyof SoundPrefs; label: string; desc: string; test: () => void }[] = [
    {
      key: "incomingCall",
      label: "Incoming call ring",
      desc: "Ring when a customer requests a voice call",
      test: playIncomingCall,
    },
    {
      key: "ringing",
      label: "Call waiting tone",
      desc: "Tone while waiting for a team member to join",
      test: playRinging,
    },
    {
      key: "callConnected",
      label: "Call connected",
      desc: "Tone when a voice call connects",
      test: playConnected,
    },
    {
      key: "callEnded",
      label: "Call ended",
      desc: "Tone when a voice call ends",
      test: playEnded,
    },
    {
      key: "notification",
      label: "Notification sounds",
      desc: "Tone for new messages and notifications",
      test: playNotification,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        {prefs.notification || prefs.incomingCall || prefs.ringing ? (
          <Volume2 className="size-4 text-muted-foreground" aria-hidden />
        ) : (
          <VolumeX className="size-4 text-muted-foreground" aria-hidden />
        )}
        <span className="text-sm text-muted-foreground">
          All sounds are stored locally in your browser.
        </span>
      </div>

      {items.map((item) => (
        <div
          key={item.key}
          className="flex items-center justify-between rounded-lg border border-border p-3"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{item.label}</p>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={item.test}
              className="text-xs"
            >
              Test
            </Button>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[item.key]}
              onClick={() => update(item.key, !prefs[item.key])}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                prefs[item.key] ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none block size-4 rounded-full bg-background shadow-sm transition-transform ${
                  prefs[item.key] ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
