"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { MapPin, Star, ArrowRight, Search, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Shop {
  id: number;
  name: string;
  city: string;
  rating: number;
  distanceKm: number;
  imagePath?: string;
  openTime?: string;
  closeTime?: string;
  dailyHours?: ShopWorkingHour[];
}

interface ShopWorkingHour {
    dayOfWeek: number; // 0=Sunday
    openTime: string;
    closeTime: string;
    isClosed: boolean;
}

export default function Home() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);

  // Default Delhi Center
  const DEFAULT_LAT = 28.6139;
  const DEFAULT_LON = 77.2090;

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLon(position.coords.longitude);
        },
        () => {
          setLat(DEFAULT_LAT);
          setLon(DEFAULT_LON);
        }
      );
    } else {
      setLat(DEFAULT_LAT);
      setLon(DEFAULT_LON);
    }
  }, []);

  const searchShops = async () => {
    if (lat === null || lon === null) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/shops/search?lat=${lat}&lon=${lon}&radius=50`);
      console.log("[DEBUG] Search Response Data:", data);
      setShops(data);
    } catch (error) {
      console.error("Failed to fetch shops", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lat && lon) {
      searchShops();
    }
  }, [lat, lon]);

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-24 sm:py-32 lg:px-8 text-center shadow-2xl isolate">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 -z-20">
            <img src="/landing_hero_bg.png" alt="Barber Shop Interior" className="w-full h-full object-cover opacity-60 blur-[1px]" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />
        </div>

        {/* Premium Gradients */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-30" />
        
        <div className="mx-auto max-w-3xl relative z-10">
            <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-7xl mb-8 drop-shadow-2xl leading-tight">
                Look Sharp. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-200">Save Time.</span>
            </h1>
            
            <p className="mt-6 text-xl leading-8 text-muted-foreground max-w-2xl mx-auto font-light">
                Discover top-rated barber shops, check real-time queue status, and book your spot before you step out the door.
            </p>
            
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" onClick={searchShops} className="w-full sm:w-auto gap-2 text-lg h-14 px-8 shadow-lg shadow-primary/20 transition-all hover:scale-105">
                    <Search size={20} />
                    Find Nearby Shops
                </Button>
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-14" asChild>
                    <Link href="/register">List your shop <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </div>
            
            <div className="mt-12 flex justify-center gap-8 text-muted-foreground text-sm font-medium uppercase tracking-widest">
                <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-primary"/> Real-time Queues</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-primary"/> Verified Shops</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-primary"/> Instant Booking</span>
            </div>
        </div>
      </section>

      {/* Shop Listings */}
      <section className="px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Nearby Collections</h2>
                <p className="text-muted-foreground mt-2 text-lg">Curated grooming spots within your vicinity.</p>
            </div>
            {/* Optional Filter Button could go here */}
        </div>
        
        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1,2,3].map(i => (
                    <Card key={i} className="animate-pulse h-80 bg-muted/40 border-0 rounded-2xl" />
                ))}
            </div>
        ) : shops.length === 0 ? (
            <div className="text-center py-24 bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                    <Search size={32} className="text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold">No shops found nearby.</h3>
                <p className="text-muted-foreground mt-2 max-w-sm mx-auto">We couldn't find any shops within 50km of your location. Try enabling GPS or check back later.</p>
                <Button variant="outline" className="mt-8" onClick={searchShops}>Refresh Location</Button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {shops.map(shop => (
                    <Card key={shop.id} className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border-muted/60 overflow-hidden rounded-2xl bg-card">
                        <div className="h-56 bg-muted relative overflow-hidden">
                             {/* Shop Image */}
                             <img 
                                src={shop.imagePath ? `https://localhost:44394${shop.imagePath}` : "/shop_placeholder.png"} 
                                alt={shop.name}
                                onError={(e) => e.currentTarget.src = "/shop_placeholder.png"}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                             />
                            
                            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-60" />
                            
                            <div className="absolute top-4 right-4 z-10">
                                <Badge variant="secondary" className="font-bold flex gap-1.5 bg-background/95 backdrop-blur-md text-foreground border-0 shadow-sm px-3 py-1">
                                    <Star size={14} className="fill-primary text-primary" />
                                    {shop.rating}
                                </Badge>
                            </div>
                            <div className="absolute bottom-4 left-4 z-10 text-foreground">
                                <div className="font-bold text-lg">{shop.name}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                                    <MapPin size={14} /> {shop.city}
                                </div>
                            </div>
                        </div>
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-center mb-4">
                                <Badge variant="outline" className="text-muted-foreground font-normal">
                                    <MapPin size={12} className="mr-1" /> {shop.distanceKm} km away
                                </Badge>
                                <span className={
                                    (() => {
                                        const now = new Date();
                                        const currentDay = now.getDay();
                                        const currentTime = now.getHours() * 60 + now.getMinutes();
                                        
                                        let isOpen = false;
                                        let isClosedToday = false;

                                        const todayHours = shop.dailyHours?.find(h => h.dayOfWeek === currentDay);
                                        
                                        if (todayHours) {
                                            if (todayHours.isClosed) isClosedToday = true;
                                            else if (todayHours.openTime && todayHours.closeTime) {
                                                const [openH, openM] = todayHours.openTime.split(':').map(Number);
                                                const [closeH, closeM] = todayHours.closeTime.split(':').map(Number);
                                                const start = openH * 60 + openM;
                                                const end = closeH * 60 + closeM;
                                                isOpen = (currentTime >= start && currentTime < end);
                                            }
                                        } else {
                                             // Fallback
                                             if (shop.openTime && shop.closeTime) {
                                                const [openH, openM] = shop.openTime.split(':').map(Number);
                                                const [closeH, closeM] = shop.closeTime.split(':').map(Number);
                                                const start = openH * 60 + openM;
                                                const end = closeH * 60 + closeM;
                                                isOpen = (currentTime >= start && currentTime < end);
                                             }
                                        }

                                        if (isClosedToday) return "text-xs font-semibold text-red-500 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20";
                                        
                                        return isOpen 
                                            ? "text-xs font-semibold text-green-500 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20"
                                            : "text-xs font-semibold text-red-500 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20";
                                    })()
                                }>
                                    {(() => {
                                        const now = new Date();
                                        const currentDay = now.getDay();
                                        const currentTime = now.getHours() * 60 + now.getMinutes();
                                        
                                        // 1. Check Day-wise Schedule
                                        const todayHours = shop.dailyHours?.find(h => h.dayOfWeek === currentDay);
                                        
                                        if (todayHours) {
                                            if (todayHours.isClosed) return "Closed Today";
                                            // Proceed with specific hours
                                            if (!todayHours.openTime || !todayHours.closeTime) return "Hours N/A";
                                            
                                            const [openH, openM] = todayHours.openTime.split(':').map(Number);
                                            const [closeH, closeM] = todayHours.closeTime.split(':').map(Number);
                                            const start = openH * 60 + openM;
                                            const end = closeH * 60 + closeM;
                                            
                                            // Handle cross-midnight? MVP assumes Same Day (0-24)
                                            return (currentTime >= start && currentTime < end) ? "Open Now" : "Closed";
                                        }

                                        // 2. Fallback to General Schedule
                                        if (!shop.openTime || !shop.closeTime) return "Hours N/A";
                                        
                                        const [openHour, openMinute] = shop.openTime.split(':').map(Number);
                                        const [closeHour, closeMinute] = shop.closeTime.split(':').map(Number);
                                        
                                        const openTimeMins = openHour * 60 + openMinute;
                                        const closeTimeMins = closeHour * 60 + closeMinute;

                                        const isOpen = currentTime >= openTimeMins && currentTime < closeTimeMins;
                                        
                                        return isOpen ? "Open Now" : "Closed";
                                    })()}
                                </span>
                            </div>
                            <Button className="w-full font-semibold h-11 bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-all" asChild>
                                <Link href={`/shops/${shop.id}`}>
                                    View Details & Queue
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}
      </section>
    </div>
  );
}
