"use client";

export const dynamic = "force-dynamic";

import React, { useState, FormEvent, ChangeEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert, { AlertColor, AlertProps } from "@mui/material/Alert";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

// ✅ Snackbar uchun alohida alert component
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function GooglePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Tokens
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Snackbar
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState<AlertColor>("success");

  // ✅ querydan tokenlarni olish
  useEffect(() => {
    const access = searchParams.get("accessToken");
    const refresh = searchParams.get("refreshToken");

    if (access) {
      setAccessToken(access);
      localStorage.setItem("accessToken", access);
    }
    if (refresh) {
      localStorage.setItem("refreshToken", refresh);
    }
  }, [searchParams]);

  // ✅ form submit
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      if (!accessToken) throw new Error("Token topilmadi");

      await axios.post(
        "https://faxriddin.umidjon-dev.uz/auth/google/password",
        { password, age: Number(age) },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setAlertMessage("Muvaffaqiyatli ro‘yxatdan o‘tdingiz!");
      setAlertSeverity("success");
      setAlertOpen(true);

      setTimeout(() => router.push("/profile"), 1500);
    } catch (err: any) {
      const errMessage =
        err.response?.data?.message || err.message || "Xatolik yuz berdi";
      setAlertMessage(errMessage);
      setAlertSeverity("error");
      setAlertOpen(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-lg flex flex-col gap-4 w-80"
      >
        <h2 className="text-xl font-semibold text-gray-800 text-center">
          Ro‘yxatdan o‘tish
        </h2>

        {/* Yosh */}
        <div>
          <label className="block text-sm font-medium mb-1">Yosh</label>
          <input
            type="number"
            value={age}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setAge(e.target.value)
            }
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="18"
            required
          />
        </div>

        {/* Parol */}
        <div>
          <label className="block text-sm font-medium mb-1">Parol</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="******"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPassword ? <Visibility /> : <VisibilityOff />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg py-2 font-medium disabled:opacity-50"
        >
          {loading ? "Yuborilmoqda..." : "Davom etish"}
        </button>
      </form>

      {/* Snackbar */}
      <Snackbar
        open={alertOpen}
        autoHideDuration={4000}
        onClose={() => setAlertOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setAlertOpen(false)}
          severity={alertSeverity}
          sx={{ width: "100%" }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
