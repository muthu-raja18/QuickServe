// Replace the entire file:
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function SeekerDashboardPage() {
  const router = useRouter();
  const { user, loading, initialized } = useAuth();

  useEffect(() => {
    // Only check after auth is fully initialized
    if (!loading && initialized) {
      if (!user) {
        console.log("Dashboard page: No user, redirecting to login");
        router.push("/seeker/login");
      } else if (user.role !== "seeker") {
        console.log("Dashboard page: Wrong role, redirecting to home");
        router.push("/");
      }
    }
  }, [user, loading, initialized, router]);

  // Show loading while auth initializes
  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // This page should be empty - layout handles everything
  // If we reach here, auth is valid and layout will show
  return null;
}
