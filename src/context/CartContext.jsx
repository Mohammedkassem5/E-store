import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { auth, db } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const CartCtx = createContext(null);
const LS_KEY = "dm_cart_v1";

const loadLS = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || { items: [] }; } catch { return { items: [] }; }
};
const saveLS = (state) => { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {} };

const reducer = (state, action) => {
  if (action.type === "INIT") return action.payload;
  if (action.type === "ADD") {
    const key = action.item.key;
    const items = [...state.items];
    const i = items.findIndex(x => x.key === key);
    if (i >= 0) items[i] = { ...items[i], qty: items[i].qty + action.item.qty };
    else items.unshift(action.item);
    return { items };
  }
  if (action.type === "UPDATE_QTY") {
    const items = state.items.map(x => x.key === action.key ? { ...x, qty: action.qty } : x).filter(x => x.qty > 0);
    return { items };
  }
  if (action.type === "REMOVE") {
    const items = state.items.filter(x => x.key !== action.key);
    return { items };
  }
  if (action.type === "CLEAR") return { items: [] };
  return state;
};

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadLS);

  useEffect(() => { saveLS(state); }, [state]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user || !db) return;
      const ref = doc(db, "carts", user.uid);
      const snap = await getDoc(ref);
      const remote = snap.exists() ? snap.data() : { items: [] };
      const local = loadLS();
      const merged = mergeCarts(local, remote);
      dispatch({ type: "INIT", payload: merged });
      await setDoc(ref, merged, { merge: true });
    });
    return () => unsub && unsub();
  }, []);

  useEffect(() => {
    const user = auth?.currentUser;
    if (!user || !db) return;
    const ref = doc(db, "carts", user.uid);
    setDoc(ref, state, { merge: true }).catch(() => {});
  }, [state]);

  const addItem = (prod, qty = 1, meta = {}) => {
    const item = {
      key: `${prod.id}|${meta.color || ""}|${meta.option || ""}`,
      id: prod.id,
      name: prod.name,
      price: Number(prod.price) || 0,
      image: prod.image || (prod.gallery?.[0] ?? ""),
      qty,
      color: meta.color || "",
      option: meta.option || "",
      category: prod.category || ""
    };
    dispatch({ type: "ADD", item });
  };

  const updateQty = (key, qty) => dispatch({ type: "UPDATE_QTY", key, qty: Math.max(0, qty|0) });
  const removeItem = (key) => dispatch({ type: "REMOVE", key });
  const clear = () => dispatch({ type: "CLEAR" });

  const totalQty = useMemo(() => state.items.reduce((s, i) => s + i.qty, 0), [state.items]);
  const totalPrice = useMemo(() => state.items.reduce((s, i) => s + i.qty * i.price, 0), [state.items]);

  const value = { ...state, addItem, updateQty, removeItem, clear, totalQty, totalPrice };
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export const useCart = () => useContext(CartCtx);

function mergeCarts(a, b) {
  const map = new Map();
  [...(a.items || []), ...(b.items || [])].forEach((it) => {
    const prev = map.get(it.key);
    if (prev) map.set(it.key, { ...prev, qty: prev.qty + it.qty });
    else map.set(it.key, it);
  });
  return { items: [...map.values()] };
}
