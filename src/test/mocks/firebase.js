import { vi } from 'vitest';

class MockFirebaseCollection {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.data = [];
    this.queryConfig = null;
  }

  mockQuery(config, mockData) {
    this.queryConfig = config;
    this.data = mockData;
    return this;
  }

  onSnapshot(callback) {
    callback({
      docs: this.data.map(doc => ({
        id: doc.id,
        data: () => ({ ...doc }),
        exists: true
      })),
      forEach: (fn) => this.data.forEach(doc => fn({
        id: doc.id,
        data: () => ({ ...doc }),
        exists: true
      }))
    });
    return () => {};
  }

  doc(id) {
    return {
      get: () => Promise.resolve({
        exists: true,
        data: () => this.data.find(d => d.id === id) || {}
      }),
      set: (data) => {
        this.data = [...this.data.filter(d => d.id !== id), { id, ...data }];
        return Promise.resolve();
      },
      update: (updates) => {
        this.data = this.data.map(d => d.id === id ? { ...d, ...updates } : d);
        return Promise.resolve();
      },
      delete: () => {
        this.data = this.data.filter(d => d.id !== id);
        return Promise.resolve();
      }
    };
  }

  add(data) {
    const id = `mock-${Date.now()}`;
    this.data.push({ id, ...data });
    return Promise.resolve({ id });
  }

  where() {
    return this;
  }
}

const mockUser = {
  uid: 'testUser1',
  email: 'test@example.com',
  displayName: 'Test User'
};

export const mockFirebase = {
  auth: {
    currentUser: mockUser,
    onAuthStateChanged: vi.fn((callback) => {
      callback(mockUser);
      return () => {};
    }),
    signOut: vi.fn(() => Promise.resolve()),
    signInWithPopup: vi.fn(() => Promise.resolve({ user: mockUser })),
    signInWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: mockUser })),
    createUserWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: mockUser }))
  },
  mockCollection: (name) => new MockFirebaseCollection(name)
};

// Mock the Firebase modules
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => mockFirebase.auth),
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback(mockUser);
    return () => {};
  }),
  signOut: vi.fn(() => Promise.resolve()),
  signInWithPopup: vi.fn(() => Promise.resolve({ user: mockUser })),
  signInWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: mockUser })),
  createUserWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: mockUser })),
  GoogleAuthProvider: vi.fn(() => ({}))
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => mockFirebase),
  collection: vi.fn((db, name) => mockFirebase.mockCollection(name)),
  doc: vi.fn((collection, id) => collection.doc(id)),
  addDoc: vi.fn((collection, data) => collection.add(data)),
  updateDoc: vi.fn((docRef, updates) => docRef.update(updates)),
  deleteDoc: vi.fn((docRef) => docRef.delete()),
  onSnapshot: vi.fn((query, callback) => query.onSnapshot(callback)),
  query: vi.fn((collection) => collection),
  where: vi.fn(() => mockFirebase.mockCollection().where()),
  serverTimestamp: vi.fn(() => new Date().toISOString())
})); 