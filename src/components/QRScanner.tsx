/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QRScannerProps {
  onScan: (ticketId: string) => Promise<{ success: boolean; message: string }>;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" }, // Use back camera
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // Success callback
            onScan(decodedText).then(() => {
              stopScanner();
            });
          },
          (errorMessage) => {
            // Error callback (not critical, happens often)
            console.log("Scanning...", errorMessage);
          }
        );

        setIsScanning(true);
      } catch (err: any) {
        setError(
          err.message || "Ga bisa akses kamera. Cek permission browser lo."
        );
      }
    };

    const stopScanner = async () => {
      if (scannerRef.current && isScanning) {
        try {
          await scannerRef.current.stop();
          scannerRef.current = null;
          setIsScanning(false);
        } catch (err) {
          console.error("Error stopping scanner:", err);
        }
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [onScan, isScanning]);

  const handleClose = async () => {
    if (scannerRef.current && isScanning) {
      await scannerRef.current.stop();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Scan QR Code</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-sm text-red-800">{error}</p>
            <p className="text-xs text-red-600 mt-2">
              Pastikan lo udah allow camera access di browser settings.
            </p>
          </div>
        ) : (
          <>
            <div id="qr-reader" className="rounded-lg overflow-hidden mb-4" />
            <p className="text-sm text-gray-600 text-center">
              Arahkan kamera ke QR code peserta
            </p>
          </>
        )}
      </div>
    </div>
  );
}
