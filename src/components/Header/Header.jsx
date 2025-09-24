import { useEffect, useRef, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { auth } from "../../services/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useCart } from "../../context/CartContext";
import OrderDetails from "../../pages/Orders/OrderDetails";
import "./Header.css";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [ddOpen, setDdOpen] = useState(false);
  const ddRef = useRef(null);
  const { pathname } = useLocation();
  const { totalQty } = useCart();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setDdOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [menuOpen]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ddOpen && ddRef.current && !ddRef.current.contains(e.target)) setDdOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [ddOpen]);

  const navClass = ({ isActive }) => "nav-link" + (isActive ? " active" : "");

  const logout = async () => {
    await signOut(auth);
    setDdOpen(false);
  };

  return (
    <header className="hd">
      <div className="bar">
        <Link to="/" className="logo">DigitMart</Link>

        <div className="search hide-sm">
          <span className="search-ic">
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.6"/>
              <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </span>
          <input type="text" placeholder="Search" />
        </div>

        <nav className="links hide-sm">
          <NavLink to="/" className={navClass}>Home</NavLink>
          <NavLink to="/about" className={navClass}>About</NavLink>
          <NavLink to="/contact" className={navClass}>Contact Us</NavLink>
          <NavLink to="/blog" className={navClass}>Blog</NavLink>
        </nav>

        <div className="right">
          <div className="icons">
            <Link to="/wishlist" className="ic" aria-label="Wishlist">
              <svg viewBox="0 0 24 24">
                <path d="M12 21s-7.5-4.7-9.3-9.1A5.6 5.6 0 0 1 12 6.1a5.6 5.6 0 0 1 9.3 5.8C19.5 16.3 12 21 12 21z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>

            <Link to="/cart" className="ic cart-ic" aria-label="Cart">
              <svg viewBox="0 0 24 24">
                <circle cx="9" cy="20" r="1" />
                <circle cx="17" cy="20" r="1" />
                <path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {totalQty > 0 && <span className="badge">{totalQty}</span>}
            </Link>
          </div>

          {!user ? (
            <div className="auth hide-xs">
              <Link to="/login" className="btn light">Log In</Link>
              <Link to="/signup" className="btn dark">Sign Up</Link>
            </div>
          ) : (
            <div className="user" ref={ddRef}>
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="avatar"
                  onClick={() => setDdOpen(!ddOpen)}
                />
              ) : (
                <div className="avatar" onClick={() => setDdOpen(!ddOpen)}>
                  {user.displayName?.[0]?.toUpperCase() || "U"}
                </div>
              )}
              {ddOpen && (
                <div className="dd">
                  <span className="name">{user.displayName || user.email}</span>
                  <Link to="/account">My Account</Link>
                  <Link to="/OrderDetails">Orders</Link>
                  <button onClick={logout}>Logout</button>
                </div>
              )}
            </div>
          )}

          <button className="burger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </div>

      <div className={`mnav ${menuOpen ? "show" : ""}`}>
        <div className="mnav-inner">
          <div className="mnav-top">
            <Link to="/" className="logo" onClick={() => setMenuOpen(false)}>DigitMart</Link>
            <button className="x" onClick={() => setMenuOpen(false)} aria-label="Close">×</button>
          </div>

          <div className="mnav-search">
            <span className="search-ic">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </span>
            <input type="text" placeholder="Search" />
          </div>

          <nav className="mnav-links" onClick={() => setMenuOpen(false)}>
            <NavLink to="/" className="mnav-link">Home</NavLink>
            <NavLink to="/about" className="mnav-link">About</NavLink>
            <NavLink to="/contact" className="mnav-link">Contact Us</NavLink>
            <NavLink to="/blog" className="mnav-link">Blog</NavLink>
            {!user ? (
              <>
                <Link to="/login" className="btn light mbtn">Log In</Link>
                <Link to="/signup" className="btn dark mbtn">Sign Up</Link>
              </>
            ) : (
              <button className="btn dark mbtn" onClick={logout}>Logout</button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
