import {
  Dumbbell,
  Heart,
  Home,
  Scissors,
  Sparkles,
  Store,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  scissors: Scissors,
  sparkles: Sparkles,
  home: Home,
  heart: Heart,
  dumbbell: Dumbbell,
  wrench: Wrench,
};

export function CategoryIcon({
  name,
  className,
}: {
  name: string | null;
  className?: string;
}) {
  const Icon = (name && ICONS[name]) || Store;
  return <Icon className={className} aria-hidden />;
}
