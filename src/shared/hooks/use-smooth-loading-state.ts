"use client";

import { type MutableRefObject, useEffect, useRef, useState } from "react";

interface SmoothLoadingOptions {
  delayMs?: number;
  minVisibleMs?: number;
}

const DEFAULT_DELAY_MS = 120;
const DEFAULT_MIN_VISIBLE_MS = 320;

function clearTimer(timerRef: MutableRefObject<number | null>) {
  if (timerRef.current === null) {
    return;
  }

  window.clearTimeout(timerRef.current);
  timerRef.current = null;
}

export function useSmoothLoadingState(active: boolean, options: SmoothLoadingOptions = {}) {
  const { delayMs = DEFAULT_DELAY_MS, minVisibleMs = DEFAULT_MIN_VISIBLE_MS } = options;
  const [visible, setVisible] = useState(false);
  const visibleRef = useRef(visible);
  const visibleSinceRef = useRef<number | null>(null);
  const showTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    clearTimer(showTimerRef);
    clearTimer(hideTimerRef);

    if (active) {
      if (visibleRef.current) {
        return;
      }

      if (delayMs <= 0) {
        visibleSinceRef.current = Date.now();
        setVisible(true);
        return;
      }

      showTimerRef.current = window.setTimeout(() => {
        visibleSinceRef.current = Date.now();
        setVisible(true);
      }, delayMs);

      return;
    }

    if (!visibleRef.current) {
      visibleSinceRef.current = null;
      return;
    }

    const elapsed = visibleSinceRef.current ? Date.now() - visibleSinceRef.current : minVisibleMs;
    const remaining = Math.max(0, minVisibleMs - elapsed);

    hideTimerRef.current = window.setTimeout(() => {
      visibleSinceRef.current = null;
      setVisible(false);
    }, remaining);

    return () => {
      clearTimer(showTimerRef);
      clearTimer(hideTimerRef);
    };
  }, [active, delayMs, minVisibleMs]);

  useEffect(
    () => () => {
      clearTimer(showTimerRef);
      clearTimer(hideTimerRef);
    },
    [],
  );

  return visible;
}

export function useSmoothTableData<T>(data: T, isLoading: boolean, options?: SmoothLoadingOptions) {
  const isIndicatorVisible = useSmoothLoadingState(isLoading, options);
  const [displayData, setDisplayData] = useState(data);
  const [hasResolvedOnce, setHasResolvedOnce] = useState(false);

  useEffect(() => {
    if (isLoading || isIndicatorVisible) {
      return;
    }

    setDisplayData(data);
    setHasResolvedOnce(true);
  }, [data, isIndicatorVisible, isLoading]);

  return {
    displayData,
    hasResolvedOnce,
    isInitialLoading: !hasResolvedOnce && (isLoading || isIndicatorVisible),
    isRefreshing: hasResolvedOnce && isIndicatorVisible,
  };
}
