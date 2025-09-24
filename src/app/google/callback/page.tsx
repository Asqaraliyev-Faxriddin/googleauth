"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // query params dan olish
    const accessToken = searchParams.get("accessToken") || searchParams.get("access_token");
    const refreshToken = searchParams.get("refreshToken") || searchParams.get("refresh_token");
    const error = searchParams.get("error");

    // agar tokenlar fragment (#) orqali kelsa (ba'zi serverlar shunday yuboradi)
    if (!accessToken && typeof window !== "undefined" && window.location.hash) {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const a = hash.get("accessToken") || hash.get("access_token");
      const r = hash.get("refreshToken") || hash.get("refresh_token");
      if (a) {
        localStorage.setItem("accessToken", a);
        if (r) localStorage.setItem("refreshToken", r);
        router.replace("/profile"); // yoki kerakli page
        return;
      }
    }

    if (error) {
      // OAuth jarayonida xato bo‘lsa
      router.replace(`/login?oauth_error=${encodeURIComponent(error)}`);
      return;
    }

    if (accessToken) {
      // Saqlash (localStorage) — oson yo‘l. Xavfsizlik uchun httpOnly cookie ma'qulroq.
      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

      // redirect to profile yoki home
      router.replace("/profile");
    } else {
      // token yo'q — login sahifasiga qaytarish
      router.replace("/login?oauth_failed=1");
    }
  }, [router, searchParams]);

  return <div className="p-6">🔄 OAuth jarayoni... Iltimos kuting...</div>;
}
