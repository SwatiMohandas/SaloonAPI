"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Scissors, Users, PlusCircle, Settings, Trash, CalendarClock } from 'lucide-react';
import Link from 'next/link';
import { ShopHoursModal } from '@/components/ShopHoursModal';



interface Shop {
    id: number;
    name: string;
    city: string;
    address: string;
}

interface QueueEntry {
  id: number;
  customerName: string;
  status: string;
  service?: {
    name: string;
    durationMins: number;
  };
  appointmentTime?: string;
  joinedAt: string;
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [loadingQueue, setLoadingQueue] = useState(false);

  // Hours Modal State
  const [hoursModalOpen, setHoursModalOpen] = useState(false);
  const [hoursShopId, setHoursShopId] = useState<number | null>(null);

  const openHoursModal = (shopId: number) => {
      setHoursShopId(shopId);
      setHoursModalOpen(true);
  };

  useEffect(() => {
    if (user && user.role !== 'owner') {
        router.push('/');
        return;
    }
    fetchMyShops();
  }, [user, router]);

  const fetchMyShops = async () => {
      try {
          const { data } = await api.get('/shops/mine');
          setShops(data);
          // Auto select first shop if exists
          if (data.length > 0) {
              setSelectedShopId(data[0].id);
          }
      } catch (error) {
          console.error("Failed to fetch shops", error);
      } finally {
          setLoadingShops(false);
      }
  };

  useEffect(() => {
    if (selectedShopId) fetchQueue(selectedShopId);
  }, [selectedShopId]);

