"use client";

import { createContext, useContext, type ReactNode } from "react";

const PlaygroundContext = createContext(false);
PlaygroundContext.displayName = "PlaygroundContext";

export function PlaygroundProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  return (
    <PlaygroundContext.Provider value={enabled}>
      {children}
    </PlaygroundContext.Provider>
  );
}

export function usePlayground(): boolean {
  return useContext(PlaygroundContext);
}
