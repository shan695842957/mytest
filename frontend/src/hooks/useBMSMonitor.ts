import { useEffect, useMemo, useState } from 'react';
import type { Level2BMSFrame, Level3BMSFrame } from '@/types';
import { createMockLevel2Frame, createMockLevel3Frame } from '@/utils/bmsMockFactory';

interface MonitorOptions {
  autoRefresh?: boolean;
  intervalMs?: number;
}

const cloneFrame = <T,>(value: T): T =>
  typeof globalThis.structuredClone === 'function'
    ? globalThis.structuredClone(value)
    : JSON.parse(JSON.stringify(value));

export function useLevel3BMSFrame(options: MonitorOptions = {}) {
  const { autoRefresh = true, intervalMs = 4500 } = options;
  const [frame, setFrame] = useState<Level3BMSFrame>(() => createMockLevel3Frame());

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const id = setInterval(() => setFrame(createMockLevel3Frame()), intervalMs);
    return () => clearInterval(id);
  }, [autoRefresh, intervalMs]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    window.BMSLevel3Channel = {
      setFrame: (next: Level3BMSFrame) => setFrame(cloneFrame(next)),
    };
    return () => {
      if (window.BMSLevel3Channel) delete window.BMSLevel3Channel;
    };
  }, []);

  return useMemo(
    () => ({
      frame,
      setFrame,
    }),
    [frame],
  );
}

export function useLevel2BMSFrame(options: MonitorOptions = {}) {
  const { autoRefresh = true, intervalMs = 5200 } = options;
  const [frame, setFrame] = useState<Level2BMSFrame>(() => createMockLevel2Frame());

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const id = setInterval(() => setFrame(createMockLevel2Frame()), intervalMs);
    return () => clearInterval(id);
  }, [autoRefresh, intervalMs]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    window.BMSLevel2Channel = {
      setFrame: (next: Level2BMSFrame) => setFrame(cloneFrame(next)),
    };
    return () => {
      if (window.BMSLevel2Channel) delete window.BMSLevel2Channel;
    };
  }, []);

  return useMemo(
    () => ({
      frame,
      setFrame,
    }),
    [frame],
  );
}