  const fetchQueue = async (id: number) => {
    setLoadingQueue(true);
    try {
        const { data } = await api.get(`/queue/${id}`);
        setQueue(data);
    } catch (e) {
        console.error(e);
    } finally {
        setLoadingQueue(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
        await api.put(`/queue/${id}/status`, { status });
        if (selectedShopId) fetchQueue(selectedShopId);
    } catch (e) {
        toast.error("Failed to update status");
    }
  };

  const delayBooking = async (id: number) => {
    try {
        await api.put(`/queue/${id}/delay`);
        if (selectedShopId) fetchQueue(selectedShopId);
    } catch (e) {
        toast.error("Failed to delay booking");
    }
  };

  const handleDeleteShop = async (id: number) => {
      if (window.confirm("Are you sure you want to delete this shop? All services and bookings will be permanently removed.")) {
          try {
              await api.delete(`/shops/${id}`);
              setShops(prev => prev.filter(s => s.id !== id));
              if (selectedShopId === id) setSelectedShopId(null);
          } catch (e) {
              console.error(e);
              toast.error("Failed to delete shop");
          }
      }
  };

  // Calculate estimated times
  const processQueue = () => {
    let nextFree = new Date();
    // Start from Now
    
    return queue.map(entry => {
        const duration = entry.service?.durationMins || 30;
        let displayTime: Date;
        let type: 'Booked' | 'Est. Start' | 'Started' | 'Joined';

        // Handle potential PascalCase from API
        const apptTime = entry.appointmentTime || (entry as any).AppointmentTime;
        const joinedTime = entry.joinedAt || (entry as any).JoinedAt;

        if (entry.status === 'in_chair') {
            displayTime = new Date(); 
            const endTime = new Date(displayTime.getTime() + duration * 60000);
            if (endTime > nextFree) nextFree = endTime;
            type = 'Started';
        } else if (apptTime) {
            displayTime = new Date(apptTime);
            const endTime = new Date(displayTime.getTime() + duration * 60000);
            if (endTime > nextFree) nextFree = endTime;
            type = 'Booked';
        } else {
            displayTime = new Date(nextFree);
            nextFree = new Date(displayTime.getTime() + duration * 60000);
            type = 'Est. Start';
        }
        
        return { ...entry, estimatedTime: displayTime, timeType: type, appointmentTime: apptTime, joinedAt: joinedTime };
    });
  };

  const processedQueue = processQueue();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Manage your shops and queues.</p>
          </div>
          <Button onClick={() => router.push('/dashboard/owner/create-shop')} className="gap-2">
            <PlusCircle size={18} /> New Shop
          </Button>
      </div>
      
      {loadingShops ? (
          <div className="text-center py-10 animate-pulse">Loading your shops...</div>
      ) : shops.length === 0 ? (
          <Card className="border-dashed py-10 text-center">
              <CardContent>
                  <Scissors className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">No Shops Yet</h3>
                  <p className="text-muted-foreground mb-4">Register your first shop to start managing queues.</p>
                  <Button onClick={() => router.push('/dashboard/owner/create-shop')}>Create Shop</Button>
              </CardContent>
          </Card>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shops.map(shop => (
                  <Card 
                    key={shop.id} 
                    className={`cursor-pointer transition-all hover:border-primary/50 ${selectedShopId === shop.id ? 'ring-2 ring-primary border-primary' : ''}`}
                    onClick={() => setSelectedShopId(shop.id)}
                  >
                      <CardHeader className="pb-2">
                          <CardTitle className="flex justify-between items-start">
                              {shop.name}
                              {selectedShopId === shop.id && <Badge>Active</Badge>}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1">
                              <MapPin size={12} /> {shop.city}
                          </CardDescription>
                      </CardHeader>
                      <CardFooter className="pt-2 flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1 text-xs" asChild onClick={(e) => e.stopPropagation()}>
                              <Link href={`/dashboard/owner/services?shopId=${shop.id}`}>
                                  <Settings size={12} className="mr-1"/> Services
                              </Link>
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={(e) => { e.stopPropagation(); openHoursModal(shop.id); }}>
                              <CalendarClock size={12} className="mr-1"/> Hours
                          </Button>
                          <Button variant="secondary" size="sm" className="flex-1 text-xs" asChild onClick={(e) => e.stopPropagation()}>
                              <Link href={`/dashboard/owner/edit-shop/${shop.id}`}>
                                  Edit Details
                              </Link>
                          </Button>
                          <Button 
                              variant="destructive" 
                              size="sm" 
                              className="w-8 px-0" 
                              onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteShop(shop.id);
                              }}
                              title="Delete Shop"
                          >
                              <Trash size={12} />
                          </Button>
                      </CardFooter>
                  </Card>
              ))}
          </div>
      )}

      {selectedShopId && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 border-b pb-2 mt-8">
                <Users className="text-primary" />
                <h2 className="text-xl font-bold">Live Queue Management</h2>
                <Badge variant="outline" className="ml-2">
                    {shops.find(s => s.id === selectedShopId)?.name}
                </Badge>
            </div>

            <div className="bg-card rounded-lg border shadow overflow-hidden">
                {loadingQueue ? (
                     <div className="p-8 text-center text-muted-foreground">Loading queue...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Service</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-border">
                                {processedQueue.map((entry) => (
                                    <tr key={entry.id}>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium">{entry.customerName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">{entry.service?.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                                            <div className="flex flex-col">
                                                <span className={`font-mono text-sm ${entry.timeType === 'Booked' ? 'text-amber-500 font-bold' : ''}`}>
                                                    {entry.estimatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">{entry.timeType}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant={entry.status === 'in_chair' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                                                {entry.status.replace('_', ' ')}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                            {(entry.status === 'waiting' || entry.status === 'scheduled') && (
                                                <>
                                                    <Button size="sm" onClick={() => updateStatus(entry.id, 'in_chair')}>
                                                        Mark In-Chair
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => delayBooking(entry.id)} title="Push to back of queue">
                                                        Push Back
                                                    </Button>
                                                </>
                                            )}
                                            {entry.status === 'in_chair' && (
                                                <Button size="sm" variant="secondary" onClick={() => updateStatus(entry.id, 'completed')}>
                                                    Complete
                                                </Button>
                                            )}
                                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => updateStatus(entry.id, 'cancelled')}>
                                                Cancel
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {queue.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                            No active customers in queue.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
      )}
      <ShopHoursModal 
        shopId={hoursShopId} 
        isOpen={hoursModalOpen} 
        onClose={() => setHoursModalOpen(false)} 
      />
    </div>
  );
}
