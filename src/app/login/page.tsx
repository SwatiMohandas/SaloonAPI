"use client";

import { useState } from 'react';
import api, { shopApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // OTP State
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otp, setOtp] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token, { name: data.name, role: data.role });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      // Check for unverified user
      if (err.response?.status === 403 && err.response?.data?.requiresOtp) {
          const data = err.response.data;
          setMobileNumber(data.mobileNumber);
          toast.success(`OTP Sent! (Dev Code: ${data.devOtp})`);
          console.log("DEV OTP:", data.devOtp);
          setShowOtpDialog(true);
          return; // Stop further error handling
      }

      let errorMessage = 'Login failed. Please check credentials.';
      if (err.response?.data) {
           if (typeof err.response.data === 'string') errorMessage = err.response.data;
           else if (err.response.data.message) errorMessage = err.response.data.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
      e.preventDefault();
      setVerifyingOtp(true);
      console.log("Verifying OTP...", { email, mobileNumber, otp }); // Debug Log
      try {
          await shopApi.verifyOtp({ email, mobileNumber, otp });
          toast.success("Mobile verification successful! Please login.");
          setShowOtpDialog(false);
          // Auto login or just let them click sign in? Let's just close dialog and let them sign in again or auto-submit.
          // Since verify doesn't return token, user has to click "Sign In" again.
          // But their password field is still filled, so they can just click "Sign In".
      } catch (err: any) {
           let errorMessage = "Invalid OTP";
           if (err.response?.data) {
                if (typeof err.response.data === 'string') errorMessage = err.response.data;
                else if (err.response.data.message) errorMessage = err.response.data.message;
           }
          toast.error(errorMessage);
      } finally {
          setVerifyingOtp(false);
      }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
            <div className="absolute top-4 left-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/">← Home</Link>
                </Button>
            </div>
            <CardTitle className="text-2xl font-bold text-center mt-4">Welcome back</CardTitle>
            <CardDescription className="text-center">Enter your email to sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md font-medium text-center">
                        {error}
                    </div>
                )}
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
                    <Input 
                        type="email" 
                        placeholder="m@example.com" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Password</label>
                    <Input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <Button className="w-full" type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Sign In'}
                </Button>
            </form>
        </CardContent>
        <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-primary hover:underline font-medium">
                    Register
                </Link>
            </p>
        </CardFooter>
      </Card>

      {/* OTP Verification Dialog */}
      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogDescription>
                    Your account is not verified. We sent an OTP to your {mobileNumber ? `mobile number ending in ${mobileNumber.slice(-4)}` : 'registered mobile number'}.
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
                    {verifyingOtp ? 'Verifying...' : 'Verify Mobile'}
                </Button>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
