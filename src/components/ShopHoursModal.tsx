"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { toast } from "sonner";

interface ShopWorkingHourDto {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
}

interface ShopHoursModalProps {
    shopId: number | null;
    isOpen: boolean;
    onClose: () => void;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function ShopHoursModal({ shopId, isOpen, onClose }: ShopHoursModalProps) {
    const [hours, setHours] = useState<ShopWorkingHourDto[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (shopId && isOpen) {
            fetchHours();
        }
    }, [shopId, isOpen]);

    const fetchHours = async () => {
        if (!shopId) return;
        setLoading(true);
        try {
            const { data } = await api.get(`/shops/${shopId}`);
            // Logic: Backend returns shop with .workingHours
            // If empty, initialize defaults
            let initialHours = data.workingHours || [];
            
            // Fill missing days
            const fullWeek = Array.from({ length: 7 }).map((_, i) => {
                const existing = initialHours.find((h: any) => h.dayOfWeek === i);
                return existing || {
                    dayOfWeek: i,
                    openTime: data.openTime || "09:00",
                    closeTime: data.closeTime || "21:00",
                    isClosed: false
                };
            });
            
            setHours(fullWeek);
        } catch (error) {
            console.error("Failed to fetch shop details", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (index: number, field: keyof ShopWorkingHourDto, value: any) => {
        const newHours = [...hours];
        newHours[index] = { ...newHours[index], [field]: value };
        setHours(newHours);
    };

    const handleSave = async () => {
        if (!shopId) return;
        setLoading(true);
        try {
             // Ensure times are formatted properly (HH:MM)
             // Backend uses TimeSpan, string "09:00" works.
             await api.put(`/shops/${shopId}/hours`, hours);
             onClose();
             toast.success("Hours updated successfully!");
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to update hours.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Manage Working Hours</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {loading && <p className="text-center text-muted-foreground">Loading...</p>}
                    
                    {!loading && hours.map((day, index) => (
                        <div key={day.dayOfWeek} className="flex items-center gap-4 border-b pb-2 last:border-0">
                            <div className="w-24 font-medium">{DAYS[day.dayOfWeek]}</div>
                            
                            <div className="flex items-center gap-2 flex-1">
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs">Open</Label>
                                    <Input 
                                        type="time" 
                                        value={day.openTime} 
                                        onChange={(e) => handleChange(index, 'openTime', e.target.value)}
                                        disabled={day.isClosed}
                                        className="w-32"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs">Close</Label>
                                    <Input 
                                        type="time" 
                                        value={day.closeTime} 
                                        onChange={(e) => handleChange(index, 'closeTime', e.target.value)}
                                        disabled={day.isClosed}
                                        className="w-32"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 min-w-[100px]">
                                <Switch 
                                    checked={day.isClosed} 
                                    onCheckedChange={(c) => handleChange(index, 'isClosed', c)}
                                />
                                <Label className="text-sm cursor-pointer" onClick={() => handleChange(index, 'isClosed', !day.isClosed)}>
                                    {day.isClosed ? "Closed" : "Open"}
                                </Label>
                            </div>
                        </div>
                    ))}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
