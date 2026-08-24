"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Ambient } from "@/lib/ambient";

type ExperienceValue = {
  /** True once the visitor has pressed INITIATE SYSTEM. */
  started: boolean;
  start: () => void;
  audio: boolean;
  toggleAudio: () => void;
};

const ExperienceContext = createContext<ExperienceValue | null>(null);

export function ExperienceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [started, setStarted] = useState(false);
  const [audio, setAudio] = useState(true);
  const ambient = useRef<Ambient | null>(null);

  // Scrolling stays locked behind the preloader so the intro reads as a gate.
  useEffect(() => {
    document.documentElement.classList.toggle("is-locked", !started);
    return () => document.documentElement.classList.remove("is-locked");
  }, [started]);

  useEffect(() => () => ambient.current?.dispose(), []);

  const start = useCallback(() => {
    setStarted(true);
    // Must be created inside the click gesture for autoplay policies.
    ambient.current ??= new Ambient();
    ambient.current.start();
  }, []);

  const toggleAudio = useCallback(() => {
    setAudio((on) => {
      ambient.current?.setEnabled(!on);
      return !on;
    });
  }, []);

  const value = useMemo(
    () => ({ started, start, audio, toggleAudio }),
    [started, start, audio, toggleAudio],
  );

  return (
    <ExperienceContext.Provider value={value}>
      {children}
    </ExperienceContext.Provider>
  );
}

export function useExperience() {
  const ctx = useContext(ExperienceContext);
  if (!ctx) throw new Error("useExperience must be used inside ExperienceProvider");
  return ctx;
}
