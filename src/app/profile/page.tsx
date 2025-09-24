"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type UserProfile = {
  firstName: string; 
  lastName: string;
  email: string;
  profileImg?: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      // agar token yo‘q bo‘lsa login sahifaga yuborish
      router.push("/login");
      return;
    }

    fetch("http://18.215.154.208:4000/profile/my/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setProfile(data);
      })
      .catch(() => {
        // token xato yoki eskirgan bo‘lsa
        localStorage.removeItem("accessToken");
        router.push("/");
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <div className="p-6">⏳ Yuklanmoqda...</div>;
  }

  if (!profile) {
    return <div className="p-6">❌ Profil topilmadi</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md max-w-md w-full text-center">
        {profile.profileImg && (
          <img
            src={profile.profileImg}
            alt="Profile"
            className="w-24 h-24 rounded-full mx-auto mb-4"
          />
        )}
        <h1 className="text-xl font-bold">
          {profile.firstName} {profile.lastName}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">{profile.email}</p>
      </div>
    </div>
  );
}
