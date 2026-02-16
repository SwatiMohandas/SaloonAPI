"use client";

import { useState, useEffect } from 'react';
import { shopApi } from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Building2, Navigation, Save, ArrowLeft, Trash } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function EditShopPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    address: '',
    latitude: 28.6139,
    longitude: 77.2090
  });
  const [file, setFile] = useState<File | null>(null);

  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("21:00");

  useEffect(() => {
    if (id) {
        fetchShopDetails();
    }
  }, [id]);

  const fetchShopDetails = async () => {
      try {
          const { data } = await shopApi.getShop(Number(id));
          setFormData({
              name: data.name,
              city: data.city,
              address: data.address,
              latitude: data.latitude,
              longitude: data.longitude
          });
          // Format TimeSpan "HH:mm:ss" to "HH:mm" for input type="time"
          if (data.openTime) setOpenTime(data.openTime.substring(0, 5));
          if (data.closeTime) setCloseTime(data.closeTime.substring(0, 5));
      } catch (e) {
          toast.error("Failed to load shop details");
          router.push('/dashboard/owner');
      } finally {
          setLoading(false);
      }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            setFormData(prev => ({
                ...prev,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
            }));
        }, (err) => {
            toast.warning("Could not fetch location. Please enter manually.");
        });
    }
  };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        const data = new FormData();
        data.append('name', formData.name);
        data.append('city', formData.city);
        data.append('address', formData.address);
        data.append('latitude', formData.latitude.toString());
        data.append('longitude', formData.longitude.toString());
        data.append('openTime', openTime);
        data.append('closeTime', closeTime);

        if (file) {
            data.append('image', file);
        }

        try {
            await shopApi.updateShop(Number(id), data);
            router.push('/dashboard/owner');
        } catch (err: any) {
            console.error(err);
            setError('Failed to update shop');
        } finally {
            setSaving(false);
        }
    };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="flex justify-center py-12 px-4">
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <ArrowLeft size={16} className="mr-2" /> Back
                    </Button>
                </div>
                <CardTitle className="text-2xl flex items-center gap-2">
                    <Building2 />
                    Edit Shop Details
                </CardTitle>
                <CardDescription>
                    Update your shop information and settings.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Shop Name</Label>
                        <Input 
                            placeholder="e.g. Classic Cuts Barber"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Update Shop Image (Optional)</Label>
                        <Input 
                            type="file"
                            accept="image/*"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="file:text-foreground"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Opening Time</Label>
                            <Input 
                                type="time"
                                value={openTime}
                                onChange={(e) => setOpenTime(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Closing Time</Label>
                            <Input 
                                type="time"
                                value={closeTime}
                                onChange={(e) => setCloseTime(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">City</Label>
                            <Input 
                                placeholder="New Delhi"
                                value={formData.city}
                                onChange={(e) => setFormData({...formData, city: e.target.value})}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Address</Label>
                            <Input 
                                placeholder="123 Main St, Block B"
                                value={formData.address}
                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                         <div className="flex justify-between items-center">
                            <Label className="text-sm font-medium flex items-center gap-1">
                                <MapPin size={16} /> Location Coordinates
                            </Label>
                            <Button type="button" variant="outline" size="sm" onClick={getLocation} className="h-8">
                                <Navigation size={14} className="mr-1" />
                                Get Current Location
                            </Button>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Latitude</Label>
                                <Input 
                                    type="number" 
                                    step="any"
                                    value={formData.latitude}
                                    onChange={(e) => setFormData({...formData, latitude: parseFloat(e.target.value)})}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Longitude</Label>
                                <Input 
                                    type="number" 
                                    step="any"
                                    value={formData.longitude}
                                    onChange={(e) => setFormData({...formData, longitude: parseFloat(e.target.value)})}
                                    required
                                />
                            </div>
                         </div>
                    </div>

                    <Button className="w-full text-lg gap-2" size="lg" type="submit" disabled={saving}>
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
