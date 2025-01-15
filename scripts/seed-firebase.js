import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { mockUsers } from '../src/rag_aether/data/mock/users.js';
import { mockConversations } from '../src/rag_aether/data/mock/conversations.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const serviceAccount = {
  type: 'service_account',
  project_id: process.env.VITE_FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
};

const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore(app);

function cleanForFirestore(obj) {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(cleanForFirestore);
  }
  
  if (obj instanceof Date) {
    return Timestamp.fromDate(obj);
  }
  
  if (typeof obj === 'object') {
    const clean = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        clean[key] = cleanForFirestore(value);
      }
    }
    return clean;
  }
  
  return obj;
}

async function seedUsers() {
  console.log('Seeding users...');
  for (const [userId, userData] of Object.entries(mockUsers)) {
    const cleanData = cleanForFirestore(userData);
    await db.collection('users').doc(userId).set(cleanData);
  }
  console.log('Users seeded successfully');
}

async function seedConversations() {
  console.log('Seeding conversations...');
  for (const conv of mockConversations) {
    const cleanConv = {
      ...conv,
      created_at: Timestamp.fromDate(new Date(conv.created_at)),
      messages: conv.messages.map(msg => ({
        ...msg,
        timestamp: Timestamp.fromDate(new Date(msg.timestamp)),
        reactions: (msg.reactions || []).map(r => ({
          ...r,
          timestamp: Timestamp.fromDate(new Date(r.timestamp))
        }))
      }))
    };
    
    const cleanData = cleanForFirestore(cleanConv);
    await db.collection('conversations').doc(conv.id).set(cleanData);
  }
  console.log('Conversations seeded successfully');
}

async function main() {
  try {
    await seedUsers();
    await seedConversations();
    console.log('All data seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

main(); 