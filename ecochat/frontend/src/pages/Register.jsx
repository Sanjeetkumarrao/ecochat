import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/index.js";
import toast from "react-hot-toast";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", username: "", email: "", password: "" });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (avatar) fd.append("avatar", avatar);
    try {
      await registerUser(fd);
      toast.success("Account created! Please login.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💬</span>
            </div>
            <h1 className="text-2xl font-bold">EchoChat</h1>
            <p className="text-dark-muted mt-1">Create your account</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-dark-card border border-dark-border rounded-2xl p-8 space-y-4">
            {/* Avatar */}
            <div className="flex justify-center">
              <label className="cursor-pointer">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-dark-panel border-2 border-dark-border flex items-center justify-center hover:border-primary transition-colors">
                  {avatarPreview
                    ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                    : <span className="text-3xl text-dark-muted">+</span>}
                </div>
                <p className="text-xs text-center text-primary mt-1">Add Photo</p>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const f = e.target.files[0];
                  if (f) { setAvatar(f); setAvatarPreview(URL.createObjectURL(f)); }
                }} />
              </label>
            </div>

            {[
              { name: "fullName", label: "Full Name", placeholder: "John Doe" },
              { name: "username", label: "Username", placeholder: "johndoe" },
              { name: "email", label: "Email", placeholder: "you@example.com", type: "email" },
              { name: "password", label: "Password", placeholder: "••••••••", type: "password" },
            ].map(({ name, label, placeholder, type = "text" }) => (
              <div key={name}>
                <label className="block text-sm font-medium mb-1.5 text-dark-muted">{label}</label>
                <input
                  name={name}
                  type={type}
                  value={form[name]}
                  onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                  placeholder={placeholder}
                  required
                  className="input"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>

            <p className="text-center text-dark-muted text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
