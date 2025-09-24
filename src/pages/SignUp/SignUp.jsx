import "./SignUp.css";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider, db } from "../../services/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const messageByCode = (code) => {
  const map = {
    "auth/email-already-in-use": "This email is already in use.",
    "auth/invalid-email": "Invalid email address.",
    "auth/weak-password": "Weak password (min 6 characters).",
    "auth/operation-not-allowed": "Email/password sign-in is disabled in Firebase.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/invalid-api-key": "Invalid Firebase API key.",
    "auth/popup-closed-by-user": "The sign-in popup was closed.",
    "permission-denied": "Firestore permission denied. Check your rules.",
    "failed-precondition": "Firestore not initialized for this project.",
    "unavailable": "Service temporarily unavailable. Try again."
  };
  return map[code] || "Unexpected error. Please try again.";
};

export default function SignUp() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onChange = (e) => {
    setErr("");
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setErr("");
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setErr("Please complete all required fields.");
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(cred.user, { displayName: form.name });
      try {
        await setDoc(doc(db, "users", cred.user.uid), {
          uid: cred.user.uid,
          name: form.name,
          email: form.email,
          createdAt: serverTimestamp(),
          provider: "password",
        }, { merge: true });
      } catch (firestoreErr) {
        setErr(messageByCode(firestoreErr.code));
        console.error("Firestore error:", firestoreErr.code, firestoreErr.message);
        setLoading(false);
        return;
      }
      nav("/");
    } catch (authErr) {
      setErr(messageByCode(authErr.code));
      console.error("Auth error:", authErr.code, authErr.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setErr("");
    setLoading(true);
    try {
      const { user } = await signInWithPopup(auth, googleProvider);
      try {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: user.displayName || "",
          email: user.email || "",
          photoURL: user.photoURL || "",
          createdAt: serverTimestamp(),
          provider: "google",
        }, { merge: true });
      } catch (firestoreErr) {
        setErr(messageByCode(firestoreErr.code));
        console.error("Firestore error:", firestoreErr.code, firestoreErr.message);
        setLoading(false);
        return;
      }
      nav("/");
    } catch (authErr) {
      setErr(messageByCode(authErr.code));
      console.error("Auth error:", authErr.code, authErr.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="bw-wrap">
        <section className="bw-card">
          <div className="bw-left">
            <h1 className="bw-title">
              Create your <span>DigitMart</span> account
            </h1>
            <p className="bw-sub">Simple. Secure. Monochrome.</p>
          </div>

          <form className="bw-form" onSubmit={handleEmailSignUp}>
            <label className="bw-field">
              <span>Name</span>
              <input
                name="name"
                type="text"
                placeholder="Your full name"
                value={form.name}
                onChange={onChange}
                autoComplete="name"
              />
            </label>

            <label className="bw-field">
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

            <label className="bw-field">
              <span>Password</span>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={onChange}
                autoComplete="new-password"
              />
            </label>

            {err && <div className="bw-error">{err}</div>}

            <button className="bw-btn bw-primary" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </button>

            <button
              className="bw-btn bw-ghost"
              type="button"
              onClick={handleGoogle}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="bw-icon">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Sign up with Google
            </button>

            <p className="bw-login">
              Already have an account? <a href="/login">Log in</a>
            </p>
          </form>
        </section>
      </main>
      <Footer />
    </>
  );
}
