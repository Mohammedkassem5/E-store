import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, "orders", id))
      .then(s => setOrder(s.data() || null))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 16px" }}>
        {loading ? (
          <p>Loading…</p>
        ) : !order ? (
          <p>Order not found.</p>
        ) : (
          <>
            <h2 style={{ marginBottom: 12 }}>Order #{id}</h2>
            <p style={{ marginBottom: 6 }}>Status: <b>{order.status}</b></p>
            <p style={{ marginBottom: 6 }}>Buyer: <b>{order.user?.name || order.user?.email}</b></p>
            <h3 style={{ marginTop: 18 }}>Items</h3>
            <ul>
              {order.items?.map(it => (
                <li key={it.id}>{it.name} ×{it.qty} — ${it.price}</li>
              ))}
            </ul>
            <h3 style={{ marginTop: 18 }}>Total: ${order.amounts?.total}</h3>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
