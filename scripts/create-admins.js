const admin = require("firebase-admin");

// Initialize Admin SDK
const serviceAccount = require("../serviceAccountKey.json"); // adjust path
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

// List of all 38 districts (exact spelling as in your provider signup)
const districts = [
  "Ariyalur",
  "Chengalpattu",
  "Chennai",
  "Coimbatore",
  "Cuddalore",
  "Dharmapuri",
  "Dindigul",
  "Erode",
  "Kallakurichi",
  "Kanchipuram",
  "Kanyakumari",
  "Karur",
  "Krishnagiri",
  "Madurai",
  "Mayiladuthurai",
  "Nagapattinam",
  "Namakkal",
  "Nilgiris",
  "Perambalur",
  "Pudukkottai",
  "Ramanathapuram",
  "Ranipet",
  "Salem",
  "Sivaganga",
  "Tenkasi",
  "Thanjavur",
  "Theni",
  "Thoothukudi",
  "Tiruchirappalli",
  "Tirunelveli",
  "Tirupathur",
  "Tiruppur",
  "Tiruvallur",
  "Tiruvannamalai",
  "Tiruvarur",
  "Vellore",
  "Viluppuram",
  "Virudhunagar",
];

async function createDistrictAdmins() {
  for (const district of districts) {
    const email = `${district.toLowerCase()}_admin@gmail.com`;
    const password = `${district}_QS18@`; // e.g., Thoothukudi_QS18@
    const name = `${district} Admin`;

    try {
      // 1. Create user in Firebase Authentication
      const userRecord = await auth.createUser({
        email: email,
        emailVerified: true,
        password: password,
        displayName: name,
      });
      console.log(`✅ Auth user created: ${email} (UID: ${userRecord.uid})`);

      // 2. Create Firestore document in 'admins' collection
      const adminDoc = {
        uid: userRecord.uid,
        email: email,
        name: name,
        district: district,
        role: "district-admin",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await db.collection("admins").doc(userRecord.uid).set(adminDoc);
      console.log(`📄 Firestore doc created for ${district}`);
    } catch (error) {
      console.error(`❌ Failed for ${district}:`, error.message);
    }
  }
  console.log("🎉 All district admins created!");
}

createDistrictAdmins();
