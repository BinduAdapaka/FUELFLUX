import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const ORDERS_COLLECTION = "orders";

export const createOrder = async (orderData) => {
  const ref = await addDoc(collection(db, ORDERS_COLLECTION), {
    ...orderData,
    status: "Pending",
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getUserOrders = async (userId) => {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);
  const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  // Sort client-side to avoid requiring a Firestore composite index
  return orders.sort((a, b) => {
    const aTime = a.createdAt?.seconds ?? 0;
    const bTime = b.createdAt?.seconds ?? 0;
    return bTime - aTime;
  });
};

export const updateOrderStatus = async (orderId, status) => {
  const ref = doc(db, ORDERS_COLLECTION, orderId);
  await updateDoc(ref, { status });
};

export const subscribeToOrder = (orderId, callback) => {
  const ref = doc(db, ORDERS_COLLECTION, orderId);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
};

export const getAllOrders = async () => {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};
