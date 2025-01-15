import { vi } from 'vitest';

export const mockPersistenceErrors = {
  FAILED_PRECONDITION: {
    code: 'failed-precondition',
    message: 'Failed precondition in persistence initialization'
  },
  UNIMPLEMENTED: {
    code: 'unimplemented',
    message: 'Persistence is not implemented'
  },
  TIMEOUT: {
    code: 'deadline-exceeded',
    message: 'Operation timed out'
  }
};

class MockFirestore {
  constructor() {
    this.documents = new Map();
    this.collections = new Map();
    this._persistenceInitialized = false;
    this._persistenceEnabled = false;
    this._persistenceError = null;
  }

  collection(path) {
    if (!this.collections.has(path)) {
      this.collections.set(path, new Map());
    }
    return {
      id: path,
      add: (data) => this.addDoc(path, data),
      doc: (id) => this.doc(`${path}/${id}`),
      get: () => Promise.resolve({ docs: Array.from(this.collections.get(path).values()) })
    };
  }

  doc(path) {
    return {
      id: path.split('/').pop(),
      set: (data) => this.setDoc(path, data),
      update: (data) => this.updateDoc(path, data),
      delete: () => this.deleteDoc(path),
      get: () => this.getDoc(path)
    };
  }

  async addDoc(collectionPath, data) {
    const id = Math.random().toString(36).substring(7);
    const docPath = `${collectionPath}/${id}`;
    await this.setDoc(docPath, data);
    return { id, path: docPath };
  }

  async setDoc(path, data) {
    this.documents.set(path, { ...data });
    return Promise.resolve();
  }

  async updateDoc(path, data) {
    const existing = this.documents.get(path) || {};
    this.documents.set(path, { ...existing, ...data });
    return Promise.resolve();
  }

  async deleteDoc(path) {
    this.documents.delete(path);
    return Promise.resolve();
  }

  async getDoc(path) {
    const data = this.documents.get(path);
    return Promise.resolve({
      exists: () => !!data,
      data: () => data || null
    });
  }

  enablePersistence() {
    if (this._persistenceError) {
      return Promise.reject(this._persistenceError);
    }
    this._persistenceInitialized = true;
    this._persistenceEnabled = true;
    return Promise.resolve();
  }

  setPersistenceError(error) {
    this._persistenceError = error;
    this._persistenceEnabled = false;
  }

  resetState() {
    this.documents.clear();
    this.collections.clear();
    this._persistenceInitialized = false;
    this._persistenceEnabled = false;
    this._persistenceError = null;
  }
}

const mockDb = new MockFirestore();

export const firebaseMocks = {
  getFirestore: () => mockDb,
  collection: (...args) => mockDb.collection(...args),
  doc: (...args) => mockDb.doc(...args),
  addDoc: vi.fn((...args) => mockDb.addDoc(...args)),
  setDoc: vi.fn((...args) => mockDb.setDoc(...args)),
  updateDoc: vi.fn((...args) => mockDb.updateDoc(...args)),
  deleteDoc: vi.fn((...args) => mockDb.deleteDoc(...args)),
  getDoc: vi.fn((...args) => mockDb.getDoc(...args)),
  enablePersistence: vi.fn(() => mockDb.enablePersistence()),
  setPersistenceError: (error) => mockDb.setPersistenceError(error),
  resetMockDb: () => {
    mockDb.resetState();
    return mockDb;
  }
}; 