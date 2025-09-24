import "./Category.css";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

const toSlug = (s) => s?.toLowerCase().replace(/\s+/g, "-");

export default function Category() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);

  const q = {
    brand: search.getAll("brand"),
    color: search.getAll("color"),
    min: Number(search.get("min")) || 0,
    max: Number(search.get("max")) || 999999,
    rating: Number(search.get("rating")) || 0,
    stock: search.get("stock") === "1",
    sort: search.get("sort") || "relevance",
  };

  useEffect(() => {
    setLoading(true);
    fetch("/api/products.json")
      .then((r) => r.json())
      .then((d) => setAll(d.products || []))
      .finally(() => setLoading(false));
  }, []);

  const base = useMemo(() => {
    if (slug === "all") return all;
    return all.filter((p) => toSlug(p.category) === slug);
  }, [all, slug]);

  const facets = useMemo(() => {
    const brands = new Map();
    const colors = new Map();
    let min = Infinity, max = -Infinity;
    base.forEach((p) => {
      const b = p.brand || "Other";
      brands.set(b, (brands.get(b) || 0) + 1);
      (p.colors || []).forEach((c) => colors.set(c, (colors.get(c) || 0) + 1));
      min = Math.min(min, Number(p.price));
      max = Math.max(max, Number(p.price));
    });
    return {
      brands: [...brands.entries()].sort(),
      colors: [...colors.entries()].sort(),
      min: isFinite(min) ? Math.floor(min) : 0,
      max: isFinite(max) ? Math.ceil(max) : 0,
    };
  }, [base]);

  const filtered = useMemo(() => {
    let list = base.filter((p) => {
      const inBrand = q.brand.length ? q.brand.includes(p.brand || "Other") : true;
      const inColor = q.color.length ? (p.colors || []).some((c) => q.color.includes(c)) : true;
      const inPrice = Number(p.price) >= q.min && Number(p.price) <= q.max;
      const inRating = (p.rating || 0) >= q.rating;
      const inStock = q.stock ? (p.stock || 0) > 0 : true;
      return inBrand && inColor && inPrice && inRating && inStock;
    });
    if (q.sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (q.sort === "price-desc") list.sort((a, b) => b.price - a.price);
    if (q.sort === "rating") list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return list;
  }, [base, q.brand, q.color, q.min, q.max, q.rating, q.stock, q.sort]);

  const setParamArr = (key, arr) => {
    const s = new URLSearchParams(search);
    s.delete(key);
    arr.forEach((v) => s.append(key, v));
    setSearch(s, { replace: true });
  };

  const toggleMulti = (key, value) => {
    const arr = new Set(search.getAll(key));
    if (arr.has(value)) arr.delete(value);
    else arr.add(value);
    setParamArr(key, [...arr]);
  };

  const setSingle = (key, value) => {
    const s = new URLSearchParams(search);
    if (value === "" || value === null || value === undefined) s.delete(key);
    else s.set(key, String(value));
    setSearch(s, { replace: true });
  };

  const resetAll = () => {
    navigate("/category/all", { replace: true });
    setSearch(new URLSearchParams(), { replace: true });
  };

  const title = useMemo(() => {
    if (slug === "all") return "All Products";
    return base[0]?.category || "Products";
  }, [base, slug]);

  return (
    <>
      <Header />
      <main className="cat-wrap">
        <div className="crumbs">
          <Link to="/">Home</Link>
          <span>›</span>
          <span className="curr">{title}</span>
        </div>

        <section className="cat-body">
          <aside className="filters">
            <div className="f-head">
              <h3>Filters</h3>
              <button className="clear" onClick={resetAll}>Clear</button>
            </div>

            <div className="f-block">
              <h4>Price</h4>
              <div className="range">
                <input
                  type="number"
                  min={facets.min}
                  max={facets.max}
                  value={q.min}
                  onChange={(e) => setSingle("min", e.target.value)}
                />
                <span>—</span>
                <input
                  type="number"
                  min={facets.min}
                  max={facets.max}
                  value={q.max}
                  onChange={(e) => setSingle("max", e.target.value)}
                />
              </div>
            </div>

            <div className="f-block">
              <h4>Brand</h4>
              <div className="list">
                {facets.brands.map(([b, n]) => (
                  <label key={b} className="check">
                    <input
                      type="checkbox"
                      checked={q.brand.includes(b)}
                      onChange={() => toggleMulti("brand", b)}
                    />
                    <span>{b}</span>
                    <em>{n}</em>
                  </label>
                ))}
              </div>
            </div>

            <div className="f-block">
              <h4>Color</h4>
              <div className="chips">
                {facets.colors.map(([c]) => (
                  <button
                    key={c}
                    className={`chip ${q.color.includes(c) ? "on" : ""}`}
                    onClick={() => toggleMulti("color", c)}
                  >
                    <span className="dot" style={{ background: c }} />
                    <span>{c}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="f-block">
              <h4>Rating</h4>
              <div className="stars">
                {[0, 3, 4].map((r) => (
                  <button
                    key={r}
                    className={`starset ${q.rating === r ? "on" : ""}`}
                    onClick={() => setSingle("rating", r)}
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} viewBox="0 0 24 24" className={i < r ? "fill" : ""}>
                        <path d="M12 17.3l6.18 3.7-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                      </svg>
                    ))}
                    {r === 0 ? <span>Any</span> : <span>{r}+</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="f-block">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={q.stock}
                  onChange={(e) => setSingle("stock", e.target.checked ? "1" : "")}
                />
                <span>In stock only</span>
              </label>
            </div>
          </aside>

          <section className="results">
            <div className="toolbar">
              <h2>{title}</h2>
              <div className="meta">
                <span>{loading ? "Loading..." : `${filtered.length} results`}</span>
                <select
                  value={q.sort}
                  onChange={(e) => setSingle("sort", e.target.value)}
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>

            <div className="grid">
              {filtered.map((p) => (
                <article className="card" key={p.id}>
                  <button className="wish" aria-label="Wishlist">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 21s-7.5-4.7-9.3-9.1A5.6 5.6 0 0 1 12 6.1a5.6 5.6 0 0 1 9.3 5.8C19.5 16.3 12 21 12 21z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <div className="thumb">
                    <img
                      src={p.image || (p.gallery?.[0] ?? "")}
                      alt={p.name}
                      loading="lazy"
                      decoding="async"
                      width={600}
                      height={600}
                      style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain", display: "block" }}
                    />
                  </div>
                  <div className="meta">
                    <h4 className="name" title={p.name}>{p.name}</h4>
                    <div className="row">
                      <div className="rating">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg key={i} viewBox="0 0 24 24" className={i < Math.round(p.rating || 0) ? "fill" : ""}>
                            <path d="M12 17.3l6.18 3.7-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                          </svg>
                        ))}
                      </div>
                      {p.stock > 0 ? <span className="tag ok">In stock</span> : <span className="tag out">Out of stock</span>}
                    </div>
                    <div className="prices">
                      <strong>${p.price}</strong>
                      {p.discountPrice && <span className="old">${p.discountPrice}</span>}
                    </div>
                    <Link to={`/product/${p.id}`} className="buy">Buy Now</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      </main>
      <Footer />
    </>
  );
}
