"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import io, { Socket } from "socket.io-client";

interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profileImg: string | null;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImg: string | null;
}

interface Message {
  id: string;
  chatId: string;
  message: string;
  sender: { id: string; firstName: string | null; lastName: string | null };
  createdAt: string;
  isRead: boolean;
  type: string;
}

// rang olish funksiyasi
const colors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-red-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-orange-500",
];
function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Avatar komponenti
const Avatar = ({
  src,
  firstName,
  lastName,
}: {
  src?: string | null;
  firstName: string;
  lastName: string;
}) => {
  if (src) {
    return (
      <img src={src} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
    );
  }

  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  const bg = stringToColor(firstName + lastName);

  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${bg}`}
    >
      {initials}
    </div>
  );
};

export default function Page() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Profile olish
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await axios.get(
          "https://faxriddin.bobur-dev.uz/profile/my/profile",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setProfile(res.data.data);
      } catch (err) {
        setError("Profilni olishda xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Users olish
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("https://faxriddin.bobur-dev.uz/messages/users");
        setUsers(res.data);
      } catch (err) {
        console.error("Users fetch error", err);
      }
    };
    fetchUsers();
  }, []);

  // Socket ulanish
  useEffect(() => {    
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const s = io("https://faxriddin.bobur-dev.uz", {
      path: "/chat/socket.io/",
      transports: ["websocket"],
      auth: { token: `Bearer ${token}` },
    });
    
    
    s.on("connect", () => {
      console.log("Socket connected");
    });

    s.on("message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // User tanlash
  const handleSelectUser = async (user: User) => {
    setSelectedUser(user);

    try {
      const res = await axios.get(
        `https://faxriddin.bobur-dev.uz/messages/chat/${user.id}/messages`
      );
      setMessages(res.data);
    } catch (err) {
      console.error("Chat messages fetch error", err);
    }
  };

  // Xabar yuborish
  const handleSendMessage = () => {
    if (!socket || !newMessage || !selectedUser || !profile) return;

    socket.emit("send_message", {
      message: newMessage,
      chatId: null,
      receiverId: selectedUser.id,
      type: "text",
    });

    setNewMessage("");
  };

  if (loading) return <div>Yuklanmoqda...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="flex h-screen">
      {/* Chap tomonda users ro‘yxati */}
      <div className="w-1/4 border-r overflow-y-auto">
        <h2 className="p-4 font-bold text-lg">Users</h2>
        {users.map((u) => (
          <div
            key={u.id}
            className={`flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-100 ${
              selectedUser?.id === u.id ? "bg-gray-200" : ""
            }`}
            onClick={() => handleSelectUser(u)}
          >
            <Avatar src={u.profileImg} firstName={u.firstName} lastName={u.lastName} />
            <div>
              <p className="font-semibold">
                {u.firstName} {u.lastName}
              </p>
              <p className="text-sm text-gray-500">{u.email}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Ong tomonda chat + profil */}
      <div className="flex-1 flex flex-col">
        {profile && (
          <div className="p-4 border-b flex items-center gap-3">
            <Avatar
              src={profile.profileImg}
              firstName={profile.firstName}
              lastName={profile.lastName}
            />
            <div>
              <h2 className="font-semibold">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-sm text-gray-600">{profile.email}</p>
            </div>
          </div>
        )}

        {/* Chat oynasi */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {selectedUser ? (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2 rounded-lg max-w-xs ${
                  msg.sender.id === profile?.id
                    ? "bg-indigo-500 text-white ml-auto"
                    : "bg-gray-200"
                }`}
              >
                {msg.message}
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-center mt-20">
              Suhbat uchun user tanlang
            </div>
          )}
        </div>

        {selectedUser && (
          <div className="p-4 border-t flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 border rounded px-3 py-2"
              placeholder="Xabar yozing..."
            />
            <button
              onClick={handleSendMessage}
              className="bg-indigo-500 text-white px-4 py-2 rounded"
            >
              Yuborish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
