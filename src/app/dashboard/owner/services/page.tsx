"use client";

import { useState, useEffect, Suspense } from 'react';
import api from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@radix-ui/react-label';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Service {
    id: number;
    name: string;
    price: number;
    durationMins: number;
}

interface Shop {
    id: number;
    name: string;
}

function ManageServicesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialShopId = searchParams.get('shopId');

    const [shopId, setShopId] = useState(initialShopId || ''); 
    const [shops, setShops] = useState<Shop[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(false);
    
    // New Service Form
    const [newService, setNewService] = useState({
        name: '',
        price: '',
        durationMins: ''
    });

    useEffect(() => {
        const fetchMyShops = async () => {
            try {
                const { data } = await api.get('/shops/mine');
                setShops(data);
                // Only default to first shop if NO param was provided and shopId is empty
                if (!initialShopId && data.length > 0 && !shopId) {
                    setShopId(data[0].id.toString());
                }
            } catch (error) {
                console.error("Failed to fetch my shops", error);
            }
        };
        fetchMyShops();
    }, []);

    useEffect(() => {
        if (shopId) fetchServices();
    }, [shopId]);

    const fetchServices = async () => {
        if (!shopId) return;
        setLoading(true);
        try {
            const { data } = await api.get(`/shops/${shopId}`);
            setServices(data.services || []);
        } catch (error) {
            console.error("Failed to fetch services", error);
            // alert("Could not load shop services. Check ID."); // specific alert often annoying on mount
        } finally {
            setLoading(false);
        }
    };

    const handleAddService = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shopId) return toast.error("Please select a shop first");
        
        try {
            await api.post(`/shops/${shopId}/services`, {
                name: newService.name,
                price: parseFloat(newService.price),
                durationMins: parseInt(newService.durationMins)
            });
            // Reset and reload
            setNewService({ name: '', price: '', durationMins: '' });
            fetchServices();
        } catch (error) {
            console.error(error);
            toast.error("Failed to add service");
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" asChild>
                    <Link href="/dashboard/owner">
                        <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Manage Services</h1>
            </div>

            {/* Shop Selector Context */}
            <Card className="bg-muted/30 border-dashed">
                <CardHeader>
                    <CardTitle className="text-lg">Select Shop</CardTitle>
                    <CardDescription>Choose which shop to manage.</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-4 items-center">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                         <Label htmlFor="shopId">My Shops</Label>
                         {shops.length > 0 ? (
                            <div className="relative">
                                <select 
                                    id="shopId" 
                                    value={shopId}
                                    onChange={(e) => setShopId(e.target.value)}
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                >
                                    {shops.map(shop => (
                                        <option key={shop.id} value={shop.id}>
                                            {shop.name} (ID: {shop.id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                         ) : (
                            <div className="text-sm text-yellow-600 font-medium">
                                No shops found. <Link href="/dashboard/owner/create-shop" className="underline">Create one first.</Link>
                            </div>
                         )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* List Services */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            Current Services
                            <Badge variant="secondary">{services.length}</Badge>
                        </CardTitle>
                        <CardDescription>Services currently offered at your shop.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="text-center py-10 text-muted-foreground animate-pulse">Loading...</div>
                        ) : services.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                                No services found. Add one!
                            </div>
                        ) : (
                            <div className="divide-y border rounded-md">
                                {services.map(service => (
                                    <div key={service.id} className="flex justify-between items-center p-4">
                                        <div>
                                            <div className="font-semibold">{service.name}</div>
                                            <div className="text-sm text-muted-foreground">{service.durationMins} mins</div>
                                        </div>
                                        <div className="text-lg font-bold flex items-center gap-4">
                                            ₹{service.price}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Add Service Form */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Plus size={20} className="text-primary"/> 
                            Add New Service
                        </CardTitle>
                        <CardDescription>Create a new service offering.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddService} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Service Name</Label>
                                <Input 
                                    placeholder="e.g. Haircut & Beard Trim"
                                    value={newService.name}
                                    onChange={(e) => setNewService({...newService, name: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Price (₹)</Label>
                                    <Input 
                                        type="number" 
                                        placeholder="250"
                                        value={newService.price}
                                        onChange={(e) => setNewService({...newService, price: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Duration (Mins)</Label>
                                    <Input 
                                        type="number"
                                        placeholder="30"
                                        value={newService.durationMins}
                                        onChange={(e) => setNewService({...newService, durationMins: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={!shopId || loading}>
                                Add Service
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function ManageServicesPage() {
    return (
        <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
            <ManageServicesContent />
        </Suspense>
    );
}
