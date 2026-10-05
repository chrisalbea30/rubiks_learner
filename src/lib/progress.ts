"use client";

// Learning progress, kept in the browser for now. The shape is deliberately simple
// (id -> status) so it can move to a Supabase table later without changing callers.
import { useCallback, useSyncExternalStore } from "react";

export type Status = "learning" | "learned";
type Store = Record<string, Status | true>;

const KEY = "cfop-progress-v1";
const EMPTY: Store = {};
const listeners = new Set<() => void>();
let cache: Store | null = null;

function read(): Store {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Store;
  } catch {
    cache = {};
  }
  return cache;
}

function write(next: Store) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage unavailable (private mode); keep in memory
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useProgress() {
  const store = useSyncExternalStore(subscribe, read, () => EMPTY);
  const setStatus = useCallback((id: string, status: Status | null) => {
    const next = { ...read() };
    if (status) next[id] = status;
    else delete next[id];
    write(next);
  }, []);
  const toggle = useCallback((id: string) => {
    const next = { ...read() };
    if (next[id]) delete next[id];
    else next[id] = true;
    write(next);
  }, []);
  return {
    status: (id: string) => (store[id] === true ? undefined : (store[id] as Status | undefined)),
    checked: (id: string) => store[id] === true,
    setStatus,
    toggle,
  };
}

// Solve times for the practice timer
const TIMES_KEY = "cfop-times-v1";
const timeListeners = new Set<() => void>();
let timesCache: number[] | null = null;
const NO_TIMES: number[] = [];

function readTimes(): number[] {
  if (timesCache) return timesCache;
  try {
    timesCache = JSON.parse(localStorage.getItem(TIMES_KEY) ?? "[]") as number[];
  } catch {
    timesCache = [];
  }
  return timesCache;
}

function writeTimes(t: number[]) {
  timesCache = t;
  try {
    localStorage.setItem(TIMES_KEY, JSON.stringify(t));
  } catch {}
  timeListeners.forEach((l) => l());
}

function subscribeTimes(l: () => void) {
  timeListeners.add(l);
  return () => {
    timeListeners.delete(l);
  };
}

export function useTimes() {
  const times = useSyncExternalStore(subscribeTimes, readTimes, () => NO_TIMES);
  return { times, ...TIME_ACTIONS };
}

const TIME_ACTIONS = {
  add: (ms: number) => writeTimes([ms, ...readTimes()].slice(0, 500)),
  remove: (i: number) => writeTimes(readTimes().filter((_, j) => j !== i)),
  clear: () => writeTimes([]),
};
