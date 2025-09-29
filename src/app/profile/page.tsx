"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";

interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profileImg: string;
}

export default function Page() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter() 

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("Token topilmadi");

          router.push('/login')

          setLoading(false);
          return;
        }

        const res = await axios.get(
          "https://faxriddin.umidjon-dev.uz/profile/my/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "*/*",
            },
          }
        );

        setProfile(res.data.data);
      } catch (err) {

        if (axios.isAxiosError(err)) {
          if (err.response?.status === 401) {
            router.push("/login");
          }
        }
        setError("Profilni olishda xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return <div>Yuklanmoqda...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="flex flex-col items-center gap-4 mt-10">
      {profile && (
        <>
          <img
            src={profile.profileImg}
            alt="Profile"
            className="w-24 h-24 rounded-full shadow"
          />
          <h2 className="text-xl font-semibold">
            {profile.firstName} {profile.lastName}
          </h2>
          <p className="text-gray-600">{profile.email}</p>
          <p className="text-sm font-medium text-indigo-600">{profile.role}</p>
        </>
      )}
    </div>
  );
}
