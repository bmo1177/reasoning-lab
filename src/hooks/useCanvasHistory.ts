import { useState, useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

interface UseCanvasHistoryReturn {
  pushState: (nodes: Node[], edges: Edge[]) => void;
  undo: () => HistoryState | null;
  redo: () => HistoryState | null;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
}

export function useCanvasHistory(maxHistory = 50): UseCanvasHistoryReturn {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const pushState = useCallback((nodes: Node[], edges: Edge[]) => {
    setHistory((prev) => {
      // Remove any "future" states if we're not at the end
      const newHistory = prev.slice(0, currentIndex + 1);
      // Add new state
      newHistory.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });
      // Limit history size
      if (newHistory.length > maxHistory) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setCurrentIndex((prev) => Math.min(prev + 1, maxHistory - 1));
  }, [currentIndex, maxHistory]);

  const undo = useCallback((): HistoryState | null => {
    if (currentIndex <= 0) return null;
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    return history[newIndex];
  }, [currentIndex, history]);

  const redo = useCallback((): HistoryState | null => {
    if (currentIndex >= history.length - 1) return null;
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    return history[newIndex];
  }, [currentIndex, history]);

  const clear = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);

  return {
    pushState,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    clear,
  };
}
