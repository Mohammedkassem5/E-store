import "./Product.css";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

function buildImages(p) {
  if (!p) return [];
  const normalize = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      return val.split(",").map(s => s.trim()).filter(Boolean);
    }
    return [];
  };

  const urls = [
    ...normalize(p.imageSources),
    ...normalize(p.gallery),
    p.image
  ].filter(Boolean);

  return Array.from(new Set(urls));
}


export default function Product() {
  const { id } = useParams();
  const nav = useNavigate();
  const [all, setAll] = useState([]);
  const [p, setP] = useState(null);

  const [imgIndex, setImgIndex] = useState(0);

  const [color, setColor] = useState("");
  const [option, setOption] = useState("");
  const [moreSpecs, setMoreSpecs] = useState(false);
  const [moreReviews, setMoreReviews] = useState(false);

  const { addItem } = useCart();

  useEffect(() => {
    fetch("/api/products.json")
      .then((r) => r.json())
      .then((d) => setAll(d.products || []))
      .catch(() => setAll([]));
  }, []);

  useEffect(() => {
    const prod = all.find((x) => String(x.id) === String(id));
    setP(prod || null);
    setImgIndex(0);
    if (prod) {
      setColor((prod.colors && prod.colors[0]) || "");
      setOption((prod.options && prod.options[0]) || "");
    }
  }, [all, id]);

  const images = useMemo(() => buildImages(p), [p]);
  const activeImg = images[imgIndex] || "";

  const onStageError = useCallback(() => {
    setImgIndex((i) => {
      const next = i + 1;
      return next < images.length ? next : i;
    });
  }, [images.length]);

  const thumbs = useMemo(() => images.slice(0, 6), [images]);

  const related = useMemo(() => {
    if (!p) return [];
    return all
      .filter((x) => x.id !== p.id && (x.category || "") === (p.category || ""))
      .slice(0, 4);
  }, [all, p]);

  const reviews = useMemo(() => {
    if (!p) return [];
    return [
      {
        id: 1,
        name: "Grace Carey",
        date: "24 January,2023",
        rate: 4,
        text:
          "I was a bit nervous to be buying a secondhand phone, but I couldn’t be happier with my purchase! It came in excellent condition and everything is PERFECT.",
      },
      {
        id: 2,
        name: "Ronald Richards",
        date: "24 January,2023",
        rate: 5,
        text:
          "This phone has 1T storage and is durable. If you want a phone that’s going to last, grab it. Works great and gets several cords and plugs.",
      },
      {
        id: 3,
        name: "Darcy King",
        date: "24 January,2023",
        rate: 4,
        text:
          "Maybe the only one to say this but the camera is a little funky. Hoping it will change with a software update; otherwise, love this phone!",
      },
    ];
  }, [p]);

  const specGroups = useMemo(() => {
    if (!p?.specs) return [];
    const s = p.specs;
    const g = [];

    const screen = [
      ["Screen diagonal", s.screen],
      ["The screen resolution", s.resolution],
      ["The screen refresh rate", s.refresh],
      ["The pixel density", s.ppi],
      ["Screen type", s.screenType],
      [
        "Additionally",
        Array.isArray(s.additional) ? s.additional.join(" • ") : s.additional,
      ],
    ].filter((row) => row[1]);
    if (screen.length) g.push({ title: "Screen", rows: screen });

    const cpu = [
      ["CPU", s.cpu],
      ["Number of cores", s.cores],
      ["RAM", s.ram],
      ["Storage", s.storage],
      ["GPU", s.gpu],
      ["OS", s.os],
    ].filter((row) => row[1]);
    if (cpu.length) g.push({ title: "CPU", rows: cpu });

    const camera = [
      ["Sensor", s.sensor],
      ["Main camera", s.camera],
      ["Front camera", s.frontCamera],
      ["Video", s.video],
      ["Stabilization", s.stabilization],
    ].filter((row) => row[1]);
    if (camera.length) g.push({ title: "Camera", rows: camera });

    const audioWatch = [
      ["Drivers", s.drivers],
      ["Codecs", s.codecs],
      ["Battery", s.battery],
      ["Weight", s.weight],
    ].filter((row) => row[1]);
    if (audioWatch.length) g.push({ title: "Audio/Watch", rows: audioWatch });

    return g;
  }, [p]);

  if (!p) {
    return (
      <>
        <Header />
        <main className="pd-wrap">
          <div className="pd-load">Loading…</div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="pd-wrap">
        <div className="pd-crumbs">
          <Link to="/">Home</Link>
          <span>›</span>
          <Link to={`/category/${(p.category || "all").toLowerCase()}`}>
            {p.category || "Products"}
          </Link>
          <span>›</span>
          <span className="curr">{p.name}</span>
        </div>

        <section className="pd-top">
          <aside className="pd-gal">
            <div className="pd-thumbs">
              {thumbs.map((src, i) => (
                <button
                  key={i}
                  className={`pd-t ${imgIndex === i ? "on" : ""}`}
                  onClick={() => setImgIndex(i)}
                  title={`${p.name} ${i + 1}`}
                >
                  <img
                    src={src}
                    alt={`${p.name} ${i + 1}`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      display: "block",
                    }}
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://placehold.co/200x200?text=No+Image";
                    }}
                  />
                </button>
              ))}
            </div>

            <div className="pd-stage">
              <img
                key={activeImg || "placeholder"}
                src={
                  activeImg ||
                  "https://placehold.co/800x800?text=No+Image"
                }
                alt={p.name}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                loading="eager"
                onError={onStageError}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>
          </aside>

          <section className="pd-info">
            <h1 className="pd-title">{p.name}</h1>
            <div className="pd-price">
              <strong>${p.price}</strong>
              {p.discountPrice && <span className="old">${p.discountPrice}</span>}
            </div>

            <div className="pd-label">Select color :</div>
            <div className="pd-colors">
              {(p.colors || []).slice(0, 6).map((c) => (
                <button
                  key={c}
                  className={`pd-dot ${color === c ? "on" : ""}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  title={c}
                />
              ))}
            </div>

            {!!(p.options && p.options.length) && (
              <div className="pd-options">
                {p.options.map((o) => (
                  <button
                    key={o}
                    className={`pd-op ${option === o ? "on" : ""}`}
                    onClick={() => setOption(o)}
                  >
                    {o}
                  </button>
                ))}
              </div>
            )}

            <div className="pd-specs">
              <div className="pd-spec">
                <span className="ic">
                  <svg viewBox="0 0 24 24">
                    <rect
                      x="5"
                      y="2"
                      width="14"
                      height="20"
                      rx="2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                  </svg>
                </span>
                <div>
                  <b>Screen size</b>
                  <p>{p.specs?.screen || "-"}</p>
                </div>
              </div>
              <div className="pd-spec">
                <span className="ic">
                  <svg viewBox="0 0 24 24">
                    <rect
                      x="3"
                      y="7"
                      width="18"
                      height="10"
                      rx="2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                  </svg>
                </span>
                <div>
                  <b>CPU</b>
                  <p>{p.specs?.cpu || "-"}</p>
                </div>
              </div>
              <div className="pd-spec">
                <span className="ic">
                  <svg viewBox="0 0 24 24">
                    <circle
                      cx="12"
                      cy="12"
                      r="4.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                    <rect
                      x="3"
                      y="6"
                      width="18"
                      height="12"
                      rx="2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                  </svg>
                </span>
                <div>
                  <b>Main camera</b>
                  <p>{p.specs?.camera || "-"}</p>
                </div>
              </div>
              <div className="pd-spec">
                <span className="ic">
                  <svg viewBox="0 0 24 24">
                    <rect
                      x="5"
                      y="3"
                      width="14"
                      height="18"
                      rx="2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                    <path
                      d="M9 7h6M9 12h6M9 17h6"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                  </svg>
                </span>
                <div>
                  <b>Battery capacity</b>
                  <p>{p.specs?.battery || "-"}</p>
                </div>
              </div>
            </div>

            <p className="pd-desc">{p.description || "—"}</p>

            <div className="pd-cta">
              <button className="btn light">Add to Wishlist</button>
              <button
                className="btn dark"
                onClick={() => {
                  addItem(p, 1, { color, option });
                  nav("/cart");
                }}
              >
                Add to Cart
              </button>
            </div>

            <div className="pd-assure">
              <div className="chip">
                <span className="mini-ic">
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M5 12h14M5 12l3-3m-3 3l3 3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <div>
                  <b>Free Delivery</b>
                  <p>1-2 day</p>
                </div>
              </div>
              <div className="chip">
                <span className="mini-ic">
                  <svg viewBox="0 0 24 24">
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                    <path
                      d="M12 6v6l4 2"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <div>
                  <b>In Stock</b>
                  <p>Today</p>
                </div>
              </div>
              <div className="chip">
                <span className="mini-ic">
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M12 2l8 4v6c0 5-3.5 8-8 10C7.5 20 4 17 4 12V6l8-4z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                  </svg>
                </span>
                <div>
                  <b>Guaranteed</b>
                  <p>1 year</p>
                </div>
              </div>
            </div>
          </section>
        </section>

        <section className="details-card">
          <div className="d-head">
            <h3>Details</h3>
            <p>
              Just as a book is judged by its cover, the first thing you notice
              when you pick up a modern smartphone is the display. Incredible
              photos in weak, washed bright lighting the new system with two
              cameras more…
            </p>
          </div>

          {specGroups.map((grp) => (
            <div
              className={`d-section ${moreSpecs ? "open" : "fold"}`}
              key={grp.title}
            >
              <h4>{grp.title}</h4>
              <div className="d-table">
                {grp.rows.map(([k, v]) => (
                  <div className="d-row" key={k}>
                    <span>{k}</span>
                    <b>{v}</b>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="d-actions">
            <button
              className="view-more"
              onClick={() => setMoreSpecs((s) => !s)}
            >
              {moreSpecs ? "View Less" : "View More"}
              <svg viewBox="0 0 24 24" className={moreSpecs ? "up" : ""}>
                <path
                  d="M6 9l6 6 6-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </section>

        <section className="reviews">
          <h3>Reviews</h3>

          <div className="rv-top">
            <div className="rv-score">
              <b>4.8</b>
              <span>of 125 reviews</span>
              <div className="stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} viewBox="0 0 24 24" className="fill">
                    <path d="M12 17.3l6.18 3.7-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
            </div>

            <div className="rv-bars">
              {[
                { label: "Excellent", val: 100 },
                { label: "Good", val: 11 },
                { label: "Average", val: 3 },
                { label: "Below Average", val: 8 },
                { label: "Poor", val: 1 },
              ].map((r) => (
                <div className="rv-row" key={r.label}>
                  <span>{r.label}</span>
                  <div className="bar">
                    <i style={{ width: `${r.val}%` }} />
                  </div>
                  <em>{r.val}</em>
                </div>
              ))}
            </div>
          </div>

          <div className="rv-input">
            <input type="text" placeholder="Leave Comment" />
          </div>

          <div className={`rv-list ${moreReviews ? "open" : "fold"}`}>
            {reviews.map((rv) => (
              <article className="rv" key={rv.id}>
                <img
                  className="ava"
                  src={`https://i.pravatar.cc/48?img=${rv.id + 10}`}
                  alt={rv.name}
                  loading="lazy"
                />
                <div className="r-main">
                  <div className="r-top">
                    <b>{rv.name}</b>
                    <span>{rv.date}</span>
                  </div>
                  <div className="r-stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        viewBox="0 0 24 24"
                        className={i < rv.rate ? "fill" : ""}
                      >
                        <path d="M12 17.3l6.18 3.7-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                  <p>{rv.text}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="d-actions">
            <button
              className="view-more"
              onClick={() => setMoreReviews((v) => !v)}
            >
              {moreReviews ? "View Less" : "View More"}
              <svg viewBox="0 0 24 24" className={moreReviews ? "up" : ""}>
                <path
                  d="M6 9l6 6 6-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </section>

        <section className="related">
          <h3>Related Products</h3>
          <div className="grid">
            {related.map((x) => {
              const rImgs = buildImages(x);
              const rSrc = rImgs[0] || "https://placehold.co/600x600?text=No+Image";
              return (
                <article className="card" key={x.id}>
                  <button className="wish" aria-label="Wishlist">
                    <svg viewBox="0 0 24 24">
                      <path
                        d="M12 21s-7.5-4.7-9.3-9.1A5.6 5.6 0 0 1 12 6.1a5.6 5.6 0 0 1 9.3 5.8C19.5 16.3 12 21 12 21z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <Link to={`/product/${x.id}`} className="thumb">
                    <img
                      src={rSrc}
                      alt={x.name}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        const next = rImgs[1];
                        e.currentTarget.src =
                          next || "https://placehold.co/600x600?text=No+Image";
                      }}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  </Link>
                  <div className="meta">
                    <h4 className="name" title={x.name}>
                      {x.name}
                    </h4>
                    <div className="prices">
                      <strong>${x.price}</strong>
                      {x.discountPrice && (
                        <span className="old">${x.discountPrice}</span>
                      )}
                    </div>
                    <Link className="buy" to={`/product/${x.id}`}>
                      Buy Now
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
