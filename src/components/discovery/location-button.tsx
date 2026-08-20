"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LocationButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const currentLat = searchParams.get("lat");
  const currentLng = searchParams.get("lng");
  const hasLocation = currentLat && currentLng;

  const handleClick = () => {
    if (hasLocation) {
      // Remove location params
      const params = new URLSearchParams(searchParams.toString());
      params.delete("lat");
      params.delete("lng");
      router.push(`/search?${params.toString()}`);
      return;
    }

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("lat", position.coords.latitude.toFixed(4));
        params.set("lng", position.coords.longitude.toFixed(4));
        setLoading(false);
        router.push(`/search?${params.toString()}`);
      },
      () => {
        setLoading(false);
        alert("Unable to get your location. Please enable location access.");
      },
      { timeout: 10000 },
    );
  };

  return (
    <Button
      variant={hasLocation ? "default" : "outline"}
      size="sm"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-1.5 size-3.5 animate-spin" aria-hidden />
      ) : (
        <MapPin className="mr-1.5 size-3.5" aria-hidden />
      )}
      {hasLocation ? "Clear location" : "Near me"}
    </Button>
  );
}
