'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CameraCapture } from './camera-capture';
import {
  MapPin,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Navigation,
} from 'lucide-react';

// Validation schema
const inspectionSchema = z.object({
  result: z.enum(['PRESENT', 'MISSING'], {
    required_error: 'Please select inspection result',
  }),
  missing_note: z.string().optional(),
});

type InspectionFormData = z.infer<typeof inspectionSchema>;

interface InspectionFormProps {
  contractId: string;
  qrCode: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface GpsLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export function InspectionForm({
  contractId,
  qrCode,
  onSuccess,
  onCancel,
}: InspectionFormProps) {
  const [gpsLocation, setGpsLocation] = useState<GpsLocation | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const supabase = createClient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionSchema),
  });

  const result = watch('result');

  // Get GPS location
  const getGpsLocation = useCallback(async () => {
    setIsGettingGps(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by this browser');
      setIsGettingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setIsGettingGps(false);
      },
      (error) => {
        let errorMessage = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable GPS.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        setGpsError(errorMessage);
        setIsGettingGps(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // Handle photo capture
  const handlePhotosChange = (files: File[]) => {
    setPhotos(files);
  };

  // Upload photos to Supabase Storage
  const uploadPhotos = async (inspectionId: string): Promise<string[]> => {
    if (photos.length === 0) return [];

    const uploadedPaths: string[] = [];
    const timestamp = Date.now();

    for (let i = 0; i < photos.length; i++) {
      const file = photos[i];
      const fileName = `${qrCode}/INSPECTION_${inspectionId}_${timestamp}_${i + 1}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('contract-images')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      uploadedPaths.push(fileName);

      // Save to contract_images table
      await supabase.from('contract_images').insert({
        contract_id: contractId,
        image_type: 'INSPECTION',
        file_path: fileName,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        sort_order: i,
      });
    }

    return uploadedPaths;
  };

  // Submit inspection
  const onSubmit = async (data: InspectionFormData) => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      // Validate GPS is available
      if (!gpsLocation) {
        setSubmitError('GPS location is required. Please capture location first.');
        setIsSubmitting(false);
        return;
      }

      // Validate at least one photo
      if (photos.length === 0) {
        setSubmitError('At least one photo is required for inspection.');
        setIsSubmitting(false);
        return;
      }

      // Get current user/staff
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSubmitError('You must be logged in to submit an inspection');
        setIsSubmitting(false);
        return;
      }

      // Get staff ID from user
      const { data: staffData } = await supabase
        .from('staff')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!staffData) {
        setSubmitError('Staff record not found');
        setIsSubmitting(false);
        return;
      }

      // Insert inspection log
      const { data: inspectionData, error: inspectionError } = await supabase
        .from('inspection_logs')
        .insert({
          contract_id: contractId,
          staff_id: staffData.id,
          result: data.result,
          gps_latitude: gpsLocation.latitude,
          gps_longitude: gpsLocation.longitude,
          gps_accuracy: gpsLocation.accuracy,
          missing_note: data.result === 'MISSING' ? data.missing_note : null,
        })
        .select('id')
        .single();

      if (inspectionError) {
        throw inspectionError;
      }

      // Upload photos
      await uploadPhotos(inspectionData.id);

      // Log activity
      await supabase.from('activity_logs').insert({
        contract_id: contractId,
        action: 'INSPECTION_DONE',
        note: `Result: ${data.result}`,
      });

      setSubmitSuccess(true);

      // Redirect after success
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err) {
      console.error('Submit error:', err);
      setSubmitError('Failed to submit inspection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Success Message */}
      {submitSuccess && (
        <Alert className="border-green-500 text-green-700">
          <CheckCircle className="w-4 h-4" />
          <AlertDescription>
            Inspection submitted successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* GPS Location Section */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          GPS Location
          <span className="text-red-500">*</span>
        </h3>

        {gpsLocation ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Location captured</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Latitude: {gpsLocation.latitude.toFixed(6)}</p>
              <p>Longitude: {gpsLocation.longitude.toFixed(6)}</p>
              <p>Accuracy: ±{Math.round(gpsLocation.accuracy)}m</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={getGpsLocation}
              disabled={isGettingGps}
            >
              <Navigation className="w-4 h-4 mr-2" />
              Update Location
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {gpsError && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{gpsError}</AlertDescription>
              </Alert>
            )}
            <Button
              type="button"
              onClick={getGpsLocation}
              disabled={isGettingGps}
              className="w-full"
            >
              {isGettingGps ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  Capture GPS Location
                </>
              )}
            </Button>
          </div>
        )}
      </Card>

      {/* Photos Section */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">📷</span>
          Photos
          <span className="text-red-500">*</span>
          <span className="text-sm font-normal text-muted-foreground">
            (min. 1 required)
          </span>
        </h3>
        <CameraCapture
          onChange={handlePhotosChange}
          maxPhotos={6}
        />
      </Card>

      {/* Inspection Result Section */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Inspection Result</h3>

        <RadioGroup
          defaultValue=""
          className="space-y-3"
          {...register('result')}
        >
          <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent">
            <RadioGroupItem value="PRESENT" id="present" />
            <Label htmlFor="present" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium">PRESENT</p>
                  <p className="text-sm text-muted-foreground">
                    Asset is in storage as expected
                  </p>
                </div>
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent">
            <RadioGroupItem value="MISSING" id="missing" />
            <Label htmlFor="missing" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-medium">MISSING</p>
                  <p className="text-sm text-muted-foreground">
                    Asset cannot be found in storage
                  </p>
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>

        {errors.result && (
          <p className="text-sm text-red-500 mt-2">{errors.result.message}</p>
        )}

        {/* Missing Note - only show when MISSING is selected */}
        {result === 'MISSING' && (
          <div className="mt-4">
            <Label htmlFor="missing_note" className="mb-2 block">
              Missing Note <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="missing_note"
              placeholder="Describe the situation (e.g., checked all storage areas, spoke with staff...)"
              {...register('missing_note')}
              className="min-h-[100px]"
            />
          </div>
        )}
      </Card>

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !gpsLocation || photos.length === 0}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Inspection'
          )}
        </Button>
      </div>
    </form>
  );
}
