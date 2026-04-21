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
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

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
 * - If the collection is empty (first run), seeds sample data automatically.
 * - If Firestore is unreachable or rules block the read, falls back to
 *   the built-in SAMPLE_BUNKS so the UI is never blank.
 */
export const getAllBunks = async () => {
  try {
    const snapshot = await getDocs(collection(db, BUNKS_COLLECTION));

    if (snapshot.empty) {
      console.info("Firestore petrolBunks is empty — seeding sample data…");
      try {
        await seedSampleBunks();
        // Re-fetch after seeding
        const fresh = await getDocs(collection(db, BUNKS_COLLECTION));
        return fresh.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (seedErr) {
        console.warn("Could not seed Firestore (check rules). Using local sample data.", seedErr);
        return SAMPLE_BUNKS.map((b, i) => ({ id: `local-${i}`, ...b }));
      }
    }

    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    // Permission denied or network error — show local sample data so UI works
    console.warn("Failed to load bunks from Firestore. Using local sample data.", err.message);
    return SAMPLE_BUNKS.map((b, i) => ({ id: `local-${i}`, ...b }));
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
 * Fetch only the bunks assigned to a specific manager (by their UID).
 * Falls back to all bunks if none are assigned yet (for demo/seed data).
 */
export const getBunksByManager = async (managerUid) => {
  const q = query(collection(db, BUNKS_COLLECTION), where("managerId", "==", managerUid));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    // Fallback: show all bunks (for demo data that has no managerId set yet)
    const all = await getDocs(collection(db, BUNKS_COLLECTION));
    return all.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
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


