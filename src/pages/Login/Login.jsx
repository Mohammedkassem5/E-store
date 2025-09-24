import "./Login.css";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../../services/firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";

export default function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const onChange = (e) => {
    setErr("");
    setMsg("");
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const normalizeError = (code) => {
    const map = {
      "auth/invalid-email": "Invalid email address.",
      "auth/user-disabled": "This account is disabled.",
      "auth/user-not-found": "No account found for this email.",
      "auth/wrong-password": "Incorrect password.",
      "auth/popup-closed-by-user": "Google popup was closed.",
      "auth/network-request-failed": "Network error. Try again.",
    };
    return map[code] || "Unexpected error. Please try again.";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    if (!form.email.trim() || !form.password.trim()) {
      setErr("Please fill in both email and password.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      nav("/");
    } catch (e) {
      setErr(normalizeError(e.code));
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setErr("");
    setMsg("");
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      nav("/");
    } catch (e) {
      setErr(normalizeError(e.code));
    } finally {
      setLoading(false);
    }
  };

  const doReset = async () => {
    setErr("");
    setMsg("");
    if (!form.email.trim()) {
      setErr("Enter your email to receive a reset link.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, form.email);
      setMsg("Password reset link sent to your email.");
    } catch (e) {
      setErr(normalizeError(e.code));
    }
  };

  return (
    <>
      <Header />

      <main className="lg-wrap">
        {/* Left visual (hidden on small screens) */}
        <aside className="lg-visual" aria-hidden="true">
          <div className="lg-art">
            <div className="dot" />
            <div className="dot" />
            <div className="dot" />
          </div>
        </aside>

        {/* Form */}
        <section className="lg-card">
          <h1 className="lg-title">Log in to <span>DigitMart</span></h1>
          <p className="lg-sub">Enter your details below</p>

          <form className="lg-form" onSubmit={onSubmit}>
            <label className="lg-field">
              <span>Email</span>
              <input
                name="email"
                type="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={onChange}
                autoComplete="email"
              />
            </label>

            <label className="lg-field">
              <span>Password</span>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={onChange}
                autoComplete="current-password"
              />
            </label>

            {err && <div className="lg-error" role="alert">{err}</div>}
            {msg && <div className="lg-msg">{msg}</div>}

            <button className="lg-btn lg-primary" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </button>

            <button
              className="lg-btn lg-ghost"
              type="button"
              onClick={loginWithGoogle}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" className="lg-icon" aria-hidden="true">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Continue with Google
            </button>

            <div className="lg-bottom">
              <button type="button" className="link" onClick={doReset}>
                Forgot password?
              </button>
              <span className="sep">•</span>
              <span>
                Don’t have an account? <Link to="/signup" className="link">Create one</Link>
              </span>
            </div>
          </form>
        </section>
      </main>

      <Footer />
    </>
  );
}
