import "./Cart.css";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { useCart } from "../../context/CartContext";
import { auth } from "../../services/firebase";
import { toast } from "react-toastify";

export default function Cart() {
  const nav = useNavigate();
  const { items, updateQty, removeItem, clear, totalPrice } = useCart();

  const [code, setCode] = useState("");
  const [bonus, setBonus] = useState("");

  const calc = useMemo(() => {
    const sub = totalPrice;
    const tax = Math.max(0, Math.round(sub * 0.021));
    const shipping = sub > 0 ? 29 : 0;
    const total = sub + tax + shipping;
    return { sub, tax, shipping, total };
  }, [totalPrice]);

  const goCheckout = () => {
    if (!items.length) return;
    const user = auth?.currentUser;
    if (!user) {
      toast.error("Please log in to continue");
      setTimeout(() => nav("/login"), 900);
      return;
    }
    nav("/checkout");
  };

  return (
    <>
      <Header />
      <main className="sc-wrap">
        <div className="sc-grid">
          <section className="sc-left">
            <h2>Shopping Cart</h2>

            {items.length === 0 ? (
              <div className="sc-empty">
                <p>Your cart is empty.</p>
                <Link to="/category/all" className="btn dark">Start Shopping</Link>
              </div>
            ) : (
              <div className="sc-list">
                {items.map((it) => (
                  <article className="sc-row" key={it.key}>
                    <img className="sc-img" src={it.image} alt={it.name} />
                    <div className="sc-info">
                      <h4 className="sc-name">{it.name}</h4>
                      <div className="sc-sku">#{String(it.key).slice(-12)}</div>
                    </div>

                    <div className="sc-qty">
                      <button onClick={() => updateQty(it.key, it.qty - 1)}>-</button>
                      <input
                        type="number"
                        min={1}
                        value={it.qty}
                        onChange={(e) => updateQty(it.key, Number(e.target.value))}
                      />
                      <button onClick={() => updateQty(it.key, it.qty + 1)}>+</button>
                    </div>

                    <div className="sc-price">${(it.price * it.qty).toFixed(0)}</div>
                    <button className="sc-remove" onClick={() => removeItem(it.key)}>×</button>
                  </article>
                ))}

                <div className="sc-actions">
                  <Link to="/category/all" className="btn light">Continue Shopping</Link>
                  <button className="btn light" onClick={clear}>Clear Cart</button>
                </div>
              </div>
            )}
          </section>

          <aside className="sc-right">
            <h3>Order Summary</h3>

            <label className="sc-control">
              <span>Discount code / Promo code</span>
              <input
                type="text"
                placeholder="Code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>

            <label className="sc-control">
              <span>Your bonus card number</span>
              <div className="sc-bonus">
                <input
                  type="text"
                  placeholder="Enter Card Number"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                />
                <button className="btn apply">Apply</button>
              </div>
            </label>

            <div className="sc-lines">
              <div className="sc-line"><span>Subtotal</span><b>${calc.sub.toFixed(0)}</b></div>
              <div className="sc-line"><span>Estimated Tax</span><b>${calc.tax.toFixed(0)}</b></div>
              <div className="sc-line"><span>Estimated shipping & Handling</span><b>${calc.shipping.toFixed(0)}</b></div>
              <div className="sc-line total"><span>Total</span><b>${calc.total.toFixed(0)}</b></div>
            </div>

            <button className="btn dark w" onClick={goCheckout} disabled={!items.length}>
              Checkout
            </button>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
