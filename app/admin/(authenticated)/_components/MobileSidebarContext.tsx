"use client";

import { createContext, useContext, useState } from "react";

// Shared open/closed state for the mobile sidebar drawer — Sidebar and
// Topbar are two separate components (Sidebar renders the drawer,
// Topbar renders the hamburger button that opens it), so this is the
// simplest way for them to coordinate without lifting state through the
// Server Component layout that renders both of them.
const MobileSidebarContext = createContext<{ open: boolean; setOpen: (v: boolean) => void } | null>(null);

export function MobileSidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <MobileSidebarContext.Provider value={{ open, setOpen }}>{children}</MobileSidebarContext.Provider>;
}

export function useMobileSidebar() {
  const ctx = useContext(MobileSidebarContext);
  if (!ctx) throw new Error("useMobileSidebar must be used within MobileSidebarProvider");
  return ctx;
}
