'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  QrCode,
  AlertCircle,
  Clock,
  Car,
  User,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContractNeedingInspection {
  id: string;
  qr_code: string;
  customer_name: string;
  customer_phone?: string;
  vehicle_category_code: string;
  vehicle_category_name: string;
  brand?: string;
  model?: string;
  license_plate?: string;
  days_since_last_inspection: number;
  last_inspected_at?: string;
  last_inspector?: string;
  status: string;
}

export default function InspectionsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<ContractNeedingInspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchContracts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('v_contracts_need_inspection')
        .select('*')
        .order('days_since_last_inspection', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setContracts(data || []);
    } catch (err) {
      setError('Failed to load contracts needing inspection');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const getVehicleIcon = (categoryCode: string) => {
    // Return appropriate icon based on category
    return <Car className="w-5 h-5" />;
  };

  const getInspectionBadge = (days: number) => {
    if (days >= 999) {
      return (
        <Badge variant="destructive" className="whitespace-nowrap">
          Never inspected
        </Badge>
      );
    }
    if (days > 14) {
      return (
        <Badge variant="destructive" className="whitespace-nowrap">
          {days} days overdue
        </Badge>
      );
    }
    if (days > 7) {
      return (
        <Badge variant="secondary" className="whitespace-nowrap">
          {days} days ago
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="whitespace-nowrap">
        {days} days ago
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold">Inspections</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchContracts}
              disabled={isLoading}
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Contracts needing inspection
          </p>
        </div>
      </header>

      {/* Scan Button */}
      <div className="p-4">
        <Button
          onClick={() => router.push('/scan')}
          className="w-full"
          size="lg"
        >
          <QrCode className="w-5 h-5 mr-2" />
          Scan QR Code
        </Button>
      </div>

      {/* Content */}
      <main className="px-4 pb-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </Card>
            ))}
          </div>
        ) : contracts.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-muted-foreground mb-4">
              <Clock className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="font-semibold mb-2">All caught up!</h3>
            <p className="text-sm text-muted-foreground">
              No contracts need inspection at this time.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {contracts.map((contract) => (
              <Card
                key={contract.id}
                className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => router.push(`/inspections/${contract.id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* QR Code & Category */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono font-semibold text-sm">
                        {contract.qr_code}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {contract.vehicle_category_code}
                      </Badge>
                    </div>

                    {/* Vehicle Info */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      {getVehicleIcon(contract.vehicle_category_code)}
                      <span className="truncate">
                        {contract.brand && contract.model
                          ? `${contract.brand} ${contract.model}`
                          : contract.vehicle_category_name}
                      </span>
                      {contract.license_plate && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          {contract.license_plate}
                        </span>
                      )}
                    </div>

                    {/* Customer */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <User className="w-4 h-4" />
                      <span className="truncate">{contract.customer_name}</span>
                    </div>

                    {/* Inspection Status */}
                    <div className="flex items-center justify-between">
                      {getInspectionBadge(contract.days_since_last_inspection)}
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
