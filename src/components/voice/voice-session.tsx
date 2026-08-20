"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  RoomEvent,
  Room,
  Track,
} from "livekit-client";
import {
  Mic,
  MicOff,
  PhoneOff,
  Loader2,
  Volume2,
  Phone,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  playRinging,
  playConnected,
  playEnded,
} from "@/lib/sounds";

type VoiceState =
  | "requesting"
  | "waiting"
  | "connecting"
  | "connected"
  | "ended"
  | "timed_out"
  | "declined"
  | "error";

const TIMEOUT_SECONDS = 60;

type Props = {
  conversationId: string;
  sessionId: string;
  onEnd: () => void;
};

export function VoiceSession({ conversationId, sessionId, onEnd }: Props) {
  const [state, setState] = useState<VoiceState>("requesting");
  const roomRef = useRef<Room | null>(null);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [waitTime, setWaitTime] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ringStopRef = useRef<(() => void) | null>(null);

  // Cleanup helper
  const cleanup = useCallback(
    async (roomInstance: Room | null, sid: string | null) => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (roomInstance) {
        await roomInstance.disconnect();
      }
      if (sid) {
        try {
          await fetch("/api/voice/end", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: sid }),
          });
        } catch {
          // best effort
        }
      }
    },
    [],
  );

  const handleEnd = useCallback(async () => {
    setState("ended");
    await cleanup(roomRef.current, sessionId);
    onEnd();
  }, [sessionId, cleanup, onEnd]);

  // Step 1: Request the call on mount
  useEffect(() => {
    let cancelled = false;

    async function request() {
      try {
        const res = await fetch("/api/voice/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to request call.");
        }

        if (!cancelled) {
          setState("waiting");
        }
      } catch (e) {
        if (!cancelled) {
          setError(String(e));
          setState("error");
        }
      }
    }

    request();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // Step 2: Poll for staff acceptance (waiting → connecting)
  useEffect(() => {
    if (state !== "waiting") return;

    const supabase = createClient();

    // Realtime: listen for voice_sessions status change
    const channel = supabase
      .channel(`voice-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "voice_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (row.status === "connecting" || row.status === "active") {
            setState("connecting");
          } else if (row.status === "declined") {
            setState("declined");
          } else if (row.status === "ended" || row.status === "timed_out") {
            setState("timed_out");
          }
        },
      )
      .subscribe();

    // Also poll every 3s as fallback
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/voice/status?sessionId=${sessionId}`,
        );
        if (res.ok) {
          const data = await res.json();
          if (data.status === "connecting" || data.status === "active") {
            setState("connecting");
          } else if (data.status === "declined") {
            setState("declined");
          } else if (
            data.status === "ended" ||
            data.status === "timed_out"
          ) {
            setState("timed_out");
          }
        }
      } catch {
        // ignore
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [state, sessionId]);

  // Step 3: 60-second timeout
  useEffect(() => {
    if (state !== "waiting") return;

    timeoutRef.current = setTimeout(() => {
      setState("timed_out");
      // Tell server to time out
      fetch("/api/voice/timeout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, conversationId }),
      }).catch(() => {});
    }, TIMEOUT_SECONDS * 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [state, sessionId, conversationId]);

  // Step 4: Connect to LiveKit when staff accepts
  useEffect(() => {
    if (state !== "connecting") return;
    let cancelled = false;

    async function connectToRoom() {
      try {
        const res = await fetch("/api/voice/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, sessionId }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to connect.");
        }

        if (cancelled) return;

        const { token, url } = await res.json();

        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });
        roomRef.current = room;

        room.on(RoomEvent.Connected, () => {
          if (!cancelled) setState("connected");
        });

        room.on(RoomEvent.Disconnected, () => {
          if (!cancelled) {
            setState("ended");
            onEnd();
          }
        });

        room.on(RoomEvent.TrackSubscribed, (track) => {
          if (track.kind === Track.Kind.Audio) {
            const el = track.attach();
            el.style.display = "none";
            document.body.appendChild(el);
          }
        });

        await room.connect(url, token);
        await room.localParticipant.setMicrophoneEnabled(true);
      } catch (e) {
        if (!cancelled) {
          setError(String(e));
          setState("error");
          await cleanup(roomRef.current, sessionId);
        }
      }
    }

    connectToRoom();

    return () => {
      cancelled = true;
    };
  }, [state, conversationId, sessionId, cleanup, onEnd]);

  // Duration timer (when connected)
  useEffect(() => {
    if (state !== "connected") return;
    const interval = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [state]);

  // Wait timer (counting up while waiting)
  useEffect(() => {
    if (state !== "waiting") return;
    const interval = setInterval(() => {
      setWaitTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [state]);

  // Sound effects
  useEffect(() => {
    if (state === "waiting") {
      ringStopRef.current = playRinging();
    } else {
      // Stop ringing on any other state
      if (ringStopRef.current) {
        ringStopRef.current();
        ringStopRef.current = null;
      }
    }

    if (state === "connected") {
      playConnected();
    }

    if (state === "ended" || state === "timed_out" || state === "declined") {
      playEnded();
    }

    return () => {
      if (ringStopRef.current) {
        ringStopRef.current();
        ringStopRef.current = null;
      }
    };
  }, [state]);

  const toggleMute = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    const newMuted = !muted;
    room.localParticipant.setMicrophoneEnabled(!newMuted);
    setMuted(newMuted);
  }, [muted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Error state
  if (state === "error") {
    return (
      <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-6 text-center">
        <p className="text-sm font-medium text-destructive">
          {error ?? "Voice connection failed."}
        </p>
        <Button variant="outline" className="mt-4" onClick={onEnd}>
          Close
        </Button>
      </div>
    );
  }

  // Declined
  if (state === "declined") {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <div className="mx-auto size-16 rounded-full bg-muted flex items-center justify-center">
          <PhoneOff className="size-7 text-muted-foreground" aria-hidden />
        </div>
        <p className="mt-3 text-sm font-medium">Call declined</p>
        <p className="mt-1 text-xs text-muted-foreground">
          The team is currently unavailable. Try sending a message instead.
        </p>
        <Button variant="outline" className="mt-4" onClick={onEnd}>
          Close
        </Button>
      </div>
    );
  }

  // Timed out
  if (state === "timed_out") {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <div className="mx-auto size-16 rounded-full bg-muted flex items-center justify-center">
          <Clock className="size-7 text-muted-foreground" aria-hidden />
        </div>
        <p className="mt-3 text-sm font-medium">No one joined the call</p>
        <p className="mt-1 text-xs text-muted-foreground">
          The team didn&apos;t respond within 60 seconds. They may be busy right now.
        </p>
        <Button variant="outline" className="mt-4" onClick={onEnd}>
          Close
        </Button>
      </div>
    );
  }

  // Ended
  if (state === "ended") {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <div className="mx-auto size-16 rounded-full bg-muted flex items-center justify-center">
          <PhoneOff className="size-7 text-muted-foreground" aria-hidden />
        </div>
        <p className="mt-3 text-sm font-medium">Call ended</p>
        {duration > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            Duration: {formatTime(duration)}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div
          className={`size-16 rounded-full flex items-center justify-center ${
            state === "connected"
              ? "bg-emerald-100 text-emerald-600"
              : state === "connecting"
                ? "bg-blue-100 text-blue-600 animate-pulse"
                : "bg-amber-100 text-amber-600 animate-pulse"
          }`}
        >
          {state === "connected" ? (
            <Volume2 className="size-7" aria-hidden />
          ) : state === "connecting" ? (
            <Loader2 className="size-7 animate-spin" aria-hidden />
          ) : (
            <Phone className="size-7" aria-hidden />
          )}
        </div>

        <div>
          {state === "requesting" && (
            <p className="text-sm font-medium">Starting call…</p>
          )}
          {state === "waiting" && (
            <>
              <p className="text-sm font-medium">
                Waiting for a team member to join…
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {waitTime}s / {TIMEOUT_SECONDS}s
              </p>
            </>
          )}
          {state === "connecting" && (
            <p className="text-sm font-medium">Staff joined — connecting…</p>
          )}
          {state === "connected" && (
            <>
              <p className="text-sm font-medium text-emerald-600">
                Voice connected
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatTime(duration)}
              </p>
            </>
          )}
        </div>
      </div>

      {(state === "connecting" || state === "connected") && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <Button
            variant={muted ? "destructive" : "outline"}
            size="lg"
            onClick={toggleMute}
            disabled={state !== "connected"}
          >
            {muted ? (
              <MicOff className="mr-2 size-4" aria-hidden />
            ) : (
              <Mic className="mr-2 size-4" aria-hidden />
            )}
            {muted ? "Unmute" : "Mute"}
          </Button>
          <Button variant="destructive" size="lg" onClick={handleEnd}>
            <PhoneOff className="mr-2 size-4" aria-hidden />
            End call
          </Button>
        </div>
      )}

      {state === "waiting" && (
        <div className="mt-5">
          <Button variant="destructive" size="lg" onClick={handleEnd}>
            <PhoneOff className="mr-2 size-4" aria-hidden />
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
