import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  increment,
  addDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

/**
 * Register a brand-new petrol bunk for a manager.
 * The bunk will appear immediately on the nearby-bunks map for all users.
 */
export const registerBunk = async (managerId, {
  name, address, phone, openTime, closeTime,
  lat, lng,
  petrolStock, dieselStock, pricePetrol, priceDiesel,
}) => {
  const ref = await addDoc(collection(db, "petrolBunks"), {
    managerId,
    name:        name.trim(),
    address:     address?.trim()   ?? "",
    phone:       phone?.trim()     ?? "",
    openTime:    openTime          ?? "06:00",
    closeTime:   closeTime         ?? "22:00",
    location:    { lat: Number(lat), lng: Number(lng) },
    petrolStock: Number(petrolStock) || 500,
    dieselStock: Number(dieselStock) || 500,
    pricePetrol: Number(pricePetrol) || 102.0,
    priceDiesel: Number(priceDiesel) || 89.0,
    createdAt:   serverTimestamp(),
  });
  return ref.id;
};

const BUNKS_COLLECTION = "petrolBunks";

// Sample bunk data centred around Hyderabad — seeded automatically if Firestore is empty
const SAMPLE_BUNKS = [
  {
    name: "HP Petrol Bunk - Banjara Hills",
    location: { lat: 17.4126, lng: 78.4475 },
    petrolStock: 850,
    dieselStock: 1200,
    pricePetrol: 102.45,
    priceDiesel: 89.3,
  },
  {
    name: "Indian Oil - Jubilee Hills",
    location: { lat: 17.4314, lng: 78.4078 },
    petrolStock: 600,
    dieselStock: 900,
    pricePetrol: 101.9,
    priceDiesel: 88.75,
  },
  {
    name: "BPCL Fuel Station - Madhapur",
    location: { lat: 17.4486, lng: 78.3908 },
    petrolStock: 320,
    dieselStock: 480,
    pricePetrol: 102.1,
    priceDiesel: 89.0,
  },
  {
    name: "Reliance Petro - Gachibowli",
    location: { lat: 17.44, lng: 78.3489 },
    petrolStock: 1100,
    dieselStock: 750,
    pricePetrol: 101.75,
    priceDiesel: 88.5,
  },
  {
    name: "Shell Fuel Station - Kondapur",
    location: { lat: 17.4604, lng: 78.3648 },
    petrolStock: 75,
    dieselStock: 200,
    pricePetrol: 103.2,
    priceDiesel: 90.1,
  },
];

/**
 * Fetch all petrol bunks from Firestore.
 * Only returns bunks that were registered by a manager (have a managerId).
 * Old seed/sample data without a managerId is excluded.
 */
export const getAllBunks = async () => {
  try {
    const snapshot = await getDocs(collection(db, BUNKS_COLLECTION));
    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((b) => !!b.managerId); // only real manager-registered bunks
  } catch (err) {
    console.warn("Failed to load bunks from Firestore:", err.message);
    return [];
  }
};

export const seedSampleBunks = async () => {
  for (const bunk of SAMPLE_BUNKS) {
    await addDoc(collection(db, BUNKS_COLLECTION), bunk);
  }
};

export const getBunkById = async (bunkId) => {
  const ref = doc(db, BUNKS_COLLECTION, bunkId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Bunk not found");
  return { id: snap.id, ...snap.data() };
};

export const updateBunkStock = async (bunkId, fuelType, quantityUsed) => {
  const ref = doc(db, BUNKS_COLLECTION, bunkId);
  const field = fuelType === "Petrol" ? "petrolStock" : "dieselStock";
  await updateDoc(ref, { [field]: increment(-quantityUsed) });
};

/**
 * Update a bunk's inventory (stock quantities and prices) directly.
 * Used by the admin inventory panel.
 */
export const updateBunkInventory = async (bunkId, { petrolStock, dieselStock, pricePetrol, priceDiesel }) => {
  const ref = doc(db, BUNKS_COLLECTION, bunkId);
  await updateDoc(ref, {
    petrolStock: Number(petrolStock),
    dieselStock: Number(dieselStock),
    pricePetrol: Number(pricePetrol),
    priceDiesel: Number(priceDiesel),
  });
};

/**
 * Fetch all bunks directly from Firestore (no local fallback).
 * Used by admin pages that need the real data.
 */
export const getAllBunksAdmin = async () => {
  const snapshot = await getDocs(collection(db, BUNKS_COLLECTION));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Fetch only the bunks registered by a specific manager (by their UID).
 * Returns an empty array if this manager has not added any stations yet.
 */
export const getBunksByManager = async (managerUid) => {
  const q = query(
    collection(db, BUNKS_COLLECTION),
    where("managerId", "==", managerUid)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Update a bunk's station info (name, address, phone, opening hours).
 * Used by Station Info page for managers.
 */
export const updateBunkInfo = async (bunkId, { name, address, phone, openTime, closeTime }) => {
  const ref = doc(db, BUNKS_COLLECTION, bunkId);
  await updateDoc(ref, {
    name,
    address:   address   ?? "",
    phone:     phone     ?? "",
    openTime:  openTime  ?? "",
    closeTime: closeTime ?? "",
  });
};


