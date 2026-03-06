"use client"
import { useEffect } from "react"
import { handleAuthCallback } from "@/lib/auth"
import { useRouter } from "next/navigation"

export default function CallbackPage() {
  const router = useRouter();
  useEffect(() => {
    const result = handleAuthCallback();
    // After storing token, redirect to home or account page
    setTimeout(() => {
      router.replace("/account");
    }, 500);
  }, [router]);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Logging you in...</h1>
      <p>Please wait while we complete your login.</p>
    </div>
  );
}