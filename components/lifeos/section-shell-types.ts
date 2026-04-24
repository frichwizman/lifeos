import type { ComponentType, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export interface CardShellProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}

export interface ModuleCardShellProps {
  title: string;
  color: string;
  icon: LucideIcon;
  children: ReactNode;
}

export type CardShellComponent = ComponentType<CardShellProps>;
export type ModuleCardShellComponent = ComponentType<ModuleCardShellProps>;
