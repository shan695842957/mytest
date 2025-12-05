/**
 * 拓扑编辑器历史记录管理 Hook
 */

import { useState, useCallback } from 'react'
import type { EditorState } from '@/types/topology'

interface HistoryResult<T> {
  state: T
  set: (newState: T) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  pushState: (newState: T) => void
}

const MAX_HISTORY = 50

export function useHistory<T>(initialState: T): HistoryResult<T> {
  const [history, setHistory] = useState<{ past: T[]; present: T; future: T[] }>({
    past: [],
    present: initialState,
    future: [],
  })

  const canUndo = history.past.length > 0
  const canRedo = history.future.length > 0

  const undo = useCallback(() => {
    setHistory((curr) => {
      if (curr.past.length === 0) return curr

      const previous = curr.past[curr.past.length - 1]
      const newPast = curr.past.slice(0, curr.past.length - 1)

      return {
        past: newPast,
        present: previous,
        future: [curr.present, ...curr.future],
      }
    })
  }, [])

  const redo = useCallback(() => {
    setHistory((curr) => {
      if (curr.future.length === 0) return curr

      const next = curr.future[0]
      const newFuture = curr.future.slice(1)

      return {
        past: [...curr.past, curr.present],
        present: next,
        future: newFuture,
      }
    })
  }, [])

  // Use this when creating a new history entry (e.g., drag end, drop, connect)
  const pushState = useCallback((newState: T) => {
    setHistory((curr) => {
      const newPast = [...curr.past, curr.present]
      if (newPast.length > MAX_HISTORY) {
        newPast.shift()
      }
      return {
        past: newPast,
        present: newState,
        future: [], // Clear future on new action
      }
    })
  }, [])

  // Use this for transient updates (e.g., dragging) where we don't want a history entry yet
  const set = useCallback((newState: T) => {
    setHistory((curr) => ({
      ...curr,
      present: newState,
    }))
  }, [])

  return {
    state: history.present,
    set,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
  }
}

