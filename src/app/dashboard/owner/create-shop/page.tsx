"use client";

import { useState } from 'react';
import { shopApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Building2, Navigation } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function CreateShopPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    address: '',
    latitude: 28.6139,
    longitude: 77.2090
  });

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

    const [openTime, setOpenTime] = useState("09:00");
    const [closeTime, setCloseTime] = useState("21:00");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const data = new FormData();
        data.append('name', formData.name);
        data.append('city', formData.city);
        data.append('address', formData.address);
        data.append('latitude', formData.latitude.toString());
        data.append('longitude', formData.longitude.toString());
        data.append('openTime', openTime);
        data.append('closeTime', closeTime);
        
        // Find file input and append if exists
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput && fileInput.files && fileInput.files[0]) {
            data.append('image', fileInput.files[0]);
        }

        try {
            await shopApi.createShop(data); 
            router.push('/dashboard/owner');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to create shop');
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className="flex justify-center py-12 px-4">
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                    <Building2 />
                    Register Your Shop
                </CardTitle>
                <CardDescription>
                    Fill in the details to list your shop on the platform.
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
                        <Label className="text-sm font-medium">Shop Image (Optional)</Label>
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
                         <p className="text-[10px] text-muted-foreground">
                            * These coordinates are used to calculate distance for customers.
                         </p>
                    </div>

                    <Button className="w-full text-lg" size="lg" type="submit" disabled={loading}>
                        {loading ? 'Creating Shop...' : 'Complete Registration'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
