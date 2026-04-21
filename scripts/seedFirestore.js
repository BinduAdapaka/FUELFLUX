/**
 * One-time seed script to populate Firestore with sample petrol bunk data.
 * 
 * USAGE:
 *   1. Install firebase-admin: npm install firebase-admin --save-dev
 *   2. Download your Firebase service account JSON from:
 *      Firebase Console → Project Settings → Service Accounts → Generate new private key
 *   3. Save it as scripts/serviceAccount.json
 *   4. Run: node scripts/seedFirestore.js
 * 
 * ⚠️  Run only ONCE — it adds 5 bunks + 2 vehicles to Firestore.
 */

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const bunks = [
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
    name: "Shell - Kondapur",
    location: { lat: 17.4604, lng: 78.3648 },
    petrolStock: 75,
    dieselStock: 200,
    pricePetrol: 103.2,
    priceDiesel: 90.1,
  },
];

const vehicles = [
  {
    driverName: "Ravi Kumar",
    status: "Available",
    assignedOrderId: null,
    currentLocation: { lat: 17.4126, lng: 78.4475 },
  },
  {
    driverName: "Suresh Reddy",
    status: "Available",
    assignedOrderId: null,
    currentLocation: { lat: 17.44, lng: 78.3489 },
  },
];

async function seed() {
  console.log("🌱 Seeding Firestore...");

  for (const bunk of bunks) {
    const ref = await db.collection("petrolBunks").add(bunk);
    console.log(`✅ Added bunk: ${bunk.name} (${ref.id})`);
  }

  for (const vehicle of vehicles) {
    const ref = await db.collection("vehicles").add(vehicle);
    console.log(`✅ Added vehicle: ${vehicle.driverName} (${ref.id})`);
  }

  console.log("\n🎉 Seed complete! 5 bunks + 2 vehicles added.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
