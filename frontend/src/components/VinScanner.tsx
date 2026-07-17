import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
  onScan: (vin: string) => void;
  active: boolean;
}

export default function VinScanner({ onScan, active }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'vin-scanner-container';

  useEffect(() => {
    if (!active) {
      scannerRef.current?.stop().catch(() => {});
      return;
    }

    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 280, height: 100 } },
        (decodedText) => {
          // Clean the scanned value as a VIN
          const vin = decodedText
            .replace(/[\s\-]/g, '')
            .replace(/O/g, '0')
            .toUpperCase()
            .slice(0, 17);
          onScan(vin);
        },
        () => {} // suppress per-frame errors
      )
      .catch((err) => console.warn('Scanner start error:', err));

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [active]);

  return (
    <div className="relative w-full">
      <div id={containerId} className="w-full rounded-xl overflow-hidden" />
      {active && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-72 h-20 border-2 border-brand-400 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
        </div>
      )}
    </div>
  );
}
