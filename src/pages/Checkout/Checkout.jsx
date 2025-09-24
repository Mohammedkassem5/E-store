import "./Checkout.css";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { useCart } from "../../context/CartContext";
import { auth, db } from "../../services/firebase";
import { addDoc, collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";


const LS_ADDR = "dm_addresses_v1";

const defaults = [
  { id: "a1", label: "2118 Thornridge", tag: "HOME", address: "2118 Thornridge Cir, Syracuse, Connecticut 35624", phone: "(209) 555-0104" },
  { id: "a2", label: "Headoffice", tag: "OFFICE", address: "2715 Ash Dr. San Jose, South Dakota 83475", phone: "(704) 555-0127" }
];

export default function Checkout() {
  const nav = useNavigate();
  const { items, totalPrice, totalQty, clear } = useCart();

  const [step, setStep] = useState(0);
  const [addresses, setAddresses] = useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem(LS_ADDR));
      return Array.isArray(v) && v.length ? v : defaults;
    } catch {
      return defaults;
    }
  });
  const [selectedAddr, setSelectedAddr] = useState(() => defaults[0]?.id ?? "");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ label: "", tag: "HOME", address: "", phone: "" });

  const [ship, setShip] = useState("standard");
  const shippingCost = ship === "express" ? 49 : ship === "pickup" ? 0 : 29;
  const tax = Math.max(0, Math.round(totalPrice * 0.021));
  const total = totalPrice + tax + shippingCost;

  const [payTab, setPayTab] = useState("card");
  const [cardName, setCardName] = useState("");
  const [cardNum, setCardNum] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [sameBill, setSameBill] = useState(true);

  useEffect(() => {
    localStorage.setItem(LS_ADDR, JSON.stringify(addresses));
  }, [addresses]);

  useEffect(() => {
    if (!selectedAddr && addresses[0]) setSelectedAddr(addresses[0].id);
  }, [addresses, selectedAddr]);

  const startAdd = () => { setEditing("new"); setForm({ label: "", tag: "HOME", address: "", phone: "" }); };
  const startEdit = (a) => { setEditing(a.id); setForm({ label: a.label, tag: a.tag, address: a.address, phone: a.phone }); };
  const cancelEdit = () => { setEditing(null); setForm({ label: "", tag: "HOME", address: "", phone: "" }); };
  const saveAddr = () => {
    if (!form.label.trim() || !form.address.trim()) return;
    if (editing === "new") {
      const id = "a" + Math.random().toString(36).slice(2, 8);
      const arr = [{ id, ...form }, ...addresses];
      setAddresses(arr);
      setSelectedAddr(id);
    } else {
      const arr = addresses.map((x) => (x.id === editing ? { ...x, ...form } : x));
      setAddresses(arr);
    }
    cancelEdit();
  };
  const removeAddr = (id) => {
    const arr = addresses.filter((x) => x.id !== id);
    setAddresses(arr);
    if (selectedAddr === id && arr[0]) setSelectedAddr(arr[0].id);
  };

  const selectedAddress = useMemo(() => addresses.find(a => a.id === selectedAddr), [addresses, selectedAddr]);

  const summary = useMemo(
    () => ({ items: totalQty, sub: totalPrice, tax, ship: shippingCost, total }),
    [totalQty, totalPrice, tax, shippingCost, total]
  );
