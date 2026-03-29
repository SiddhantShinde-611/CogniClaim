import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface CogniClaimDB extends DBSchema {
  expense_drafts: {
    key: string;
    value: {
      id: string;
      amount: number;
      currency: string;
      category: string;
      description: string;
      expense_date: string;
      merchant_name?: string;
      receipt_data?: string;
      created_at: string;
      synced: boolean;
    };
  };
}

let db: IDBPDatabase<CogniClaimDB> | null = null;

async function getDB(): Promise<IDBPDatabase<CogniClaimDB>> {
  if (!db) {
    db = await openDB<CogniClaimDB>('cogniclaim', 1, {
      upgrade(database) {
        database.createObjectStore('expense_drafts', { keyPath: 'id' });
      },
    });
  }
  return db;
}

export async function saveDraft(draft: CogniClaimDB['expense_drafts']['value']): Promise<void> {
  const database = await getDB();
  await database.put('expense_drafts', draft);
}

export async function getDrafts(): Promise<CogniClaimDB['expense_drafts']['value'][]> {
  const database = await getDB();
  return database.getAll('expense_drafts');
}

export async function deleteDraft(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('expense_drafts', id);
}

export async function getPendingDrafts(): Promise<CogniClaimDB['expense_drafts']['value'][]> {
  const drafts = await getDrafts();
  return drafts.filter((d) => !d.synced);
}
