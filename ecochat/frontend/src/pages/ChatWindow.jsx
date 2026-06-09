import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { HiPhone, HiDotsVertical, HiPaperClip, HiEmojiHappy, HiPaperAirplane, HiX, HiCheck, HiCheckCircle } from "react-icons/hi";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import { getDMMessages, sendMessage, searchUsers, markAsRead } from "../services/index.js";
import { format } from "timeago.js";
import toast from "react-hot-toast";

const ChatWindow = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [chatUser, setChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    fetchUser();
    fetchMessages();
    markAsRead(userId);
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    socket.on("message:receive", (msg) => {
      if (msg.sender?._id === userId || msg.sender === userId) {
        setMessages((prev) => [...prev, msg]);
        markAsRead(userId);
      }
    });

    socket.on("typing:start", ({ senderId }) => {
      if (senderId === userId) setIsTyping(true);
    });

    socket.on("typing:stop", ({ senderId }) => {
      if (senderId === userId) setIsTyping(false);
    });

    socket.on("message:read", ({ readBy }) => {
      if (readBy === userId) {
        setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
      }
    });

    return () => {
      socket.off("message:receive");
      socket.off("typing:start");
      socket.off("typing:stop");
      socket.off("message:read");
    };
  }, [socket, userId]);

  const fetchUser = async () => {
    try {
      const res = await searchUsers(userId);
      const found = res.data.data.find((u) => u._id === userId);
      setChatUser(found);
    } catch {}
  };

  const fetchMessages = async () => {
    try {
      const res = await getDMMessages(userId);
      setMessages(res.data.data);
    } catch {}
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!socket) return;
    socket.emit("typing:start", { receiverId: userId });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", { receiverId: userId });
    }, 1500);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMedia(file);
    if (file.type.startsWith("image")) {
      setMediaPreview(URL.createObjectURL(file));
    } else {
      setMediaPreview(null);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !media) return;
    const fd = new FormData();
    fd.append("receiverId", userId);
    if (input.trim()) fd.append("content", input);
    if (media) fd.append("media", media);

    const tempMsg = {
      _id: Date.now(),
      sender: { _id: user._id },
      content: input,
      mediaUrl: mediaPreview || "",
      mediaType: media ? "image" : "none",
      isRead: false,
      createdAt: new Date(),
      temp: true,
    };

    setMessages((prev) => [...prev, tempMsg]);
    setInput("");
    setMedia(null);
    setMediaPreview(null);
    socket?.emit("typing:stop", { receiverId: userId });

    try {
      const res = await sendMessage(fd);
      setMessages((prev) => prev.map((m) => (m._id === tempMsg._id ? res.data.data : m)));
    } catch {
      setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
      toast.error("Failed to send message");
    }
  };

  const isOnline = onlineUsers[userId]?.isOnline ?? chatUser?.isOnline;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-dark-panel border-b border-dark-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={chatUser?.avatar || `https://ui-avatars.com/api/?name=${chatUser?.fullName || "User"}&background=00a884&color=fff`}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
            />
            {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-dark-panel" />}
          </div>
          <div>
            <p className="font-semibold text-sm">{chatUser?.fullName || "Loading..."}</p>
            <p className="text-xs text-primary">
              {isTyping ? "typing..." : isOnline ? "online" : chatUser?.lastSeen ? `last seen ${format(chatUser.lastSeen)}` : "offline"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-dark-muted">
          <button className="hover:text-dark-text"><HiDotsVertical className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #3b4a5420 1px, transparent 0)", backgroundSize: "24px 24px" }}>
        {messages.map((msg) => {
          const isMe = msg.sender?._id === user._id || msg.sender === user._id;
          return (
            <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={isMe ? "chat-bubble-out" : "chat-bubble-in"}>
                {msg.mediaUrl && msg.mediaType === "image" && (
                  <img src={msg.mediaUrl} alt="media" className="rounded-lg max-w-xs mb-1 cursor-pointer" />
                )}
                {msg.mediaUrl && msg.mediaType === "file" && (
                  <a href={msg.mediaUrl} target="_blank" rel="noreferrer" className="text-blue-400 underline text-sm">📎 View File</a>
                )}
                {msg.content && <p className="text-sm">{msg.content}</p>}
                <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                  <span className="text-xs text-dark-muted">{format(msg.createdAt)}</span>
                  {isMe && (
                    msg.isRead
                      ? <HiCheckCircle className="w-3.5 h-3.5 text-blue-400" />
                      : <HiCheck className="w-3.5 h-3.5 text-dark-muted" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start">
            <div className="chat-bubble-in flex gap-1 items-center py-3">
              <span className="w-2 h-2 bg-dark-muted rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-dark-muted rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-dark-muted rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Media preview */}
      {mediaPreview && (
        <div className="px-4 py-2 bg-dark-panel border-t border-dark-border">
          <div className="relative inline-block">
            <img src={mediaPreview} alt="preview" className="h-20 rounded-lg object-cover" />
            <button onClick={() => { setMedia(null); setMediaPreview(null); }} className="absolute -top-2 -right-2 bg-dark-card rounded-full p-0.5">
              <HiX className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-3 px-4 py-3 bg-dark-panel border-t border-dark-border">
        <button onClick={() => fileRef.current?.click()} className="text-dark-muted hover:text-dark-text transition-colors">
          <HiPaperClip className="w-6 h-6" />
        </button>
        <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileSelect} />
        <input
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Type a message"
          className="flex-1 bg-dark-card rounded-xl px-4 py-2.5 text-sm text-dark-text placeholder-dark-muted focus:outline-none"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() && !media}
          className="w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          <HiPaperAirplane className="w-5 h-5 text-white rotate-90" />
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
