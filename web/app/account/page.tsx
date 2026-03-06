"use client"
import { useEffect, useState } from "react"
import { fetchUserInfo, getStoredAuth, logout, getBasicUserFromUrlOrToken } from "@/lib/auth"
// AppSidebar and SidebarProvider are now global in layout
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

function formatDate(iso: string | number | undefined) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Try to extract basic user info from URL or token if /me fails

  useEffect(() => {
    let ignore = false;
    async function refreshUser() {
      const { token } = getStoredAuth();
      if (!token) {
        if (!ignore) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      const data = await fetchUserInfo(token);
      if (!ignore) {
        if (data && !data.error) {
          setUser(data);
        } else {
          setUser(getBasicUserFromUrlOrToken());
        }
        setLoading(false);
      }
    }
    refreshUser();
    // Listen for storage changes (e.g., login in another tab)
    function handleStorage(e: StorageEvent) {
      if (e.key === "zidbit_auth_token") refreshUser();
    }
    function handleFocus() {
      refreshUser();
    }
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    return () => {
      ignore = true;
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);
  const { expiresAt } = getStoredAuth();
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl text-center">Account</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <span className="text-gray-500">Loading...</span>
            </div>
          ) : user ? (
            <div className="flex flex-col items-center gap-4">
              <Avatar className="w-24 h-24">
                {user.picture ? (
                  <AvatarImage src={user.picture} alt={user.name || user.email} />
                ) : null}
                <AvatarFallback>{(user.name || user.email || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <div className="font-semibold text-xl">{user.name || "Unknown User"}</div>
                <div className="text-gray-500">{user.email || "Details unavailable"}</div>
              </div>
              <Separator className="my-2" />
              <div className="w-full mt-2 space-y-2">
                <div className="flex justify-between py-1 text-sm">
                  <span className="font-medium text-gray-600 dark:text-gray-300">Logged in at:</span>
                  <span>{formatDate(user.lastLoginAt || user.iat)}</span>
                </div>
                <div className="flex justify-between py-1 text-sm">
                  <span className="font-medium text-gray-600 dark:text-gray-300">Login valid till:</span>
                  <span>{formatDate(user.exp || expiresAt)}</span>
                </div>
              </div>
              {error && <div className="text-red-500 text-sm mt-2">{error} (CORS error possible on localhost)</div>}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <p className="mb-4">Not logged in.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {user ? (
            <Button variant="destructive" className="w-full" onClick={logout}>Log out</Button>
          ) : (
            <Button className="w-full" onClick={() => window.location.href = "/"}>Go Home</Button>
          )}
        </CardFooter>
      </Card>
    </main>
  );
}