import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { HiDotsVertical, HiPaperClip, HiPaperAirplane, HiX, HiUserGroup, HiCheck } from "react-icons/hi";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import { getGroupById, getGroupMessages, sendGroupMessage } from "../services/index.js";
import { format } from "timeago.js";
import toast from "react-hot-toast";

const GroupChatWindow = () => {
  const { groupId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showInfo, setShowInfo] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    fetchGroup();
    fetchMessages();
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    socket.emit("group:join", groupId);

    socket.on("group:message:receive", (msg) => {
      if (msg.group === groupId || msg.group?._id === groupId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on("typing:start", ({ senderId, senderName, groupId: gId }) => {
      if (gId === groupId && senderId !== user._id) {
        setTypingUsers((prev) => [...new Set([...prev, senderName])]);
      }
    });

    socket.on("typing:stop", ({ senderId, groupId: gId }) => {
      if (gId === groupId) {
        setTypingUsers((prev) => prev.filter((_, i) => i !== 0));
      }
    });

    return () => {
      socket.off("group:message:receive");
      socket.off("typing:start");
      socket.off("typing:stop");
    };
  }, [socket, groupId]);

  const fetchGroup = async () => {
    try { const r = await getGroupById(groupId); setGroup(r.data.data); } catch {}
  };

  const fetchMessages = async () => {
    try { const r = await getGroupMessages(groupId); setMessages(r.data.data); } catch {}
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!socket) return;
    socket.emit("typing:start", { groupId });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => socket.emit("typing:stop", { groupId }), 1500);
  };

  const handleSend = async () => {
    if (!input.trim() && !media) return;
    const fd = new FormData();
    if (input.trim()) fd.append("content", input);
    if (media) fd.append("media", media);

    const tempMsg = {
      _id: Date.now(),
      sender: { _id: user._id, fullName: user.fullName, avatar: user.avatar },
      content: input,
      mediaUrl: mediaPreview || "",
      createdAt: new Date(),
      temp: true,
    };
    setMessages((prev) => [...prev, tempMsg]);
    setInput("");
    setMedia(null);
    setMediaPreview(null);

    try {
      const res = await sendGroupMessage(groupId, fd);
      setMessages((prev) => prev.map((m) => (m._id === tempMsg._id ? res.data.data : m)));
    } catch {
      setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
      toast.error("Failed to send");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-dark-panel border-b border-dark-border">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowInfo((p) => !p)}>
          <img
            src={group?.avatar || `https://ui-avatars.com/api/?name=${group?.name || "G"}&background=005c4b&color=fff`}
            alt=""
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold text-sm">{group?.name || "Group"}</p>
            <p className="text-xs text-dark-muted truncate max-w-xs">
              {typingUsers.length > 0
                ? `${typingUsers.join(", ")} typing...`
                : `${group?.members?.length || 0} members`}
            </p>
          </div>
        </div>
        <button className="text-dark-muted hover:text-dark-text"><HiDotsVertical className="w-5 h-5" /></button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #3b4a5420 1px, transparent 0)", backgroundSize: "24px 24px" }}>
            {messages.map((msg) => {
              const isMe = msg.sender?._id === user._id;
              return (
                <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-sm">
                    {!isMe && <p className="text-xs text-primary mb-1 ml-1">{msg.sender?.fullName}</p>}
                    <div className={isMe ? "chat-bubble-out" : "chat-bubble-in"}>
                      {msg.mediaUrl && msg.mediaType === "image" && (
                        <img src={msg.mediaUrl} alt="media" className="rounded-lg max-w-xs mb-1" />
                      )}
                      {msg.content && <p className="text-sm">{msg.content}</p>}
                      <span className="text-xs text-dark-muted block text-right mt-1">{format(msg.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Media Preview */}
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
            <button onClick={() => fileRef.current?.click()} className="text-dark-muted hover:text-dark-text">
              <HiPaperClip className="w-6 h-6" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files[0];
              if (f) { setMedia(f); setMediaPreview(URL.createObjectURL(f)); }
            }} />
            <input
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message"
              className="flex-1 bg-dark-card rounded-xl px-4 py-2.5 text-sm text-dark-text placeholder-dark-muted focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() && !media}
              className="w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:opacity-90 disabled:opacity-40"
            >
              <HiPaperAirplane className="w-5 h-5 text-white rotate-90" />
            </button>
          </div>
        </div>

        {/* Group Info Panel */}
        {showInfo && (
          <div className="w-72 bg-dark-surface border-l border-dark-border overflow-y-auto">
            <div className="p-4 text-center border-b border-dark-border">
              <img src={group?.avatar || `https://ui-avatars.com/api/?name=${group?.name}&background=005c4b&color=fff`} alt="" className="w-20 h-20 rounded-full object-cover mx-auto mb-2" />
              <h3 className="font-semibold">{group?.name}</h3>
              <p className="text-dark-muted text-sm">{group?.description}</p>
            </div>
            <div className="p-4">
              <p className="text-dark-muted text-xs uppercase tracking-wide mb-3">{group?.members?.length} Members</p>
              <div className="space-y-2">
                {group?.members?.map((m) => (
                  <div key={m._id} className="flex items-center gap-3">
                    <img src={m.avatar || `https://ui-avatars.com/api/?name=${m.fullName}&background=00a884&color=fff`} alt="" className="w-9 h-9 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-medium">{m.fullName}</p>
                      {group?.admin?._id === m._id && <span className="text-xs text-primary">Admin</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupChatWindow;
