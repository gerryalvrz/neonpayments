'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from './Button';
import { Icon, XIcon } from '@/components/Icons';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  onClose?: () => void;
  className?: string;
}

function QRScanner({ onScanSuccess, onScanError, onClose, className }: QRScannerProps) {
  const scannerRef = useRef<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isClient, setIsClient] = useState(false);
  const scanAreaId = 'qr-scanner-area';

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current = null;
          })
          .catch((err: unknown) => {
            console.error('Error stopping scanner:', err);
          });
      }
    };
  }, []);

  const startScanning = async () => {
    if (typeof window === 'undefined' || !isClient) {
      return;
    }

    try {
      // Dynamically import Html5Qrcode
      const { Html5Qrcode } = await import('html5-qrcode');

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      stream.getTracks().forEach(track => track.stop()); // Stop immediately to check permission
      setHasPermission(true);

      // Initialize scanner
      const html5QrCode = new Html5Qrcode(scanAreaId);
      scannerRef.current = html5QrCode;

      // Start scanning
      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Success callback
          onScanSuccess(decodedText);
          stopScanning();
        },
        (errorMessage) => {
          // Error callback - ignore if it's just "not found" errors
          if (errorMessage !== 'NotFoundException') {
            setError(errorMessage);
            if (onScanError) {
              onScanError(errorMessage);
            }
          }
        }
      );

      setIsScanning(true);
      setError(null);
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      setError(err.message || 'Failed to start camera');
      setHasPermission(false);
      if (onScanError) {
        onScanError(err.message || 'Failed to start camera');
      }
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (err: unknown) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const handleClose = () => {
    stopScanning();
    if (onClose) {
      onClose();
    }
  };

  if (!isClient) {
    return (
      <div className={`relative ${className || ''}`}>
        <div className="space-y-4">
          <div className="w-full h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600">
            <p className="text-gray-600 dark:text-gray-400">Loading scanner...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className || ''}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Scan QR Code
          </h3>
          {onClose && (
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Close scanner"
            >
              <Icon size="md">
                <XIcon />
              </Icon>
            </button>
          )}
        </div>

        {hasPermission === false && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              Camera permission denied. Please enable camera access in your browser settings.
            </p>
          </div>
        )}

        {error && hasPermission !== false && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">{error}</p>
          </div>
        )}

        <div
          id={scanAreaId}
          className={`w-full rounded-lg overflow-hidden border-2 ${
            isScanning
              ? 'border-acid-lemon'
              : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800'
          }`}
          style={{ minHeight: '300px' }}
        />

        {!isScanning && (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={startScanning}
          >
            Start Camera
          </Button>
        )}

        {isScanning && (
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={stopScanning}
          >
            Stop Scanning
          </Button>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Position the QR code within the frame to scan
        </p>
      </div>
    </div>
  );
}

export default QRScanner;
export { QRScanner };
