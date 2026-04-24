"use client";

import type { CSSProperties, RefObject } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { NavMenuPosition } from "@/lib/lifeos-types";

interface RoomsNavChild {
  href: string;
  label: string;
}

interface RoomsNavItem {
  label: string;
  children: RoomsNavChild[];
}

interface RoomsNavGroupProps {
  item: RoomsNavItem;
  isActive: boolean;
  isOpen: boolean;
  roomsMenuPosition: NavMenuPosition;
  activePath: string;
  roomsTriggerRef: RefObject<HTMLButtonElement | null>;
  roomsDropdownRef: RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onClose: () => void;
}

type NavDropdownStyle = CSSProperties & {
  "--nav-dropdown-top"?: string;
  "--nav-dropdown-left"?: string;
};

export function RoomsNavGroup({
  item,
  isActive,
  isOpen,
  roomsMenuPosition,
  activePath,
  roomsTriggerRef,
  roomsDropdownRef,
  onToggle,
  onClose
}: RoomsNavGroupProps) {
  const dropdownStyle: NavDropdownStyle | undefined = isOpen
    ? {
        "--nav-dropdown-top": `${roomsMenuPosition.top}px`,
        "--nav-dropdown-left": `${roomsMenuPosition.left}px`
      }
    : undefined;

  return (
    <div className={`nav-group ${isActive ? "is-active" : ""}`} style={dropdownStyle}>
      <button
        ref={roomsTriggerRef}
        type="button"
        className={`nav-link nav-summary ${isActive ? "is-active" : ""}`}
        onClick={onToggle}
      >
        <span>{item.label}</span>
        <ChevronDown size={14} />
      </button>
      {isOpen ? (
        <div ref={roomsDropdownRef} className="nav-dropdown">
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className={`nav-dropdown-link ${activePath === child.href ? "is-active" : ""}`}
              onClick={onClose}
            >
              {child.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
