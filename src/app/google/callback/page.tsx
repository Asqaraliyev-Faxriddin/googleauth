"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Bu qo‘shimcha qator build vaqtida prerender qilmaslik uchun
export const dynamic = "force-dynamic";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken =
      searchParams.get("accessToken") || searchParams.get("access_token");
    const refreshToken =
      searchParams.get("refreshToken") || searchParams.get("refresh_token");
    const error = searchParams.get("error");

    // Agar token fragment (#) orqali kelsa
    if (!accessToken && typeof window !== "undefined" && window.location.hash) {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const a = hash.get("accessToken") || hash.get("access_token");
      const r = hash.get("refreshToken") || hash.get("refresh_token");
      if (a) {
        localStorage.setItem("accessToken", a);
        if (r) localStorage.setItem("refreshToken", r);
        router.replace("/profile");
        return;
      }
    }

    if (error) {
      router.replace(`/login?oauth_error=${encodeURIComponent(error)}`);
      return;
    }

    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      router.replace("/profile");
    } else {
      router.replace("/login?oauth_failed=1");
    }
  }, [router, searchParams]);

  return <div className="p-6">🔄 OAuth jarayoni... Iltimos kuting...</div>;
}
