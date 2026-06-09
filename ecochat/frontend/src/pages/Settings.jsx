import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { updateProfile, changePassword } from "../services/index.js";
import { HiCamera, HiShieldCheck, HiUser } from "react-icons/hi";
import toast from "react-hot-toast";

export default function Settings() {
  const { user, fetchCurrentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [form, setForm] = useState({ fullName: user?.fullName || "", about: user?.about || "" });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("fullName", form.fullName);
      fd.append("about", form.about);
      if (avatarFile) fd.append("avatar", avatarFile);
      await updateProfile(fd);
      await fetchCurrentUser();
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("Passwords don't match");
    }
    setSaving(true);
    try {
      await changePassword({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword });
      toast.success("Password changed!");
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  return (
    <div className="flex flex-col h-full bg-dark-bg">
      {/* Header */}
      <div className="px-6 py-4 bg-dark-panel border-b border-dark-border">
        <h2 className="text-lg font-semibold">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-xl mx-auto w-full">
        {/* Avatar section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <img
              src={avatarPreview || user?.avatar || `https://ui-avatars.com/api/?name=${user?.fullName}&background=00a884&color=fff`}
              alt=""
              className="w-24 h-24 rounded-full object-cover border-4 border-dark-border"
            />
            <label className="absolute bottom-0 right-0 bg-primary rounded-full p-2 cursor-pointer hover:opacity-90 transition-opacity">
              <HiCamera className="w-4 h-4 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
          <p className="mt-3 font-semibold text-lg">{user?.fullName}</p>
          <p className="text-dark-muted text-sm">@{user?.username}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-dark-card rounded-xl p-1 mb-6">
          {[
            { id: "profile", icon: HiUser, label: "Profile" },
            { id: "password", icon: HiShieldCheck, label: "Password" }
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id ? "bg-dark-panel text-dark-text" : "text-dark-muted hover:text-dark-text"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <form onSubmit={handleProfileSave} className="bg-dark-card border border-dark-border rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-dark-muted">Full Name</label>
              <input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-dark-muted">About</label>
              <textarea
                value={form.about}
                onChange={(e) => setForm({ ...form, about: e.target.value })}
                rows={3}
                className="input resize-none"
                placeholder="Hey there! I am using EchoChat."
              />
            </div>
            <div>
              <label className="block text-sm text-dark-muted mb-1">Email</label>
              <p className="text-sm text-dark-text px-1">{user?.email}</p>
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}

        {/* Password Tab */}
        {activeTab === "password" && (
          <form onSubmit={handlePasswordSave} className="bg-dark-card border border-dark-border rounded-xl p-6 space-y-4">
            {[
              { key: "oldPassword", label: "Current Password" },
              { key: "newPassword", label: "New Password" },
              { key: "confirmPassword", label: "Confirm New Password" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1.5 text-dark-muted">{label}</label>
                <input
                  type="password"
                  value={passwordForm[key]}
                  onChange={(e) => setPasswordForm({ ...passwordForm, [key]: e.target.value })}
                  className="input"
                  required
                />
              </div>
            ))}
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? "Changing..." : "Change Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
