"use client";

import { useState, useEffect } from "react";
import { shopApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useParams } from "next/navigation";
import Link from "next/link";
import RatingStars from "@/components/RatingStars";
import {
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  MessageSquare,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ShopDetails {
  id: number;
  name: string;
  city: string;
  address: string;
  services: Service[];
  rating?: number;
  openTime?: string;
  closeTime?: string;
}

interface Service {
  id: number;
  name: string;
  price: number;
  durationMins: number;
}

interface QueueEntry {
  id: number;
  customerName: string;
  status: string;
  joinedAt: string;
  appointmentTime?: string;
  service?: {
    name: string;
    durationMins: number;
  };
}

interface Review {
  id: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ShopDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();

  // -- STATE --
  const [shop, setShop] = useState<ShopDetails | null>(null);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking State
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [joining, setJoining] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const [bookingMode, setBookingMode] = useState<"queue" | "appointment">(
    "queue",
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>(
    [],
  );

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Reviews State
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);

  // -- EFFECTS --
  useEffect(() => {
    const fetchInfos = async () => {
      if (!id) return;
      console.log(
        `[DEBUG] Fetching details for Shop ID: ${id} (Number: ${Number(id)})`,
      );
      setLoading(true);
      try {
        const shopRes = await shopApi.getShop(Number(id));
        setShop(shopRes.data);

        console.log("[DEBUG] Fetching queue and reviews...");
        // Parallel fetch
        try {
          const qRes = await shopApi.getQueue(Number(id));
          setQueue(qRes.data);
        } catch (e) {
          console.error("[DEBUG] Queue fetch failed", e);
        }

        try {
          const rRes = await shopApi.getReviews(Number(id));
          setReviews(rRes.data.reviews || []);
          setAvgRating(Number(rRes.data.avgRating || 0));
          setTotalReviews(
            Number(rRes.data.totalReviews || (rRes.data.reviews?.length ?? 0)),
          );
        } catch (e) {
          console.error("[DEBUG] Reviews fetch failed", e);
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load shop");
      } finally {
        setLoading(false);
      }
    };
    fetchInfos();
  }, [id]);

  useEffect(() => {
    if (bookingMode === "appointment" && selectedDate && id) {
      shopApi
        .getSlots(Number(id), selectedDate)
        .then((res) =>
          setSlots(Array.isArray(res.data?.slots) ? res.data.slots : []),
        )
        .catch((e) => console.error("Failed to fetch slots", e));
    }
  }, [bookingMode, selectedDate, id]);

  const handleJoinQueue = async () => {
    if (!user) {
      if (!customerName) {
        setShowAuthDialog(true); // Or just show helper text
        return toast.error("Please enter your name or login.");
      }
    }

    if (!selectedService) return toast.error("Please select a service.");

    if (bookingMode === "appointment" && !selectedSlot) {
      return toast.error("Please select a time slot.");
    }

    setJoining(true);
    try {
      let appointmentTime = null;
      if (bookingMode === "appointment" && selectedDate && selectedSlot) {
        appointmentTime = `${selectedDate}T${selectedSlot}:00`;
      }

      await shopApi.joinQueue({
        shopId: Number(id),
        serviceId: selectedService,
        customerName: user ? user.name : customerName,
        appointmentTime: appointmentTime,
      });

      toast.success(
        bookingMode === "appointment" ? "Appointment Booked!" : "Joined Queue!",
      );

      // Refresh Queue to show update
      const qRes = await shopApi.getQueue(Number(id));
      setQueue(qRes.data);

      // Reset form
      setCustomerName("");
      setSelectedService(null);
      setSelectedSlot(null);
    } catch (error: any) {
      console.error(error);
      const msg =
        error.response?.data || error.message || "Failed to process request.";
      // If data is object with message property
      const finalMsg =
        typeof msg === "object" && msg.message ? msg.message
        : typeof msg === "string" ? msg
        : "Failed to process request.";
      toast.error(finalMsg);
    } finally {
      setJoining(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Please login to review");

    setSubmittingReview(true);
    try {
      await shopApi.addReview({
        shopId: Number(id),
        rating: newReview.rating,
        comment: newReview.comment,
      });

      // Refresh reviews
      const { data } = await shopApi.getReviews(Number(id));
      setReviews(data.reviews || []);
      setAvgRating(Number(data.avgRating || 0));
      setTotalReviews(Number(data.totalReviews || (data.reviews?.length ?? 0)));

      setNewReview({ rating: 5, comment: "" });
      toast.success("Review submitted!");
      setIsReviewOpen(false); // Close dialog on success
    } catch (e) {
      console.error(e);
      toast.error("Failed to submit review");
      // Dialog remains open implicitly
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-20 text-muted-foreground animate-pulse">
        Loading shop details...
      </div>
    );
  if (!shop)
    return (
      <div className="text-center py-20 text-destructive">Shop not found</div>
    );

  const currentWaitTime = queue.reduce((acc, entry) => {
    if (entry.status === "in_chair")
      return acc + (entry.service?.durationMins || 20) / 2;
    return acc + (entry.service?.durationMins || 20);
  }, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Shop Header */}
      <div className="mb-8">
        <Button variant="ghost" className="mb-4 pl-0" asChild>
          <Link href="/">
            <ArrowLeft size={16} className="mr-2" /> Back to Search
          </Link>
        </Button>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">
          {shop.name}
        </h1>
        <div className="flex items-center text-muted-foreground">
          <MapPin size={18} className="mr-2" />
          {shop.address}, {shop.city}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Services & Booking */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden shadow-md">
            <CardHeader className="bg-muted/30 pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">Select a Service</CardTitle>
                {shop.openTime && shop.closeTime && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock size={12} />
                    {shop.openTime.slice(0, 5)} - {shop.closeTime.slice(0, 5)}
                  </Badge>
                )}
              </div>
              <CardDescription>
                Choose a service to join the queue.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {shop.services.length === 0 ?
                <div className="p-6 text-center text-muted-foreground">
                  No services available at this shop.
                </div>
              : <div className="divide-y relative">
                  {shop.services.map((service) => {
                    const isSelected = selectedService === service.id;
                    return (
                      <div
                        key={service.id}
                        className={`flex justify-between items-center p-4 cursor-pointer transition-all hover:bg-muted/50 ${isSelected ? "bg-primary/5 ring-1 ring-inset ring-primary" : ""}`}
                        onClick={() => setSelectedService(service.id)}
                      >
                        <div className="flex items-center gap-4">
                          {/* Custom Radio Button */}
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "border-primary" : "border-muted-foreground/40 bg-background"}`}
                          >
                            {isSelected && (
                              <div className="w-2.5 h-2.5 bg-primary rounded-full shadow-sm" />
                            )}
                          </div>

                          <div>
                            <div
                              className={`font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}
                            >
                              {service.name}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center mt-0.5">
                              <Clock size={12} className="mr-1" />
                              {service.durationMins} mins
                            </div>
                          </div>
                        </div>
                        <div className="font-bold text-lg">
                          ₹{service.price}
                        </div>
                      </div>
                    );
                  })}
                </div>
              }
            </CardContent>
          </Card>

          <Card className="mt-8 border-primary/20 bg-primary/5 shadow-md">
            <div className="bg-card border rounded-xl p-6 h-fit sticky top-24">
              <h3 className="text-xl font-semibold mb-4">Book Your Visit</h3>

              {/* Mode Switcher */}
              <div className="flex bg-muted rounded-lg p-1 mb-6">
                <button
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${bookingMode === "queue" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setBookingMode("queue")}
                >
                  Join Queue Now
                </button>
                <button
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${bookingMode === "appointment" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setBookingMode("appointment")}
                >
                  Schedule
                </button>
              </div>

              {bookingMode === "appointment" && (
                <div className="mb-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Date</label>
                    <Input
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Time</label>
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                      {Array.isArray(slots) &&
                        slots.map((slot) => (
                          <button
                            key={slot.time}
                            disabled={!slot.available}
                            onClick={() => setSelectedSlot(slot.time)}
                            className={`py-2 px-1 text-sm rounded border transition-colors
                                                ${
                                                  !slot.available ?
                                                    "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                                                  : selectedSlot === slot.time ?
                                                    "bg-primary text-primary-foreground border-primary"
                                                  : "hover:bg-accent border-input"
                                                }
                                            `}
                          >
                            {slot.time}
                          </button>
                        ))}
                      {slots.length === 0 && (
                        <p className="text-sm text-muted-foreground col-span-3">
                          No slots available for this date.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-4 border-t">
                {!user && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5 ml-1">
                      Your Name
                    </label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter your full name"
                      className="bg-white text-black"
                    />
                  </div>
                )}

                <Button
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  size="lg"
                  onClick={handleJoinQueue}
                  disabled={joining || !selectedService}
                >
                  {!selectedService ?
                    "Select a Service First"
                  : bookingMode === "appointment" ?
                    "Book Appointment"
                  : "Join Queue Now"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  {bookingMode === "appointment" ?
                    "Your slot will be reserved. Please arrive 5 mins early."
                  : "Estimated wait time: 15-30 mins"}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Live Queue Sidebar */}
        <div className="relative">
          <div className="sticky top-24 space-y-6">
            <Card className="border-t-4 border-t-primary shadow-xl">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>Live Queue</CardTitle>
                  <Badge
                    variant="destructive"
                    className="animate-pulse px-2 py-0.5"
                  >
                    LIVE
                  </Badge>
                </div>
                <CardDescription>Real-time status updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-6 text-center bg-muted/30 rounded-lg mb-6 border border-dashed">
                  <div className="text-sm font-medium text-muted-foreground">
                    Est. Wait Time
                  </div>
                  <div className="text-4xl font-black text-foreground my-1">
                    {Math.ceil(currentWaitTime)}{" "}
                    <span className="text-base font-normal text-muted-foreground">
                      mins
                    </span>
                  </div>
                  <div className="text-xs font-medium bg-background px-2 py-1 rounded-full inline-block border shadow-sm">
                    {queue.length} people ahead
                  </div>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {queue.length === 0 ?
                    <div className="text-center py-8 text-muted-foreground">
                      <Users size={32} className="mx-auto mb-2 opacity-50" />
                      <p>Queue is currently empty.</p>
                      <p className="text-xs">Be the first!</p>
                    </div>
                  : queue.map((entry, index) => (
                      <div
                        key={entry.id}
                        className="relative pl-6 pb-6 last:pb-0 border-l border-muted-foreground/20"
                      >
                        <div
                          className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${index === 0 ? "bg-primary border-primary" : "bg-background border-muted-foreground/40"}`}
                        />

                        <div className="bg-card p-3 rounded-lg border shadow-sm -mt-2">
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-semibold text-sm">
                              {entry.customerName}
                            </div>
                            {entry.status === "in_chair" && (
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-700 hover:bg-green-200 border-0 h-5"
                              >
                                In Chair
                              </Badge>
                            )}
                            {entry.appointmentTime && (
                              <Badge
                                variant="outline"
                                className="text-[10px] border-amber-500 text-amber-600 bg-amber-50 h-5"
                              >
                                Scheduled
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex justify-between items-center">
                            <span>{entry.service?.name}</span>
                            <span className="font-medium whitespace-nowrap ml-2">
                              {entry.appointmentTime ?
                                <>
                                  {new Date(
                                    entry.appointmentTime,
                                  ).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                  })}{" "}
                                  {new Date(
                                    entry.appointmentTime,
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </>
                              : new Date(entry.joinedAt).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-600 text-white border-none">
              <CardContent className="p-6">
                <h3 className="font-bold flex items-center gap-2 mb-2">
                  <AlertCircle size={18} />
                  Important
                </h3>
                <p className="text-sm opacity-90">
                  Please arrive at least 10 minutes before your estimated time.
                  Late arrivals may lose their spot.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <MessageSquare className="text-primary" />
                  Reviews & Ratings
                </div>
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-full">
                  <span className="text-2xl font-bold">
                    {avgRating.toFixed(1)}
                  </span>
                  <RatingStars rating={avgRating} size={20} />
                  <span className="text-sm text-muted-foreground">
                    ({totalReviews} reviews)
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Reviews List */}
              <div className="flex justify-between items-center bg-muted/20 p-4 rounded-lg">
                <div>
                  <h3 className="font-semibold">Customer Reviews</h3>
                  <p className="text-sm text-muted-foreground">
                    See what others are saying.
                  </p>
                </div>

                <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default">Write a Review</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Write a Review</DialogTitle>
                      <DialogDescription>
                        Share your experience with this shop.
                      </DialogDescription>
                    </DialogHeader>

                    {!user ?
                      <div className="text-center py-6">
                        <p className="text-muted-foreground mb-4">
                          Please log in to share your experience.
                        </p>
                        <Button asChild onClick={() => setIsReviewOpen(false)}>
                          <Link href="/login">Login to Review</Link>
                        </Button>
                      </div>
                    : <form
                        onSubmit={handleSubmitReview}
                        className="space-y-4 pt-4"
                      >
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Your Rating
                          </label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() =>
                                  setNewReview({ ...newReview, rating: star })
                                }
                                className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                              >
                                <Star
                                  size={32}
                                  className={
                                    star <= newReview.rating ?
                                      "fill-yellow-400 text-yellow-400"
                                    : "text-muted/30"
                                  }
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Your Review
                          </label>
                          <Textarea
                            placeholder="Tell us about your experience..."
                            value={newReview.comment}
                            onChange={(e) =>
                              setNewReview({
                                ...newReview,
                                comment: e.target.value,
                              })
                            }
                            className="bg-white text-black min-h-[120px] resize-none"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsReviewOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={submittingReview}>
                            {submittingReview ? "Submitting..." : "Post Review"}
                          </Button>
                        </div>
                      </form>
                    }
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-6">
                {reviews.length === 0 ?
                  <div className="text-center py-8 text-muted-foreground">
                    No reviews yet. Be the first to share your thoughts!
                  </div>
                : reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b pb-6 last:border-0 last:pb-0"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold">{review.userName}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="mb-2">
                        <RatingStars rating={review.rating} size={14} />
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
