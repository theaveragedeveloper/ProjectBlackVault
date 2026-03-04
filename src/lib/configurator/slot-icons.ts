import {
  Crosshair,
  Target,
  Zap,
  AlignJustify,
  Hand,
  Package,
  Sun,
  Scan,
  Layers,
  Settings,
  RefreshCw,
  ArrowLeftRight,
  Shield,
  Link,
  Wind,
  Cog,
  LucideIcon,
} from "lucide-react";
import { SlotType } from "@/lib/types";

export interface SlotIconConfig {
  icon: LucideIcon;
  color: string;
}

export const SLOT_ICONS: Record<SlotType, SlotIconConfig> = {
  OPTIC: { icon: Crosshair, color: "#00C2FF" },
  OPTIC_MOUNT: { icon: Crosshair, color: "#00C2FF" },
  BARREL: { icon: Target, color: "#8B9DB0" },
  BARREL_NUT: { icon: Cog, color: "#8B9DB0" },
  UPPER_RECEIVER: { icon: Target, color: "#8B9DB0" },
  MUZZLE: { icon: Zap, color: "#F5A623" },
  COMPENSATOR: { icon: Zap, color: "#F5A623" },
  SUPPRESSOR: { icon: Zap, color: "#F5A623" },
  GAS_BLOCK: { icon: Wind, color: "#8B9DB0" },
  GAS_TUBE: { icon: Wind, color: "#8B9DB0" },
  BCG: { icon: RefreshCw, color: "#00C853" },
  STOCK: { icon: AlignJustify, color: "#8B9DB0" },
  PISTOL_BRACE: { icon: AlignJustify, color: "#8B9DB0" },
  BUFFER_TUBE: { icon: AlignJustify, color: "#8B9DB0" },
  BUFFER: { icon: Package, color: "#8B9DB0" },
  BUFFER_SPRING: { icon: Cog, color: "#8B9DB0" },
  GRIP: { icon: Hand, color: "#8B9DB0" },
  FRAME: { icon: Hand, color: "#8B9DB0" },
  MAGAZINE: { icon: Package, color: "#F5A623" },
  MAGWELL: { icon: Package, color: "#8B9DB0" },
  LIGHT: { icon: Sun, color: "#F5A623" },
  LASER: { icon: Scan, color: "#00C2FF" },
  UNDERBARREL: { icon: Layers, color: "#8B9DB0" },
  BIPOD: { icon: Layers, color: "#8B9DB0" },
  TRIGGER: { icon: Settings, color: "#8B9DB0" },
  CHARGING_HANDLE: { icon: RefreshCw, color: "#8B9DB0" },
  SLIDE: { icon: ArrowLeftRight, color: "#8B9DB0" },
  LOWER_RECEIVER: { icon: Shield, color: "#8B9DB0" },
  HANDGUARD: { icon: Shield, color: "#8B9DB0" },
  SLING: { icon: Link, color: "#8B9DB0" },
};
