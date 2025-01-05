// lib/supabase-storage.ts
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

  public async saveTransactions(transactions: Transaction[]): Promise<void> {
    try {
      const userId = await this.getUserId();
      const filePath = this.getFilePath(userId);

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

  public async syncWithSupabase(): Promise<void> {
    try {
      const userId = await this.getUserId();
      const filePath = this.getFilePath(userId);

      // Try to download existing transactions
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .download(filePath);

      if (error && error.message !== 'Object not found') {
        throw error;
      }

      // If we have remote data, merge it with local
      if (data) {
        const remoteTransactions: Transaction[] = JSON.parse(await data.text());
        const localTransactions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');

        // Merge logic here - you might want to implement your own merge strategy
        const mergedTransactions = this.mergeTransactions(localTransactions, remoteTransactions);
        
        // Save merged transactions both locally and remotely
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mergedTransactions));
        await this.saveTransactions(mergedTransactions);
      } else {
        // If no remote data exists, upload local data
        const localTransactions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
        await this.saveTransactions(localTransactions);
      }
    } catch (error) {
      console.error('Error syncing with Supabase:', error);
      throw error;
    }
  }

  private mergeTransactions(local: Transaction[], remote: Transaction[]): Transaction[] {
    // Create a map of transactions by ID
    const transactionMap = new Map<string, Transaction>();
    
    // Add all remote transactions to the map
    remote.forEach(transaction => {
      transactionMap.set(transaction.id, transaction);
    });
    
    // Add or update with local transactions
    local.forEach(transaction => {
      transactionMap.set(transaction.id, transaction);
    });
    
    // Convert map back to array and sort by date
    return Array.from(transactionMap.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

export const storageService = new StorageService();