import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURAZIONE ---
const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT || './serviceAccountKey.json';
const BATCH_SIZE = 500;
const TARGET_COLLECTIONS = ['payments', 'logs'];

// --- INIZIALIZZAZIONE ---
async function initFirebase() {
  try {
    const serviceAccountPath = path.resolve(process.cwd(), SERVICE_ACCOUNT_PATH);
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(`Service account key non trovata in: ${serviceAccountPath}`);
    }
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    // Check if already initialized to avoid error
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    console.log('✅ Firebase Admin inizializzato.');
    return admin.firestore();
  } catch (error) {
    console.error('❌ Errore inizializzazione Firebase:', error.message);
    process.exit(1);
  }
}

// --- HELPER FUNCTIONS ---

async function countDocuments(db, collectionName) {
  // Nota: count() aggregation è efficiente in Firestore
  const coll = db.collection(collectionName);
  const snapshot = await coll.count().get();
  return snapshot.data().count;
}

async function deleteCollection(db, collectionName) {
  const collectionRef = db.collection(collectionName);
  const query = collectionRef.orderBy('__name__').limit(BATCH_SIZE);
  let totalDeleted = 0;

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve)
      .catch(reject);
  });

  async function deleteQueryBatch(db, query, resolve) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
      // Quando non ci sono più documenti
      resolve(totalDeleted);
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    totalDeleted += batchSize;
    process.stdout.write(`\r🗑️  ${collectionName}: cancellati ${totalDeleted} documenti...`);

    // Recurse on the next process tick, to avoid
    // exploding the stack.
    process.nextTick(() => {
      deleteQueryBatch(db, query, resolve);
    });
  }
}

async function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// --- MAIN ---

async function main() {
  console.log('🧹 START Clean Runtime Data Script');
  console.log('-----------------------------------');
  
  const db = await initFirebase();
  
  // 1. Analisi e Conteggio
  console.log('\n📊 Analisi collezioni target...');
  const counts = {};
  
  for (const col of TARGET_COLLECTIONS) {
    process.stdout.write(`   Counting ${col}... `);
    counts[col] = await countDocuments(db, col);
    console.log(`${counts[col]} docs`);
  }
  
  const totalDocs = Object.values(counts).reduce((a, b) => a + b, 0);
  
  if (totalDocs === 0) {
    console.log('\n✅ Le collezioni target sono già vuote. Nessuna azione necessaria.');
    process.exit(0);
  }
  
  // 2. Richiesta Conferma
  console.log('\n⚠️  ATTENZIONE: Stai per ELIMINARE PER SEMPRE i dati nelle seguenti collezioni:');
  TARGET_COLLECTIONS.forEach(col => console.log(`   - ${col} (${counts[col]} documenti)`));
  console.log('   Le altre collezioni (users, courses, etc.) NON verranno toccate.');
  
  const answer = await askConfirmation('\nScrivi "DELETE" per confermare e procedere: ');
  
  if (answer !== 'DELETE') {
    console.log('❌ Operazione annullata dall\'utente.');
    process.exit(0);
  }
  
  // 3. Esecuzione Cancellazione
  console.log('\n🚀 Avvio cancellazione...\n');
  
  for (const col of TARGET_COLLECTIONS) {
    if (counts[col] > 0) {
      console.log(`\nInizio pulizia: ${col}`);
      const deleted = await deleteCollection(db, col);
      console.log(`\n✅ ${col}: Completato. Totale rimossi: ${deleted}`);
    } else {
      console.log(`\n⏭️  ${col}: Già vuota, skip.`);
    }
  }
  
  console.log('\n-----------------------------------');
  console.log('✨ Pulizia completata con successo.');
}

main().catch(console.error);
