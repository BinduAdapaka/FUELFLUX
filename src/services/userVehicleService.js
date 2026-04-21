import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const COLLECTION = "userVehicles";

export const getUserVehicles = async (userId) => {
  const q = query(collection(db, COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const addUserVehicle = async (userId, vehicleData) => {
  const ref = await addDoc(collection(db, COLLECTION), {
    userId,
    ...vehicleData,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
};

export const deleteUserVehicle = async (vehicleId) => {
  await deleteDoc(doc(db, COLLECTION, vehicleId));
};
