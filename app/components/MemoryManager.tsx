'use client';

import { useEffect } from 'react';
import { setupAutoCleanup } from '../utils/memoryUtils';

export default function MemoryManager() {
  useEffect(() => {
    setupAutoCleanup();
  }, []);

  return null;
}
