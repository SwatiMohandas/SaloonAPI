"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';

interface Booking {
  id: number;
  shopId: number;
  customerName: string;
  status: string;
  joinedAt: string;
  appointmentTime?: string;
  service?: {
    name: string;
    durationMins: number;
  };
  shop?: {
    name: string;
    city: string;
  };
}

export default function CustomerDashboard() {
  const [history, setHistory] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get('/queue/history');
        console.log("History API Response:", data); // DEBUG
        setHistory(data);
      } catch (error) {
        console.error("Failed to load history", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleCancel = async (id: number) => {
    if (!confirm("Are you sure you want to cancel? To change shop or time, you must cancel and re-book.")) return;
    try {
        await api.put(`/queue/${id}/cancel`);
        setHistory(prev => prev.map(b => b.id === id ? {...b, status: 'cancelled'} : b));
    } catch (e) {
        toast.error("Failed to cancel booking");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
       <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
                <p className="text-muted-foreground">Manage your current and past appointments.</p>
            </div>
            <Button asChild>
                <Link href="/">Find a Shop</Link>
            </Button>
       </div>

       {loading ? (
           <div className="text-center py-12 animate-pulse text-muted-foreground">Loading your history...</div>
       ) : history.length === 0 ? (
           <Card className="border-dashed py-12 text-center bg-muted/20">
               <div className="flex justify-center mb-4">
                   <Calendar size={48} className="text-muted-foreground/30" />
               </div>
               <h3 className="text-xl font-semibold mb-2">No bookings yet</h3>
               <p className="text-muted-foreground mb-6">Looks like you haven't booked any services yet.</p>
               <Button asChild>
                   <Link href="/">Book Your First Cut</Link>
               </Button>
           </Card>
       ) : (
           <div className="space-y-6">
               {/* Active Bookings First */}
               {history.filter(h => h.status !== 'completed' && h.status !== 'cancelled').length > 0 && (
                   <div>
                       <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                           <Clock className="text-primary" size={20} /> Active Appointments
                       </h2>
                       <div className="grid gap-4">
                           {history.filter(h => h.status !== 'completed' && h.status !== 'cancelled').map(booking => (
                               <BookingCard key={booking.id} booking={booking} active onCancel={handleCancel} />
                           ))}
                       </div>
                   </div>
               )}

               {/* Past Bookings */}
               <div>
                   <h2 className="text-xl font-semibold mb-4 text-muted-foreground">History</h2>
                   <div className="grid gap-4 opacity-80 hover:opacity-100 transition-opacity">
                       {history.filter(h => h.status === 'completed' || h.status === 'cancelled').map(booking => (
                           <BookingCard key={booking.id} booking={booking} />
                       ))}
                   </div>
               </div>
           </div>
       )}
    </div>
  );
}

function BookingCard({ booking, active, onCancel }: { booking: Booking, active?: boolean, onCancel?: (id: number) => void }) {
    return (
        <Card className={`transition-all ${active ? 'border-primary/50 shadow-md ring-1 ring-primary/10' : 'hover:bg-muted/30'}`}>
            <div className="p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        <Scissors size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">{booking.shop?.name || 'Unknown Shop'}</h3>
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                            <MapPin size={12} /> {booking.shop?.city}
                        </div>
                        <div className="font-medium text-foreground/90">
                            {booking.service?.name || 'Walk-in Service'} 
                            {booking.service?.durationMins && <span className="text-muted-foreground font-normal text-xs ml-2">({booking.service.durationMins} mins)</span>}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2 min-w-[120px]">
                    <Badge variant={
                        booking.status === 'waiting' ? 'secondary' : 
                        booking.status === 'in_chair' ? 'default' : 
                        booking.status === 'completed' ? 'outline' : 'destructive'
                    } className="capitalize px-3 py-1 text-sm">
                        {booking.status.replace('_', ' ')}
                    </Badge>
                    <div className="text-xs text-muted-foreground font-medium">
                        {booking.appointmentTime ? (
                            <span className="text-primary font-bold">
                                {new Date(booking.appointmentTime).toLocaleDateString()} at {new Date(booking.appointmentTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        ) : (
                            <span>Joined: {new Date(booking.joinedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        )}
                    </div>
                    {active && booking.status === 'waiting' && (
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            className="mt-2 h-8 text-xs w-full" 
                            onClick={() => onCancel && onCancel(booking.id)}
                        >
                            Cancel / Change
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}
