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
  Phone,
  Loader2,
  Volume2,
  CheckCircle,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  playIncomingCall,
  playConnected,
  playEnded,
} from "@/lib/sounds";

type StaffVoiceState =
  | "pending"
  | "joining"
  | "connected"
  | "ended"
  | "error";

type Props = {
  conversationId: string;
  sessionId: string;
  requestedByName: string;
  onEnd: () => void;
};

export function StaffVoiceCall({
  conversationId,
  sessionId,
  requestedByName,
  onEnd,
}: Props) {
  const [state, setState] = useState<StaffVoiceState>("pending");
  const roomRef = useRef<Room | null>(null);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const ringStopRef = useRef<(() => void) | null>(null);

  const cleanup = useCallback(
    async (roomInstance: Room | null, sid: string | null) => {
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

  const handleDecline = useCallback(async () => {
    try {
      await fetch("/api/voice/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, conversationId }),
      });
    } catch {
      // ignore
    }
    setState("ended");
    onEnd();
  }, [sessionId, conversationId, onEnd]);

  const handleAccept = useCallback(async () => {
    setState("joining");

    try {
      // Accept the call (changes status to connecting)
      const acceptRes = await fetch("/api/voice/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, conversationId }),
      });

      if (!acceptRes.ok) {
        const data = await acceptRes.json();
        throw new Error(data.error ?? "Failed to accept call.");
      }

      // Get token to join the room
      const tokenRes = await fetch("/api/voice/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, sessionId }),
      });

      if (!tokenRes.ok) {
        const data = await tokenRes.json();
        throw new Error(data.error ?? "Failed to get voice token.");
      }

      const { token, url } = await tokenRes.json();

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      roomRef.current = room;

      room.on(RoomEvent.Connected, () => {
        setState("connected");
      });

      room.on(RoomEvent.Disconnected, () => {
        setState("ended");
        onEnd();
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
      setError(String(e));
      setState("error");
      await cleanup(roomRef.current, sessionId);
    }
  }, [sessionId, conversationId, cleanup, onEnd]);

  // Sound effects
  useEffect(() => {
    if (state === "pending") {
      ringStopRef.current = playIncomingCall();
    } else {
      if (ringStopRef.current) {
        ringStopRef.current();
        ringStopRef.current = null;
      }
    }

    if (state === "connected") {
      playConnected();
    }

    if (state === "ended" || state === "error") {
      playEnded();
    }

    return () => {
      if (ringStopRef.current) {
        ringStopRef.current();
        ringStopRef.current = null;
      }
    };
  }, [state]);

  // Duration timer
  useEffect(() => {
    if (state !== "connected") return;
    const interval = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
    return () => clearInterval(interval);
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

  // Error
  if (state === "error") {
    return (
      <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-4 text-center">
        <p className="text-sm font-medium text-destructive">
          {error ?? "Failed to join call."}
        </p>
        <Button variant="outline" size="sm" className="mt-2" onClick={onEnd}>
          Close
        </Button>
      </div>
    );
  }

  // Ended
  if (state === "ended") {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-center">
        <p className="text-sm font-medium">Call ended</p>
        {duration > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            Duration: {formatTime(duration)}
          </p>
        )}
      </div>
    );
  }

  // Pending: accept/decline buttons
  if (state === "pending") {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <Phone className="size-5 text-blue-600" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              Incoming voice call
            </p>
            <p className="text-xs text-muted-foreground">
              {requestedByName} wants to talk
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" onClick={handleAccept}>
              <CheckCircle className="mr-1.5 size-3.5" aria-hidden />
              Join
            </Button>
            <Button size="sm" variant="outline" onClick={handleDecline}>
              <XCircle className="mr-1.5 size-3.5" aria-hidden />
              Decline
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Joining
  if (state === "joining") {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-center">
        <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" aria-hidden />
        <p className="mt-2 text-sm font-medium">Joining call…</p>
      </div>
    );
  }

  // Connected
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <Volume2 className="size-5 text-emerald-600" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-emerald-700">
            Voice call in progress
          </p>
          <p className="text-xs text-muted-foreground">
            {formatTime(duration)} · {requestedByName}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant={muted ? "destructive" : "outline"}
            size="sm"
            onClick={toggleMute}
          >
            {muted ? (
              <MicOff className="size-3.5" aria-hidden />
            ) : (
              <Mic className="size-3.5" aria-hidden />
            )}
          </Button>
          <Button variant="destructive" size="sm" onClick={handleEnd}>
            <PhoneOff className="mr-1 size-3.5" aria-hidden />
            End
          </Button>
        </div>
      </div>
    </div>
  );
}
