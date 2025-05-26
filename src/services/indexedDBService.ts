
interface StoredMessage {
  id: string;
  content: string;
  sender_id: string;
  conversation_id: string;
  created_at: string;
  sender: {
    username: string;
    avatar_url: string | null;
  };
}

interface StoredConversation {
  id: string;
  name: string | null;
  is_group: boolean;
  avatar_url: string | null;
  updated_at: string;
  lastMessage?: {
    content: string;
    created_at: string;
    sender: {
      username: string;
    };
  };
  otherUser?: {
    username: string;
    avatar_url: string | null;
    status: string;
  };
  participants?: {
    username: string;
    avatar_url: string | null;
  }[];
  labels?: any[];
}

class IndexedDBService {
  private dbName = 'ChatAppDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create conversations store
        if (!db.objectStoreNames.contains('conversations')) {
          const conversationsStore = db.createObjectStore('conversations', { keyPath: 'id' });
          conversationsStore.createIndex('updated_at', 'updated_at', { unique: false });
        }

        // Create messages store
        if (!db.objectStoreNames.contains('messages')) {
          const messagesStore = db.createObjectStore('messages', { keyPath: 'id' });
          messagesStore.createIndex('conversation_id', 'conversation_id', { unique: false });
          messagesStore.createIndex('created_at', 'created_at', { unique: false });
        }
      };
    });
  }

  async storeConversation(conversation: StoredConversation): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['conversations'], 'readwrite');
      const store = transaction.objectStore('conversations');
      const request = store.put(conversation);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getConversations(): Promise<StoredConversation[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['conversations'], 'readonly');
      const store = transaction.objectStore('conversations');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async storeMessage(message: StoredMessage): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      const request = store.put(message);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async storeMessages(messages: StoredMessage[]): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      
      let completed = 0;
      const total = messages.length;

      if (total === 0) {
        resolve();
        return;
      }

      messages.forEach(message => {
        const request = store.put(message);
        request.onsuccess = () => {
          completed++;
          if (completed === total) resolve();
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  async getMessagesByConversation(conversationId: string): Promise<StoredMessage[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const index = store.index('conversation_id');
      const request = index.getAll(conversationId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const messages = request.result || [];
        // Sort by created_at
        messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        resolve(messages);
      };
    });
  }

  async clearAllData(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['conversations', 'messages'], 'readwrite');
      
      const conversationsStore = transaction.objectStore('conversations');
      const messagesStore = transaction.objectStore('messages');
      
      const clearConversations = conversationsStore.clear();
      const clearMessages = messagesStore.clear();

      let completed = 0;
      const complete = () => {
        completed++;
        if (completed === 2) resolve();
      };

      clearConversations.onsuccess = complete;
      clearMessages.onsuccess = complete;
      clearConversations.onerror = () => reject(clearConversations.error);
      clearMessages.onerror = () => reject(clearMessages.error);
    });
  }
}

export const indexedDBService = new IndexedDBService();
