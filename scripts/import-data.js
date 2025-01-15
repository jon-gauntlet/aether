import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

// Initialize Firebase Admin with service account
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({
  credential: cert(serviceAccount),
  projectId: 'aether-chat-d42d1'
});

const db = getFirestore();

async function importData() {
  try {
    const data = JSON.parse(readFileSync(join(__dirname, '../src/rag_aether/data/mock/seed.json')));
    
    // Create a batch
    const batch = db.batch();
    
    // Process collections
    const collections = data.__collections__;
    for (const [collectionName, documents] of Object.entries(collections)) {
      console.log(`Processing collection: ${collectionName}`);
      for (const [docId, docData] of Object.entries(documents)) {
        const docRef = db.collection(collectionName).doc(docId);
        batch.set(docRef, docData);
      }
    }
    
    // Commit the batch
    await batch.commit();
    console.log('Data imported successfully');
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
}

importData(); 