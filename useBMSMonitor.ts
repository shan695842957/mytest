import { useEffect, useMemo, useState } from 'react';
import type { Level2BMSSnapshot, Level3BMSSnapshot } from '@/types';
import { createMockLevel2Snapshot, createMockLevel3Snapshot } from '@/utils/bmsMockFactory';

interface MonitorOptions {
  autoRefresh?: boolean;
  intervalMs?: number;
}

const cloneSnapshot = <T,>(value: T): T =>
  typeof globalThis.structuredClone === 'function'
    ? globalThis.structuredClone(value)
    : JSON.parse(JSON.stringify(value));

export function useLevel3BMSMonitor(options: MonitorOptions = {}) {
  const { autoRefresh = true, intervalMs = 5000 } = options;
  const [snapshot, setSnapshot] = useState<Level3BMSSnapshot>(() => createMockLevel3Snapshot());

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const id = setInterval(() => setSnapshot(createMockLevel3Snapshot()), intervalMs);
    return () => clearInterval(id);
  }, [autoRefresh, intervalMs]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    window.BMSLevel3API = {
      setSnapshot: (next) => {
        setSnapshot(cloneSnapshot(next));
      },
    };
    return () => {
      if (window.BMSLevel3API) {
        delete window.BMSLevel3API;
      }
    };
  }, []);

  return useMemo(
    () => ({
      snapshot,
      setSnapshot,
    }),
    [snapshot],
  );
}

export function useLevel2BMSMonitor(options: MonitorOptions = {}) {
  const { autoRefresh = true, intervalMs = 6000 } = options;
  const [snapshot, setSnapshot] = useState<Level2BMSSnapshot>(() => createMockLevel2Snapshot());

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const id = setInterval(() => setSnapshot(createMockLevel2Snapshot()), intervalMs);
    return () => clearInterval(id);
  }, [autoRefresh, intervalMs]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    window.BMSLevel2API = {
      setSnapshot: (next) => {
        setSnapshot(cloneSnapshot(next));
      },
    };
    return () => {
      if (window.BMSLevel2API) {
        delete window.BMSLevel2API;
      }
    };
  }, []);

  return useMemo(
    () => ({
      snapshot,
      setSnapshot,
    }),
    [snapshot],
  );
}
