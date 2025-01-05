import { format } from 'date-fns';
import Papa from 'papaparse';
import { Transaction } from '@/lib/types';

const isValidTransactionType = (type: string): type is 'buy' | 'sell' | 'dividend' => {
  return ['buy', 'sell', 'dividend'].includes(type.toLowerCase());
};

interface TransactionInput {
  id?: string;  // Changed from number to string
  date: string;
  ticker: string;
  type: string;
  price: number | string;
  shares: number | string;
  user_id?: string; 
}

export const validateTransaction = (input: TransactionInput): input is Transaction => {
  const type = String(input.type).toLowerCase();
  const price = Number(input.price);
  const shares = Number(input.shares);
  
  return !!(
    input.id &&
    input.user_id &&  // Make sure user_id is present
    input.date &&
    input.ticker &&
    isValidTransactionType(type) &&
    !isNaN(price) &&
    price > 0 &&
    !isNaN(shares) &&
    shares > 0
  );
};

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
  const csv = Papa.unparse(csvData);
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

interface CSVRowData {
  date: string;
  ticker: string;
  type: string;
  price: string | number;
  shares: string | number;
}

export const parseCSVFile = async (file: File): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const transactions = (results.data as CSVRowData[]).map((row) => ({
            id: crypto.randomUUID(),  // Use UUID instead of timestamp
            user_id: '',  // This will be set by the component
            date: new Date(row.date).toISOString(),
            ticker: row.ticker.toUpperCase(),
            type: row.type.toLowerCase(),
            price: Number(row.price),
            shares: Number(row.shares)
          }));

          if (!transactions.every(validateTransaction)) {
            throw new Error('Invalid transaction data in CSV');
          }
          resolve(transactions);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => reject(error)
    });
  });
};

export const parseJSONFile = async (file: File): Promise<Transaction[]> => {
  const text = await file.text();
  const data = JSON.parse(text);
  
  if (!Array.isArray(data)) {
    throw new Error('Invalid JSON format: Expected an array of transactions');
  }

  const transactions = data.map(item => ({
    id: item.id || crypto.randomUUID(),
    user_id: item.user_id || '',  // Use existing user_id or empty string
    date: new Date(item.date).toISOString(),
    ticker: item.ticker.toUpperCase(),
    type: item.type.toLowerCase(),
    price: Number(item.price),
    shares: Number(item.shares)
  }));

  if (!transactions.every(validateTransaction)) {
    throw new Error('Invalid transaction data in JSON');
  }

  return transactions;
};