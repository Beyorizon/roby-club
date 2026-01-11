import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT || "../serviceAccountKey.json";

// --- VALIDAZIONE ---
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("❌ Specifica un'email o UID come argomento.");
  console.error("Esempio: node scripts/set-admin-claim.mjs admin@example.com");
  process.exit(1);
}

const TARGET_USER = args[0];

async function main() {
  const serviceAccountPath = path.resolve(__dirname, SERVICE_ACCOUNT_PATH);
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.error(`❌ Service account non trovato in: ${serviceAccountPath}`);
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  console.log(`🔍 Ricerca utente: ${TARGET_USER}...`);
  
  let user;
  try {
    if (TARGET_USER.includes('@')) {
      user = await admin.auth().getUserByEmail(TARGET_USER);
    } else {
      user = await admin.auth().getUser(TARGET_USER);
    }
  } catch (error) {
    console.error("❌ Utente non trovato:", error.message);
    process.exit(1);
  }

  console.log("✅ Utente trovato:", { uid: user.uid, email: user.email });
  console.log("⚙️  Impostazione claim admin...");

  await admin.auth().setCustomUserClaims(user.uid, { admin: true });
  
  const updated = await admin.auth().getUser(user.uid);
  console.log("✅ SUCCESSO! Custom claims attuali:", updated.customClaims);
  console.log("ℹ️  L'utente deve fare logout/login per aggiornare i permessi.");
}

main().catch((e) => {
  console.error("❌ Errore imprevisto:", e);
  process.exit(1);
});
