import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

// Local
import RfidReaderPanel, { type RfidReaderPanelHandle } from '../shared/RfidReaderPanel';
import type { LeituraHandler } from './types';

// ── Props ───────────────────────────────────────────────────

interface LeituraSimplesProps {
  host: string;
  port: string;
  showAdvancedSettings?: boolean;
  onStateChange?: () => void;
}

// ── Component ───────────────────────────────────────────────

const LeituraSimples = forwardRef<LeituraHandler, LeituraSimplesProps>(
  ({ host, port, showAdvancedSettings = false, onStateChange }, ref) => {
    const readerRef = useRef<RfidReaderPanelHandle>(null);
    const [isReading, setIsReading] = useState(false);

    // Stable ref for the callback to avoid re-triggering the effect
    const onStateChangeRef = useRef(onStateChange);
    onStateChangeRef.current = onStateChange;

    useImperativeHandle(
      ref,
      () => ({
        hasData: false,
        isSubmitting: false,
        isReading
      }),
      [isReading]
    );

    // Notify parent AFTER render so the imperative handle is already updated
    useEffect(() => {
      onStateChangeRef.current?.();
    }, [isReading]);

    return (
      <RfidReaderPanel ref={readerRef} host={host} port={port} showAdvancedSettings={showAdvancedSettings} onReadingChange={setIsReading} />
    );
  }
);

export default LeituraSimples;
