import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const VEHICLES_COLLECTION = "vehicles";

export const getAllVehicles = async () => {
  const snapshot = await getDocs(collection(db, VEHICLES_COLLECTION));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getAvailableVehicles = async () => {
  const q = query(
    collection(db, VEHICLES_COLLECTION),
    where("status", "==", "Available")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const assignVehicle = async (vehicleId, orderId) => {
  const ref = doc(db, VEHICLES_COLLECTION, vehicleId);
  await updateDoc(ref, { status: "Busy", assignedOrderId: orderId });
};

export const updateVehicleLocation = async (vehicleId, lat, lng) => {
  const ref = doc(db, VEHICLES_COLLECTION, vehicleId);
  await updateDoc(ref, { currentLocation: { lat, lng } });
};

export const freeVehicle = async (vehicleId) => {
  const ref = doc(db, VEHICLES_COLLECTION, vehicleId);
  await updateDoc(ref, { status: "Available", assignedOrderId: null });
};

export const addVehicle = async (vehicleData) => {
  const ref = await addDoc(collection(db, VEHICLES_COLLECTION), {
    ...vehicleData,
    status: "Available",
    assignedOrderId: null,
    currentLocation: { lat: 17.385, lng: 78.4867 },
  });
  return ref.id;
};

export const subscribeToVehicle = (vehicleId, callback) => {
  const ref = doc(db, VEHICLES_COLLECTION, vehicleId);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
};
