import { createClient } from '@/utils/supabase/client';
import { Transaction } from '@/lib/types';
import { LOCAL_STORAGE_KEY } from '@/lib/storage';

class StorageService {
  private supabase = createClient();
  private bucketName = 'transactions';

  private async getUserId(): Promise<string> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    return user.id;
  }

  private getFilePath(userId: string): string {
    return `${userId}/transactions.json`;
  }

  private getUserStorageKey(userId: string): string {
    return `${LOCAL_STORAGE_KEY}_${userId}`;
  }

  public async saveTransactions(transactions: Transaction[]): Promise<void> {
    try {
      const userId = await this.getUserId();
      const filePath = this.getFilePath(userId);
      const storageKey = this.getUserStorageKey(userId);

      // Save to local storage with user-specific key
      localStorage.setItem(storageKey, JSON.stringify(transactions));

      // Save to Supabase storage
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, JSON.stringify(transactions), {
          upsert: true,
          contentType: 'application/json',
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving transactions:', error);
      throw error;
    }
  }

  public async loadTransactions(): Promise<Transaction[]> {
    try {
      const userId = await this.getUserId();
      const storageKey = this.getUserStorageKey(userId);
      
      // Try to get from local storage first
      const localData = localStorage.getItem(storageKey);
      if (localData) {
        return JSON.parse(localData);
      }

      // If not in local storage, try to get from Supabase
      const filePath = this.getFilePath(userId);
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .download(filePath);

      if (error) {
        if (error.message === 'Object not found') {
          return [];
        }
        throw error;
      }

      const transactions = JSON.parse(await data.text());
      localStorage.setItem(storageKey, JSON.stringify(transactions));
      return transactions;
    } catch (error) {
      console.error('Error loading transactions:', error);
      return [];
    }
  }

  public async syncWithSupabase(): Promise<void> {
    try {
      const userId = await this.getUserId();
      const filePath = this.getFilePath(userId);
      const storageKey = this.getUserStorageKey(userId);

      // Get local transactions
      const localData = localStorage.getItem(storageKey);
      const localTransactions: Transaction[] = localData ? JSON.parse(localData) : [];

      // Get remote transactions
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .download(filePath);

      if (error && error.message !== 'Object not found') {
        throw error;
      }

      let remoteTransactions: Transaction[] = [];
      if (data) {
        remoteTransactions = JSON.parse(await data.text());
      }

      // Merge transactions
      const mergedTransactions = this.mergeTransactions(localTransactions, remoteTransactions);
      
      // Save merged transactions both locally and remotely
      localStorage.setItem(storageKey, JSON.stringify(mergedTransactions));
      await this.saveTransactions(mergedTransactions);

      return;
    } catch (error) {
      console.error('Error syncing with Supabase:', error);
      throw error;
    }
  }

  private mergeTransactions(local: Transaction[], remote: Transaction[]): Transaction[] {
    const transactionMap = new Map<string, Transaction>();
    
    // Add all transactions to the map, with remote taking precedence
    remote.forEach(transaction => {
      transactionMap.set(transaction.id, transaction);
    });
    
    local.forEach(transaction => {
      if (!transactionMap.has(transaction.id)) {
        transactionMap.set(transaction.id, transaction);
      }
    });
    
    return Array.from(transactionMap.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

export const storageService = new StorageService();