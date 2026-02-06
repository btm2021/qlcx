'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { QrScanner } from '@/components/biz/qr/qr-scanner';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

export default function ScanPage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supabase = createClient();

  const handleScan = useCallback(async (qrCode: string) => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      // Clean up the QR code (remove whitespace)
      const cleanQrCode = qrCode.trim();

      // Log the scan
      await supabase.from('activity_logs').insert({
        action: 'QR_SCANNED',
        note: `Scanned QR: ${cleanQrCode}`,
      });

      // Look up contract by QR code
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select('id, qr_code, status, customer_id')
        .eq('qr_code', cleanQrCode)
        .single();

      if (contractError || !contract) {
        setError(`Contract not found for QR code: ${cleanQrCode}`);
        setIsProcessing(false);
        return;
      }

      // Check if contract is in a valid state for inspection
      const validStatuses = ['ACTIVE', 'EXTENDED', 'OVERDUE'];
      if (!validStatuses.includes(contract.status)) {
        setError(`Contract is ${contract.status.toLowerCase().replace('_', ' ')} and cannot be inspected`);
        setIsProcessing(false);
        return;
      }

      setSuccess(`Found contract: ${contract.qr_code}`);

      // Redirect to inspection page after a short delay
      setTimeout(() => {
        router.push(`/inspections/${contract.id}`);
      }, 500);
    } catch (err) {
      setError('An error occurred while processing the scan');
      setIsProcessing(false);
    }
  }, [router, supabase]);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="mr-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Scan QR Code</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 flex flex-col">
        {/* Status Messages */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-500 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {isProcessing ? (
          <Card className="flex-1 flex flex-col items-center justify-center p-8">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Looking up contract...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please wait while we find the contract details
            </p>
          </Card>
        ) : (
          <>
            {/* Scanner */}
            <div className="flex-1 min-h-0">
              <QrScanner
                onScan={handleScan}
                onError={handleError}
                className="h-full"
              />
            </div>

            {/* Instructions */}
            <Card className="mt-4 p-4">
              <h3 className="font-medium mb-2">How to scan:</h3>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Point camera at the QR code on the asset</li>
                <li>Hold steady until the code is recognized</li>
                <li>You will be redirected to the inspection form</li>
              </ol>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
