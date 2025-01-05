// transactions.ts

import { format } from 'date-fns';
import Papa from 'papaparse';
import { Transaction } from '@/lib/types';

type UnvalidatedTransaction = {
  id?: number;
  date: unknown;
  ticker: unknown;
  type: unknown;
  price: unknown;
  shares: unknown;
};

// Define a type for CSV row data
type CSVRowData = {
  date: string;
  ticker: string;
  type: string;
  price: number;
  shares: number;
  [key: string]: unknown; // Allow for additional fields in CSV
};

export const validateTransaction = (transaction: UnvalidatedTransaction): transaction is Transaction => {
  return (
    typeof transaction.date === 'string' &&
    typeof transaction.ticker === 'string' &&
    (transaction.type === 'buy' || transaction.type === 'sell') &&
    typeof transaction.price === 'number' &&
    typeof transaction.shares === 'number' &&
    transaction.price > 0 &&
    transaction.shares > 0
  );
};

export const exportToJSON = (data: Transaction[]) => {
  const dataStr = JSON.stringify(data, null, 2);
  return new Blob([dataStr], { type: 'application/json' });
};

export const exportToCSV = (data: Transaction[]) => {
  const csvData = data.map(t => ({
    date: format(new Date(t.date), "yyyy-MM-dd"),
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
  
  return new Blob([csv], { type: 'text/csv' });
};

export const downloadFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const parseJSONFile = async (file: File): Promise<Transaction[]> => {
  const text = await file.text();
  const data = JSON.parse(text);
  
  if (!Array.isArray(data)) {
    throw new Error('Invalid JSON format: Expected an array of transactions');
  }
  
  const transactions = data.map(item => ({
    id: item.id || Date.now() + Math.random(),
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

export const parseCSVFile = async (file: File): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const transactions = (results.data as CSVRowData[]).map((row) => ({
            id: Date.now() + Math.random(),
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