const placeOrder = async () => {
  if (!items.length) return;

  const user = auth?.currentUser;
  if (!user) {
    toast.error("Please log in to place the order");
    nav("/login", { state: { from: "/checkout" } });
    return;
  }

  try {
    const safeItems = items.map(it => ({
      id: it.id ?? it.key,
      name: it.name,
      price: Number(it.price),
      qty: Number(it.qty),
      image: it.image || "",
    }));

    const payload = {
      user: {
        uid: user.uid,
        email: user.email || "",
        name: user.displayName || "",
      },
      items: safeItems,
      amounts: {
        subtotal: Number(totalPrice),
        tax: Math.max(0, Math.round(totalPrice * 0.021)),
        shipping: ship === "express" ? 49 : ship === "pickup" ? 0 : 29,
        total: Number(totalPrice + (Math.max(0, Math.round(totalPrice * 0.021))) + (ship === "express" ? 49 : ship === "pickup" ? 0 : 29)),
        currency: "USD",
      },
      address: selectedAddress || null,
      shippingMethod: ship,
      payment: {
        method: payTab,                 
        last4: (cardNum.replace(/\D/g, "").slice(-4)) || null,
        exp: cardExp || null,
        brand: payTab === "card" ? "card" : "paypal",
      },
      status: "pending",
      createdAt: serverTimestamp(),
    };

    const ordersCol = collection(db, "orders");
    const orderRef = await addDoc(ordersCol, payload);

    const userOrderRef = doc(db, "users", user.uid, "orders", orderRef.id);
    await setDoc(userOrderRef, { orderRef: orderRef.path, ...payload });

    clear();
    toast.success("Order placed successfully");
    nav(`/orders/${orderRef.id}`); 
  } catch (e) {
    console.error(e);
    toast.error("Failed to place order");
  }
};


  const formatCardNum = (v) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ").trim();

  return (
    <>
      <Header />
      <main className="co-wrap">
        <div className="steps">
          <div className={`st ${step === 0 ? "on" : step > 0 ? "done" : ""}`}>
            <span className="dot">1</span><div className="txt"><b>Step 1</b><span>Address</span></div>
          </div>
          <div className={`st ${step === 1 ? "on" : step > 1 ? "done" : ""}`}>
            <span className="dot">2</span><div className="txt"><b>Step 2</b><span>Shipping</span></div>
          </div>
          <div className={`st ${step === 2 ? "on" : ""}`}>
            <span className="dot">3</span><div className="txt"><b>Step 3</b><span>Payment</span></div>
          </div>
        </div>

        {step !== 2 ? (
          <section className="co-grid">
            <div className="co-left">
              {step === 0 && (
                <>
                  <h3 className="sec-title">Select Address</h3>

                  {editing && (
                    <div className="addr-editor">
                      <div className="row">
                        <label>Title</label>
                        <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
                        <select value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })}>
                          <option>HOME</option><option>OFFICE</option><option>OTHER</option>
                        </select>
                      </div>
                      <div className="row"><label>Address</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                      <div className="row"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                      <div className="actions">
                        <button className="btn light" onClick={cancelEdit}>Cancel</button>
                        <button className="btn dark" onClick={saveAddr}>Save</button>
                      </div>
                    </div>
                  )}

                  <div className="addr-list">
                    {addresses.map((a) => (
                      <label key={a.id} className={`addr ${selectedAddr === a.id ? "sel" : ""}`}>
                        <input type="radio" name="addr" checked={selectedAddr === a.id} onChange={() => setSelectedAddr(a.id)} />
                        <div className="ad-body">
                          <div className="ad-top">
                            <div className="ad-title"><b>{a.label}</b><span className={`tag ${a.tag.toLowerCase()}`}>{a.tag}</span></div>
                            <div className="ad-tools">
                              <button onClick={(e) => { e.preventDefault(); startEdit(a); }}>✎</button>
                              <button onClick={(e) => { e.preventDefault(); removeAddr(a.id); }}>✕</button>
                            </div>
                          </div>
                          <div className="ad-sub">{a.address}</div>
                          <div className="ad-sub">{a.phone}</div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {!editing && (
                    <div className="addr-add">
                      <button className="add-btn" onClick={startAdd}><span>+</span><b>Add New Address</b></button>
                    </div>
                  )}

                  <div className="navs">
                    <Link to="/cart" className="btn light">Back</Link>
                    <button className="btn dark" onClick={() => setStep(1)} disabled={!selectedAddr}>Next</button>
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <h3 className="sec-title">Shipping Method</h3>
                  <div className="ship-list">
                    <label className={`ship ${ship === "standard" ? "sel" : ""}`}>
                      <input type="radio" name="ship" checked={ship === "standard"} onChange={() => setShip("standard")} />
                      <div className="sp-body"><div className="sp-title"><b>Standard</b><span>3–5 business days</span></div><b className="sp-cost">$29</b></div>
                    </label>
                    <label className={`ship ${ship === "express" ? "sel" : ""}`}>
                      <input type="radio" name="ship" checked={ship === "express"} onChange={() => setShip("express")} />
                      <div className="sp-body"><div className="sp-title"><b>Express</b><span>1–2 business days</span></div><b className="sp-cost">$49</b></div>
                    </label>
                    <label className={`ship ${ship === "pickup" ? "sel" : ""}`}>
                      <input type="radio" name="ship" checked={ship === "pickup"} onChange={() => setShip("pickup")} />
                      <div className="sp-body"><div className="sp-title"><b>Store Pickup</b><span>Ready today</span></div><b className="sp-cost">$0</b></div>
                    </label>
                  </div>

                  <div className="navs">
                    <button className="btn light" onClick={() => setStep(0)}>Back</button>
                    <button className="btn dark" onClick={() => setStep(2)}>Next</button>
                  </div>
                </>
              )}
            </div>

            <aside className="co-right">
              <h3>Order Summary</h3>
              <div className="sum">
                <div className="row"><span>Items</span><b>{summary.items}</b></div>
                <div className="row"><span>Subtotal</span><b>${summary.sub.toFixed(0)}</b></div>
                <div className="row"><span>Estimated Tax</span><b>${summary.tax.toFixed(0)}</b></div>
                <div className="row"><span>Shipping</span><b>${summary.ship.toFixed(0)}</b></div>
                <div className="row tot"><span>Total</span><b>${summary.total.toFixed(0)}</b></div>
              </div>
              <div className="mini">
                {items.slice(0, 4).map((it) => (
                  <div className="mi" key={it.key}>
                    <img src={it.image} alt={it.name} />
                    <div className="mi-txt"><b>{it.name}</b><span>x{it.qty}</span></div>
                    <b>${(it.price * it.qty).toFixed(0)}</b>
                  </div>
                ))}
                {items.length > 4 && <span className="more">+{items.length - 4} more</span>}
              </div>
            </aside>
          </section>
        ) : (
          <section className="co-2col">
            <aside className="pay-sum">
              <h3>Summary</h3>

              <div className="pay-sum-list">
                {items.map((it) => (
                  <div className="ps-item" key={it.key}>
                    <img src={it.image} alt={it.name} />
                    <div className="ps-txt">
                      <div className="ps-name">{it.name}</div>
                      <div className="ps-qty">x{it.qty}</div>
                    </div>
                    <div className="ps-price">${(it.price * it.qty).toFixed(0)}</div>
                  </div>
                ))}
              </div>

              <div className="ps-block">
                <div className="ps-title">Address</div>
                <div className="ps-sub">{selectedAddress?.address}</div>
              </div>

              <div className="ps-block">
                <div className="ps-title">Shipment method</div>
                <div className="ps-sub">{ship === "pickup" ? "Free" : ship === "express" ? "Express" : "Standard"}</div>
              </div>

              <div className="ps-totals">
                <div className="row"><span>Subtotal</span><b>${summary.sub.toFixed(0)}</b></div>
                <div className="row"><span>Estimated Tax</span><b>${summary.tax.toFixed(0)}</b></div>
                <div className="row"><span>Estimated shipping & Handling</span><b>${summary.ship.toFixed(0)}</b></div>
                <div className="row tot"><span>Total</span><b>${summary.total.toFixed(0)}</b></div>
              </div>
            </aside>

            <div className="pay-area">
              <h3>Payment</h3>

              <div className="tabs">
                <button className={`tab ${payTab === "card" ? "on" : ""}`} onClick={() => setPayTab("card")}>Credit Card</button>
                <button className={`tab ${payTab === "paypal" ? "on" : ""}`} onClick={() => setPayTab("paypal")}>PayPal</button>
                <button className={`tab ${payTab === "ppc" ? "on" : ""}`} onClick={() => setPayTab("ppc")}>PayPal Credit</button>
              </div>

              {payTab === "card" && (
                <>
                  <div className="ccard">
                    <div className="cc-chip"></div>
                    <div className="cc-num">{formatCardNum(cardNum) || "#### #### #### ####"}</div>
                    <div className="cc-footer">
                      <span className="cc-name">{cardName || "Cardholder"}</span>
                      <span className="cc-exp">{cardExp || "MM/YY"}</span>
                      <div className="cc-brand">
                        <span className="mc mc1"></span>
                        <span className="mc mc2"></span>
                      </div>
                    </div>
                  </div>

                  <label className="ctrl">
                    <span>Cardholder Name</span>
                    <input placeholder="Cardholder Name" value={cardName} onChange={(e) => setCardName(e.target.value)} />
                  </label>
                  <label className="ctrl">
                    <span>Card Number</span>
                    <input placeholder="1234 5678 9012 3456" value={formatCardNum(cardNum)} onChange={(e) => setCardNum(e.target.value)} />
                  </label>
                  <div className="two">
                    <label className="ctrl">
                      <span>Exp.Date</span>
                      <input placeholder="MM/YY" value={cardExp} onChange={(e) => setCardExp(e.target.value.replace(/[^0-9/]/g,"").slice(0,5))} />
                    </label>
                    <label className="ctrl">
                      <span>CVV</span>
                      <input placeholder="***" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g,"").slice(0,4))} />
                    </label>
                  </div>

                  <label className="check">
                    <input type="checkbox" checked={sameBill} onChange={(e) => setSameBill(e.target.checked)} />
                    <span>Same as billing address</span>
                  </label>
                </>
              )}

              {payTab === "paypal" && <div className="pp-box">You'll be redirected to PayPal to complete your purchase.</div>}
              {payTab === "ppc" && <div className="pp-box">Pay over time with PayPal Credit. You'll be redirected to PayPal.</div>}

              <div className="pay-actions">
                <button className="btn light" onClick={() => setStep(1)}>Back</button>
                <button className="btn dark" onClick={placeOrder}>Pay</button>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
