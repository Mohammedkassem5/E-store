import "./Home.css";
import { useEffect, useMemo, useState, useEffect as ReactUseEffect, useMemo as ReactUseMemo } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

function SafeImg({
  candidates = [],
  alt = "",
  className = "",
  style,
  width,
  height,
}) {
  const [src, setSrc] = useState(null);

  const list = ReactUseMemo(() => {
    const arr = (Array.isArray(candidates) ? candidates : [])
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter(Boolean);
    return [...new Set(arr)];
  }, [candidates]);

  ReactUseEffect(() => {
    let cancelled = false;

    async function tryNext(i) {
      if (cancelled) return;
      if (i >= list.length) {
        // Placeholder مضمون
        const txt = encodeURIComponent(alt || "Image");
        setSrc(`https://placehold.co/600x600?text=${txt}`);
        return;
      }
      const url = list[i];
      const img = new Image();
      img.onload = () => {
        if (!cancelled) setSrc(url);
      };
      img.onerror = () => {
        if (!cancelled) tryNext(i + 1);
      };
      img.src = url;
    }

    tryNext(0);
    return () => {
      cancelled = true;
    };
  }, [list, alt]);

  if (!src) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
    />
  );
}

function buildImageCandidates(product) {
  const urls = [
    ...(Array.isArray(product?.imageSources) ? product.imageSources : []),
    ...(Array.isArray(product?.gallery) ? product.gallery : []),
    product?.image,
  ]
    .flat()
    .map((u) => (typeof u === "string" ? u.trim() : ""))
    .filter(Boolean);

  return [...new Set(urls)];
}

const CatIcon = ({ name }) => {
  switch (name) {
    case "Phones":
      return (
        <svg viewBox="0 0 24 24">
          <rect x="7" y="2" width="10" height="20" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="12" cy="18.5" r="1" />
        </svg>
      );
    case "Smart Watches":
      return (
        <svg viewBox="0 0 24 24">
          <rect x="7" y="5" width="10" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <rect x="9" y="1" width="6" height="3" rx="1" />
          <rect x="9" y="20" width="6" height="3" rx="1" />
        </svg>
      );
    case "Cameras":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M4 7h4l2-2h4l2 2h4a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="12" cy="13" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "Headphones":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M3 13a9 9 0 0 1 18 0" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <rect x="2" y="13" width="5" height="8" rx="2" />
          <rect x="17" y="13" width="5" height="8" rx="2" />
        </svg>
      );
    case "Computers":
      return (
        <svg viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8 20h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "Gaming":
      return (
        <svg viewBox="0 0 24 24">
          <rect x="3" y="8" width="18" height="8" rx="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="8" cy="12" r="1.2" />
          <path d="M6.8 12h2.4M8 10.8v2.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="16" cy="10.8" r="1.2" />
          <circle cx="18" cy="12" r="1.2" />
        </svg>
      );
    default:
      return null;
  }
};

