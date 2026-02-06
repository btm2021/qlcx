'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { InspectionForm } from '@/components/biz/inspection/inspection-form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  AlertCircle,
  Car,
  User,
  FileText,
  Calendar,
} from 'lucide-react';

interface ContractDetail {
  id: string;
  qr_code: string;
  status: string;
  customer_name: string;
  customer_phone?: string;
  vehicle_category_name: string;
  contract_type_name: string;
  brand?: string;
  model?: string;
  license_plate?: string;
  color?: string;
  year_of_manufacture?: number;
  storage_location?: string;
  contract_date: string;
  due_date?: string;
}

export default function InspectionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params.contractId as string;

  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchContract = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch contract with related info
        const { data, error: fetchError } = await supabase
          .from('v_active_contracts')
          .select('*')
          .eq('id', contractId)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        if (!data) {
          setError('Contract not found');
          return;
        }

        // Fetch vehicle details
        const { data: vehicleData } = await supabase
          .from('vehicles')
          .select('brand, model, color, year_of_manufacture, storage_location')
          .eq('contract_id', contractId)
          .single();

        setContract({
          ...data,
          ...vehicleData,
        });
      } catch (err) {
        setError('Failed to load contract details');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (contractId) {
      fetchContract();
    }
  }, [contractId, supabase]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      ACTIVE: 'default',
      EXTENDED: 'secondary',
      OVERDUE: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
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
            <Skeleton className="h-6 w-32" />
          </div>
        </header>
        <main className="p-4 space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-80" />
        </main>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-background">
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
            <h1 className="text-lg font-semibold">Inspection</h1>
          </div>
        </header>
        <main className="p-4">
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error || 'Contract not found'}</AlertDescription>
          </Alert>
          <Button
            onClick={() => router.push('/inspections')}
            className="mt-4 w-full"
          >
            Back to Inspections
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">{contract.qr_code}</h1>
            <p className="text-xs text-muted-foreground">
              {contract.vehicle_category_name} - {contract.contract_type_name}
            </p>
          </div>
          {getStatusBadge(contract.status)}
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Contract Info Card */}
        <Card className="p-4">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Contract Information
          </h2>

          <div className="space-y-3">
            {/* Vehicle Info */}
            <div className="flex items-start gap-3">
              <Car className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">
                  {contract.brand && contract.model
                    ? `${contract.brand} ${contract.model}`
                    : contract.vehicle_category_name}
                </p>
                <div className="flex flex-wrap gap-2 mt-1 text-sm text-muted-foreground">
                  {contract.license_plate && (
                    <span className="bg-muted px-2 py-0.5 rounded">
                      {contract.license_plate}
                    </span>
                  )}
                  {contract.color && (
                    <span>{contract.color}</span>
                  )}
                  {contract.year_of_manufacture && (
                    <span>{contract.year_of_manufacture}</span>
                  )}
                </div>
                {contract.storage_location && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Location: {contract.storage_location}
                  </p>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">{contract.customer_name}</p>
                {contract.customer_phone && (
                  <p className="text-sm text-muted-foreground">
                    {contract.customer_phone}
                  </p>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Contract Date:</span>{' '}
                  {new Date(contract.contract_date).toLocaleDateString()}
                </p>
                {contract.due_date && (
                  <p>
                    <span className="text-muted-foreground">Due Date:</span>{' '}
                    {new Date(contract.due_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Inspection Form */}
        <InspectionForm
          contractId={contract.id}
          qrCode={contract.qr_code}
          onSuccess={() => {
            router.push('/inspections');
          }}
          onCancel={() => {
            router.back();
          }}
        />
      </main>
    </div>
  );
}
