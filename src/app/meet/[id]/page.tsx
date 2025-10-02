"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import io from "socket.io-client";

const socket = io("https://faxriddin.bobur-dev.uz", {
  transports: ["websocket"],
});

export default function MeetingPage() {
  const { id: meetingId } = useParams();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [userId] = useState(() => crypto.randomUUID()); // Foydalanuvchi ID

  useEffect(() => {
    // 🔹 Local video/audio olish
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection();

      // Local streamni qo‘shish
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Remote stream olish
      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // ICE Candidate yuborish
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("signal", { meetingId, userId, signal: { candidate: event.candidate } });
        }
      };

      setPeerConnection(pc);

      // 🔹 Socketga ulanish
      socket.emit("joinMeeting", { meetingId, userId });

      socket.on("signal", async (data) => {
        if (data.userId === userId) return;

        if (data.signal.offer) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.signal.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("signal", { meetingId, userId, signal: { answer } });
        } else if (data.signal.answer) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.signal.answer));
        } else if (data.signal.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
          } catch (err) {
            console.error("Error adding ICE candidate", err);
          }
        }
      });
    });

    return () => {
      socket.off("signal");
    };
  }, [meetingId, userId]);

  // 🔹 Offer yaratish (1-chi user uchun)
  const startCall = async () => {
    if (!peerConnection) return;
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("signal", { meetingId, userId, signal: { offer } });
  };

  // 🔹 Chat yuborish
  const sendMessage = () => {
    if (input.trim() === "") return;
    socket.emit("sendMessage", { meetingId, senderId: userId, content: input });
    setMessages((prev) => [...prev, { sender: "Siz", text: input }]);
    setInput("");
  };

  // 🔹 Yangi xabar kelganda
  useEffect(() => {
    socket.on("newMessage", (msg) => {
      setMessages((prev) => [...prev, { sender: msg.sender.firstName || "Foydalanuvchi", text: msg.content }]);
    });

    return () => {
      socket.off("newMessage");
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Video panel */}
      <div className="flex-1 grid grid-cols-2 gap-4 p-4">
        <div className="bg-gray-800 rounded-xl shadow-lg flex items-center justify-center">
          <video ref={localVideoRef} autoPlay playsInline muted className="rounded-xl w-full h-full object-cover" />
        </div>
        <div className="bg-gray-800 rounded-xl shadow-lg flex items-center justify-center">
          <video ref={remoteVideoRef} autoPlay playsInline className="rounded-xl w-full h-full object-cover" />
        </div>
        <button
          onClick={startCall}
          className="col-span-2 bg-green-600 hover:bg-green-700 py-2 rounded-xl mt-4"
        >
          📞 Qo‘ng‘iroqni boshlash
        </button>
      </div>

      {/* Chat panel */}
      <div className="w-80 border-l border-gray-700 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((m, idx) => (
            <div key={idx} className="bg-gray-700 rounded-lg px-3 py-2">
              <b>{m.sender}:</b> {m.text}
            </div>
          ))}
        </div>
        <div className="p-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-gray-800 rounded-lg px-3 py-2 outline-none"
            placeholder="Xabar yozing..."
          />
          <button onClick={sendMessage} className="bg-blue-600 hover:bg-blue-700 px-4 rounded-lg">
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
