'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Camera, StopCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QrScannerProps {
  onScan: (qrCode: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface CameraDevice {
  id: string;
  label: string;
}

export function QrScanner({ onScan, onError, className }: QrScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize scanner
  useEffect(() => {
    if (containerRef.current && !scannerRef.current) {
      scannerRef.current = new Html5Qrcode('qr-reader', {
        verbose: false,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      });
    }

    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  // Get available cameras
  const getCameras = useCallback(async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        // Prefer back camera on mobile
        const backCamera = devices.find(d =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        );
        setSelectedCamera(backCamera?.id || devices[0].id);
        setHasPermission(true);
      } else {
        setHasPermission(false);
        onError?.('No cameras found on this device');
      }
    } catch (err) {
      setHasPermission(false);
      onError?.('Camera permission denied. Please allow camera access.');
    }
  }, [onError]);

  // Start scanning
  const startScanning = async () => {
    if (!scannerRef.current || !selectedCamera) return;

    setIsLoading(true);
    try {
      await scannerRef.current.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          // Success callback
          handleScanSuccess(decodedText);
        },
        () => {
          // Error callback - QR not found in frame, ignore
        }
      );
      setIsScanning(true);
    } catch (err) {
      onError?.('Failed to start camera. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Stop scanning
  const stopScanning = async () => {
    if (!scannerRef.current) return;

    try {
      await scannerRef.current.stop();
      setIsScanning(false);
    } catch (err) {
      console.error('Error stopping scanner:', err);
    }
  };

  // Handle successful scan
  const handleScanSuccess = (qrCode: string) => {
    // Play beep sound
    playBeep();

    // Vibrate on mobile
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }

    onScan(qrCode);
  };

  // Play beep sound
  const playBeep = () => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch {
      // Audio not supported, ignore
    }
  };

  // Request camera permission on mount
  useEffect(() => {
    getCameras();
  }, [getCameras]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Camera Selection */}
      {!isScanning && cameras.length > 0 && (
        <Card className="p-4 mb-4">
          <label className="block text-sm font-medium mb-2">
            Select Camera
          </label>
          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="w-full p-2 border rounded-md text-sm"
          >
            {cameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.label || `Camera ${camera.id.slice(0, 8)}...`}
              </option>
            ))}
          </select>
        </Card>
      )}

      {/* Permission Denied */}
      {hasPermission === false && (
        <Card className="p-6 text-center">
          <div className="text-red-500 mb-4">
            <Camera className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="font-semibold mb-2">Camera Access Required</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Please allow camera access to scan QR codes.
          </p>
          <Button onClick={getCameras} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </Card>
      )}

      {/* Scanner Container */}
      <div className="relative flex-1 min-h-[300px] bg-black rounded-lg overflow-hidden">
        <div
          id="qr-reader"
          ref={containerRef}
          className={cn(
            'w-full h-full',
            !isScanning && 'hidden'
          )}
        />

        {/* Placeholder when not scanning */}
        {!isScanning && hasPermission !== false && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
            <Camera className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-sm">
              Camera ready to scan
            </p>
          </div>
        )}

        {/* Scanning overlay */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Corner markers */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px]">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500" />
            </div>

            {/* Scan line animation */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[2px] bg-green-500 animate-scan" />

            {/* Instructions */}
            <div className="absolute bottom-8 left-0 right-0 text-center">
              <p className="text-white text-sm bg-black/50 inline-block px-4 py-2 rounded-full">
                Align QR code within the frame
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex gap-2">
        {!isScanning ? (
          <Button
            onClick={startScanning}
            disabled={isLoading || !selectedCamera}
            className="flex-1"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
                Start Scanning
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={stopScanning}
            variant="destructive"
            className="flex-1"
            size="lg"
          >
            <StopCircle className="w-4 h-4 mr-2" />
            Stop Scanning
          </Button>
        )}
      </div>

      <style jsx>{`
        @keyframes scan {
          0%, 100% {
            transform: translate(-50%, -125px);
          }
          50% {
            transform: translate(-50%, 123px);
          }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
