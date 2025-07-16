// Memory management utilities for chat application

import { clearParseCache } from './messageParser';

// Type definitions for performance memory API
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface ExtendedPerformance extends Performance {
  memory?: PerformanceMemory;
}

interface ExtendedWindow extends Window {
  gc?: () => void;
}

// Global memory cleanup function
export function performMemoryCleanup(): void {
  // Clear message parser cache
  clearParseCache();
  
  // Force garbage collection if available (development only)
  if (typeof window !== 'undefined' && 'gc' in window && process.env.NODE_ENV === 'development') {
    (window as ExtendedWindow).gc?.();
  }
  
  console.log('Memory cleanup performed');
}

// Memory usage monitor (development only)
export function logMemoryUsage(): void {
  if (typeof window !== 'undefined' && 'performance' in window && process.env.NODE_ENV === 'development') {
    const memory = (performance as ExtendedPerformance).memory;
    if (memory) {
      console.log('Memory usage:', {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + ' MB',
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + ' MB',
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
      });
    }
  }
}

// Auto cleanup when memory usage gets high
export function setupAutoCleanup(): void {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const interval = setInterval(() => {
      const memory = (performance as ExtendedPerformance).memory;
      if (memory && memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
        console.warn('High memory usage detected, performing cleanup');
        performMemoryCleanup();
      }
    }, 30000); // Check every 30 seconds

    // Cleanup interval on page unload
    window.addEventListener('beforeunload', () => {
      clearInterval(interval);
      performMemoryCleanup();
    });
  }
}
