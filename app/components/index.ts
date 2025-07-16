// Main component
export { default } from '../components/CodePanel';

// Types
export * from '../types/types';

// Services
export { WebContainerService } from '../services/webContainerService';
export { ProjectInitializer } from '../services/projectInitializer';
export { CodeWriterService } from '../services/codeWriterService';
export { ErrorDetectionUtils } from '../services/errorDetectionUtils';

// Hooks
export { useCodePanel } from '../hooks/useCodePanel';

export { default as CodePanel } from '../components/CodePanel';

// Components
export { default as ChatArea } from './ChatArea';
export { default as ChatBubble } from './ChatBubble';
export { default as ChatInput } from './ChatInput';
export { default as CommandExecution } from './CommandExecution';
export { default as CommandTestPanel } from './CommandTestPanel';
export { default as ErrorFixModal } from './ErrorFixModal';
export { default as ErrorBoundary } from './ErrorBoundary';
export { default as ShimmerText } from './ShimmerText';
export { default as DragOverlay } from './DragOverlay';
export { default as ImageThumbnails } from './ImageThumbnails';
export { default as ImagePreviewModal } from './ImagePreviewModal';
export { default as CodeFileCard } from './CodeFileCard';
export { default as ChunkedMessageRenderer } from './ChunkedMessageRenderer';