import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { HiSearch, HiDotsVertical, HiUserGroup, HiBell, HiCog, HiX, HiPlus } from "react-icons/hi";
import { useAuth } from "../../context/AuthContext.jsx";
import { useSocket } from "../../context/SocketContext.jsx";
import {
  getConversations, getUserGroups, searchUsers,
  getNotifications, markAllRead, createGroup,
} from "../../services/index.js";
import { format } from "timeago.js";
import toast from "react-hot-toast";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState("chats");
  const [conversations, setConversations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: "", description: "", members: [] });
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState([]);
  const menuRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("message:receive", () => fetchConversations());
    socket.on("group:message:receive", () => fetchGroups());
    return () => {
      socket.off("message:receive");
      socket.off("group:message:receive");
    };
  }, [socket]);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchData = () => { fetchConversations(); fetchGroups(); fetchNotifs(); };
  const fetchConversations = async () => {
    try { const r = await getConversations(); setConversations(r.data.data); } catch {}
  };
  const fetchGroups = async () => {
    try { const r = await getUserGroups(); setGroups(r.data.data); } catch {}
  };
  const fetchNotifs = async () => {
    try { const r = await getNotifications(); setNotifications(r.data.data); } catch {}
  };

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) return setSearchResults([]);
    try {
      const r = await searchUsers(q);
      setSearchResults(r.data.data);
    } catch {}
  };

  const handleMemberSearch = async (q) => {
    setMemberSearch(q);
    if (!q.trim()) return setMemberResults([]);
    try {
      const r = await searchUsers(q);
      setMemberResults(r.data.data);
    } catch {}
  };

  const handleCreateGroup = async () => {
    if (!groupForm.name.trim()) return toast.error("Group name required");
    if (groupForm.members.length < 1) return toast.error("Add at least 1 member");
    try {
      const fd = new FormData();
      fd.append("name", groupForm.name);
      fd.append("description", groupForm.description);
      fd.append("members", JSON.stringify(groupForm.members.map((m) => m._id)));
      await createGroup(fd);
      toast.success("Group created!");
      setShowNewGroup(false);
      setGroupForm({ name: "", description: "", members: [] });
      fetchGroups();
    } catch { toast.error("Failed to create group"); }
  };

  const handleLogout = async () => { await logout(); navigate("/login"); };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="w-[380px] flex-shrink-0 bg-dark-surface border-r border-dark-border flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-dark-panel">
        <div className="flex items-center gap-3">
          <img
            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.fullName}&background=00a884&color=fff`}
            alt={user?.username}
            className="w-10 h-10 rounded-full object-cover cursor-pointer"
            onClick={() => navigate("/settings")}
          />
          <span className="font-semibold text-dark-text">{user?.fullName}</span>
        </div>
        <div className="flex items-center gap-3 text-dark-muted">
          <button
            onClick={() => setShowNewGroup(true)}
            className="hover:text-dark-text transition-colors"
            title="New Group"
          >
            <HiUserGroup className="w-5 h-5" />
          </button>
          <button
            onClick={() => { setActiveTab("notifications"); fetchNotifs(); markAllRead(); }}
            className="relative hover:text-dark-text transition-colors"
          >
            <HiBell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setShowMenu((p) => !p)} className="hover:text-dark-text transition-colors">
              <HiDotsVertical className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-dark-card border border-dark-border rounded-xl shadow-xl z-50 py-2">
                <button onClick={() => { navigate("/settings"); setShowMenu(false); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-dark-panel transition-colors">Settings</button>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-dark-panel transition-colors">Logout</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 bg-dark-surface">
        <div className="flex items-center gap-2 bg-dark-panel rounded-lg px-3 py-2">
          <HiSearch className="w-4 h-4 text-dark-muted flex-shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search or start new chat"
            className="bg-transparent text-sm text-dark-text placeholder-dark-muted focus:outline-none flex-1"
          />
          {searchQuery && <button onClick={() => { setSearchQuery(""); setSearchResults([]); }}><HiX className="w-4 h-4 text-dark-muted" /></button>}
        </div>
      </div>

      {/* Tabs */}
      {!searchQuery && (
        <div className="flex border-b border-dark-border">
          {["chats", "groups", "notifications"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors border-b-2 ${
                activeTab === tab ? "border-primary text-primary" : "border-transparent text-dark-muted hover:text-dark-text"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Search Results */}
        {searchQuery && (
          <div>
            {searchResults.length === 0 ? (
              <p className="text-center text-dark-muted text-sm py-8">No users found</p>
            ) : searchResults.map((u) => (
              <div
                key={u._id}
                onClick={() => { navigate(`/chat/${u._id}`); setSearchQuery(""); setSearchResults([]); }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-dark-panel cursor-pointer transition-colors"
              >
                <div className="relative">
                  <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.fullName}&background=00a884&color=fff`} alt="" className="w-12 h-12 rounded-full object-cover" />
                  {(onlineUsers[u._id]?.isOnline || u.isOnline) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-dark-surface" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{u.fullName}</p>
                  <p className="text-dark-muted text-xs">@{u.username}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chats Tab */}
        {!searchQuery && activeTab === "chats" && (
          conversations.length === 0 ? (
            <div className="text-center py-12 text-dark-muted text-sm">
              <HiSearch className="w-10 h-10 mx-auto mb-3 opacity-40" />
              Search for users to start chatting
            </div>
          ) : conversations.map((conv) => {
            const isActive = location.pathname === `/chat/${conv._id}`;
            const isOnline = onlineUsers[conv._id]?.isOnline ?? conv.user?.isOnline;
            return (
              <div
                key={conv._id}
                onClick={() => navigate(`/chat/${conv._id}`)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-dark-border/30 ${isActive ? "bg-dark-panel" : "hover:bg-dark-panel"}`}
              >
                <div className="relative flex-shrink-0">
                  <img src={conv.user?.avatar || `https://ui-avatars.com/api/?name=${conv.user?.fullName}&background=00a884&color=fff`} alt="" className="w-12 h-12 rounded-full object-cover" />
                  {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-dark-surface" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-sm truncate">{conv.user?.fullName}</p>
                    <span className="text-dark-muted text-xs flex-shrink-0">{format(conv.lastMessage?.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <p className="text-dark-muted text-xs truncate">
                      {conv.lastMessage?.mediaUrl ? "📎 Media" : conv.lastMessage?.content}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">{conv.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Groups Tab */}
        {!searchQuery && activeTab === "groups" && (
          groups.length === 0 ? (
            <div className="text-center py-12 text-dark-muted text-sm">
              <HiUserGroup className="w-10 h-10 mx-auto mb-3 opacity-40" />
              No groups yet. Create one!
            </div>
          ) : groups.map((group) => {
            const isActive = location.pathname === `/group/${group._id}`;
            return (
              <div
                key={group._id}
                onClick={() => navigate(`/group/${group._id}`)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-dark-border/30 ${isActive ? "bg-dark-panel" : "hover:bg-dark-panel"}`}
              >
                <img src={group.avatar || `https://ui-avatars.com/api/?name=${group.name}&background=005c4b&color=fff`} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <p className="font-medium text-sm truncate">{group.name}</p>
                    <span className="text-dark-muted text-xs">{group.updatedAt && format(group.updatedAt)}</span>
                  </div>
                  <p className="text-dark-muted text-xs truncate">{group.members?.length} members</p>
                </div>
              </div>
            );
          })
        )}

        {/* Notifications Tab */}
        {!searchQuery && activeTab === "notifications" && (
          notifications.length === 0 ? (
            <div className="text-center py-12 text-dark-muted text-sm">
              <HiBell className="w-10 h-10 mx-auto mb-3 opacity-40" />
              No notifications
            </div>
          ) : notifications.map((n) => (
            <div key={n._id} className={`flex items-center gap-3 px-4 py-3 border-b border-dark-border/30 ${!n.isRead ? "bg-dark-panel/50" : ""}`}>
              <img src={n.sender?.avatar || `https://ui-avatars.com/api/?name=${n.sender?.fullName}&background=00a884&color=fff`} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">{n.message}</p>
                <p className="text-dark-muted text-xs">{format(n.createdAt)}</p>
              </div>
              {!n.isRead && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />}
            </div>
          ))
        )}
      </div>

      {/* New Group Modal */}
      {showNewGroup && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Create New Group</h3>
              <button onClick={() => setShowNewGroup(false)}><HiX className="w-5 h-5 text-dark-muted" /></button>
            </div>
            <div className="space-y-3">
              <input value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} placeholder="Group name *" className="input" />
              <input value={groupForm.description} onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })} placeholder="Description (optional)" className="input" />
              <input value={memberSearch} onChange={(e) => handleMemberSearch(e.target.value)} placeholder="Search members..." className="input" />
              {memberResults.length > 0 && (
                <div className="bg-dark-panel rounded-lg max-h-32 overflow-y-auto">
                  {memberResults.map((u) => (
                    <div key={u._id} onClick={() => {
                      if (!groupForm.members.find((m) => m._id === u._id)) {
                        setGroupForm({ ...groupForm, members: [...groupForm.members, u] });
                      }
                      setMemberSearch(""); setMemberResults([]);
                    }} className="flex items-center gap-2 px-3 py-2 hover:bg-dark-border cursor-pointer text-sm">
                      <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.fullName}&background=00a884&color=fff`} alt="" className="w-7 h-7 rounded-full object-cover" />
                      {u.fullName}
                    </div>
                  ))}
                </div>
              )}
              {groupForm.members.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {groupForm.members.map((m) => (
                    <span key={m._id} className="flex items-center gap-1 bg-primary/20 text-primary text-xs px-2 py-1 rounded-full">
                      {m.fullName}
                      <button onClick={() => setGroupForm({ ...groupForm, members: groupForm.members.filter((x) => x._id !== m._id) })}><HiX className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
              <button onClick={handleCreateGroup} className="btn-primary w-full">Create Group</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
