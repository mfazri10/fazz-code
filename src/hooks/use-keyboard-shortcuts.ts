"use client";

import { useCallback,useEffect } from "react";

type ShortcutHandler = () => void;

interface Shortcut {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: ShortcutHandler;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const metaMatch = shortcut.meta
          ? event.metaKey || event.ctrlKey
          : !event.metaKey && !event.ctrlKey;
        const shiftMatch = shortcut.shift
          ? event.shiftKey
          : !event.shiftKey;
        const altMatch = shortcut.alt
          ? event.altKey
          : !event.altKey;

        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          metaMatch &&
          shiftMatch &&
          altMatch
        ) {
          event.preventDefault();
          shortcut.handler();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// Pre-defined shortcuts
export const SHORTCUTS = {
  SEND_CHAT: { key: "Enter", meta: true, description: "Send chat message" },
  COMMAND_PALETTE: { key: "k", meta: true, description: "Open command palette" },
  SAVE_FILE: { key: "s", meta: true, description: "Save file" },
  TOGGLE_CHAT: { key: "1", meta: true, description: "Toggle chat panel" },
  TOGGLE_EDITOR: { key: "2", meta: true, description: "Toggle editor panel" },
  TOGGLE_PREVIEW: { key: "3", meta: true, description: "Toggle preview panel" },
  NEW_FILE: { key: "n", meta: true, shift: true, description: "New file" },
  CLOSE_FILE: { key: "w", meta: true, description: "Close file" },
} as const;
