"use client";

import { useState } from 'react';
import api, { shopApi } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Scissors, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'owner'>('customer');
  
  // OTP State
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/register', { name, email, password, role, mobileNumber });
      // If registration success, backend should prompt for OTP
      if (res.data.requiresOtp) {
          toast.success(`OTP Sent! (Dev Code: ${res.data.devOtp})`); // Show OTP for testing
          console.log("DEV OTP:", res.data.devOtp);
          setShowOtpDialog(true);
      } else {
          toast.success("Registration successful! Please login.");
          router.push('/login?registered=true');
      }
    } catch (err: any) {
      let errorMessage = 'Registration failed.';
       if (err.response?.data) {
          if (typeof err.response.data === 'string') errorMessage = err.response.data;
          else if (err.response.data.message) errorMessage = err.response.data.message;
          else if (err.response.data.title) errorMessage = err.response.data.title;
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
      e.preventDefault();
      setVerifyingOtp(true);
      try {
          await shopApi.verifyOtp({ email, mobileNumber, otp });
          toast.success("Mobile verification successful!");
          setShowOtpDialog(false);
          router.push('/login?verified=true');
      } catch (err: any) {
          let errorMessage = "Invalid OTP";
           if (err.response?.data) {
                if (typeof err.response.data === 'string') errorMessage = err.response.data;
                else if (err.response.data.message) errorMessage = err.response.data.message;
                else if (err.response.data.title) errorMessage = err.response.data.title;
           }
          toast.error(errorMessage);
      } finally {
          setVerifyingOtp(false);
      }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center relative">
            <div className="absolute top-0 left-0">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/">← Home</Link>
                </Button>
            </div>
            <CardTitle className="text-2xl font-bold mt-6">Create an account</CardTitle>
            <CardDescription>Get started with SaloonApp today</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
                 {error && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md font-medium text-center">
                        {error}
                    </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                    <div 
                        className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center gap-2 transition-all ${role === 'customer' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-muted hover:bg-muted/50'}`}
                        onClick={() => setRole('customer')}
                    >
                        <User size={24} className={role === 'customer' ? 'text-primary' : 'text-muted-foreground'} />
                        <span className="text-sm font-medium">Customer</span>
                    </div>
                    <div 
                         className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center gap-2 transition-all ${role === 'owner' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-muted hover:bg-muted/50'}`}
                         onClick={() => setRole('owner')}
                    >
                        <Scissors size={24} className={role === 'owner' ? 'text-primary' : 'text-muted-foreground'} />
                        <span className="text-sm font-medium">Shop Owner</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Full Name</label>
                    <Input 
                        placeholder="John Doe" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Email</label>
                    <Input 
                        type="email" 
                        placeholder="m@example.com" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Mobile Number</label>
                    <Input 
                        type="tel"
                        placeholder="1234567890" 
                        required
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Password</label>
                    <Input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <Button className="w-full mt-2" type="submit" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Sign Up'}
                </Button>
            </form>
        </CardContent>
        <CardFooter className="flex justify-center">
             <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                    Login
                </Link>
            </p>
        </CardFooter>
      </Card>

      {/* OTP Verification Dialog */}
      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Verify Mobile Number</DialogTitle>
                <DialogDescription>
                    We have sent a 6-digit OTP to your mobile number. Please enter it below.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleVerifyOtp} className="space-y-4 pt-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">One-Time Password</label>
                    <Input 
                        placeholder="123456" 
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="text-center text-lg tracking-widest"
                    />
                </div>
                <Button type="submit" className="w-full" disabled={verifyingOtp}>
                    {verifyingOtp ? 'Verifying...' : 'Verify & Login'}
                </Button>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
