import { format } from 'date-fns';
import Papa from 'papaparse';
import { Transaction } from '@/lib/types';

// Type definitions
interface CSVRowData {
  date: string;
  ticker: string;
  type: string;
  price: string | number;
  shares: string | number;
  [key: string]: unknown;
}

type TransactionType = 'buy' | 'sell' | 'dividend';

// Validation helpers
const isValidTransactionType = (type: string): type is TransactionType => {
  return ['buy', 'sell', 'dividend'].includes(type.toLowerCase());
};

export const validateTransaction = (transaction: Partial<Transaction>): transaction is Transaction => {
  if (!transaction) return false;

  const type = String(transaction.type).toLowerCase();
  const price = Number(transaction.price);
  const shares = Number(transaction.shares);

  return !!(
    transaction.id &&
    transaction.date &&
    transaction.ticker &&
    isValidTransactionType(type) &&
    !isNaN(price) &&
    price > 0 &&
    !isNaN(shares) &&
    shares > 0
  );
};

// Export functions
export const exportToJSON = (data: Transaction[]): Blob => {
  const dataStr = JSON.stringify(data, null, 2);
  return new Blob([dataStr], { type: 'application/json' });
};

export const exportToCSV = (data: Transaction[]): Blob => {
  const csvData = data.map(t => ({
    date: format(new Date(t.date), 'yyyy-MM-dd'),
    ticker: t.ticker,
    type: t.type,
    price: t.price,
    shares: t.shares,
    total: t.price * t.shares
  }));

  const csv = Papa.unparse(csvData, {
    header: true,
    delimiter: ",",
  });
  
  return new Blob([csv], { type: 'text/csv;charset=utf-8' });
};

export const downloadFile = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Import functions
export const parseCSVFile = async (file: File): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const transactions = (results.data as CSVRowData[]).map((row) => ({
            id: crypto.randomUUID(),
            user_id: '', // Will be set by parent component
            date: new Date(row.date).toISOString(),
            ticker: String(row.ticker).toUpperCase(),
            type: String(row.type).toLowerCase() as TransactionType,
            price: Number(row.price || 0),
            shares: Number(row.shares || 0),
            total_amount: Number(row.price || 0) * Number(row.shares || 0)
          }));

          // Validate all transactions before returning
          if (!transactions.every(validateTransaction)) {
            throw new Error('Invalid transaction data in CSV');
          }

          resolve(transactions);
        } catch (error) {
          console.error('Error processing CSV:', error);
          reject(error instanceof Error ? error : new Error('Failed to process CSV'));
        }
      },
      error: (error) => reject(new Error(`CSV parsing error: ${error}`))
    });
  });
};

export const parseJSONFile = async (file: File): Promise<Transaction[]> => {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!Array.isArray(data)) {
      throw new Error('Invalid JSON format: Expected an array of transactions');
    }

    const transactions = data.map(item => ({
      id: item.id || crypto.randomUUID(),
      user_id: item.user_id || '',
      date: new Date(item.date).toISOString(),
      ticker: String(item.ticker).toUpperCase(),
      type: String(item.type).toLowerCase() as TransactionType,
      price: Number(item.price),
      shares: Number(item.shares),
      total_amount: Number(item.price) * Number(item.shares)
    }));

    if (!transactions.every(validateTransaction)) {
      throw new Error('Invalid transaction data in JSON');
    }

    return transactions;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to parse JSON file');
  }
};