export default function Home() {
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState("New Arrival");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    fetch("/api/products.json")
      .then((r) => r.json())
      .then((data) => setItems(data.products || []))
      .catch(() => {});
  }, []);

  const cats = [
    { key: "mobiles", label: "Phones" },
    { key: "smartwatch", label: "Smart Watches" },
    { key: "cameras", label: "Cameras" },
    { key: "headphones", label: "Headphones" },
    { key: "computers", label: "Computers" },
    { key: "gaming", label: "Gaming" }
  ];

  const filtered = useMemo(() => {
    const list =
      category === "all"
        ? items
        : items.filter((p) => (p.category || "").toLowerCase() === category);
    if (tab === "Bestseller") return list.slice(0, 8);
    if (tab === "Featured Products") return list.slice(8, 16);
    return list.slice(0, 8);
  }, [items, category, tab]);

  return (
    <>
      <Header />

      <main className="home">
        <section className="browse">
          <div className="row-head">
            <h3>Browse By Category</h3>
            <div className="arrows">
              <button aria-label="Prev">‹</button>
              <button aria-label="Next">›</button>
            </div>
          </div>
          <div className="cat-grid">
            {cats.map((c) => (
              <Link
                key={c.key}
                to={`/category/${c.key}`}
                className={`cat-card ${category === c.key ? "active" : ""}`}
                onClick={() => setCategory(c.key)}
              >
                <span className="ic"><CatIcon name={c.label} /></span>
                <span>{c.label}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="tabs">
          {["New Arrival", "Bestseller", "Featured Products"].map((t) => (
            <button
              key={t}
              className={`tab ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </section>

        <section className="showall">
          <Link to="/category/all" className="showall-btn">Show All</Link>
        </section>

        <section className="cards">
          {filtered.map((p) => (
            <article className="card" key={p.id}>
              <button className="wish" aria-label="Wishlist">
                <svg viewBox="0 0 24 24">
                  <path d="M12 21s-7.5-4.7-9.3-9.1A5.6 5.6 0 0 1 12 6.1a5.6 5.6 0 0 1 9.3 5.8C19.5 16.3 12 21 12 21z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="thumb">
                <SafeImg
                  candidates={buildImageCandidates(p)}
                  alt={p.name}
                  style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain", display: "block" }}
                  width={600}
                  height={600}
                />
              </div>
              <div className="meta">
                <h4 className="name" title={p.name}>{p.name}</h4>
                <div className="prices">
                  <strong>${p.price}</strong>
                  {p.discountPrice && <span className="old">${p.discountPrice}</span>}
                </div>
                <Link className="buy" to={`/product/${p.id}`}>Buy Now</Link>
              </div>
            </article>
          ))}
        </section>

        <section className="banners">
          <div className="banner">
            <div className="b-img left watch" />
            <div className="b-txt">
              <h4>Popular Products</h4>
              <p>Explore a curated selection loved by our customers.</p>
              <Link to="/category/smartwatch" className="bw-btn">Shop Now</Link>
            </div>
          </div>
          <div className="banner">
            <div className="b-img ipad" />
            <div className="b-txt">
              <h4>iPad Pro</h4>
              <p>Ultra performance for creativity and pro workflows.</p>
              <Link to="/category/computers" className="bw-btn">Shop Now</Link>
            </div>
          </div>
          <div className="banner">
            <div className="b-img galaxy" />
            <div className="b-txt">
              <h4>Samsung Galaxy</h4>
              <p>Epic camera. Powerful performance. Stunning design.</p>
              <Link to="/category/mobiles" className="bw-btn">Shop Now</Link>
            </div>
          </div>
          <div className="banner dark">
            <div className="b-img mac" />
            <div className="b-txt">
              <h4>Macbook Pro</h4>
              <p>Pro power. Beautiful Liquid Retina XDR.</p>
              <Link to="/category/computers" className="bw-btn">Shop Now</Link>
            </div>
          </div>
        </section>

        <h3 className="section-title">Discounts up to -50%</h3>
        <section className="cards">
          {items.slice(0, 8).map((p) => (
            <article className="card" key={`deal-${p.id}`}>
              <button className="wish" aria-label="Wishlist">
                <svg viewBox="0 0 24 24">
                  <path d="M12 21s-7.5-4.7-9.3-9.1A5.6 5.6 0 0 1 12 6.1a5.6 5.6 0 0 1 9.3 5.8C19.5 16.3 12 21 12 21z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="thumb">
                <SafeImg
                  candidates={buildImageCandidates(p)}
                  alt={p.name}
                  style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain", display: "block" }}
                  width={600}
                  height={600}
                />
              </div>
              <div className="meta">
                <h4 className="name" title={p.name}>{p.name}</h4>
                <div className="prices">
                  <strong>${p.price}</strong>
                </div>
                <Link className="buy" to={`/product/${p.id}`}>Buy Now</Link>
              </div>
            </article>
          ))}
        </section>
      </main>

      <Footer />
    </>
  );
}
