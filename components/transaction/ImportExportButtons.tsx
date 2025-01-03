import { format } from 'date-fns';
import Papa from 'papaparse';
import { Transaction } from '@/lib/types';

interface TransactionInput {
  id?: number;
  date: string;
  ticker: string;
  type: string;
  price: number | string;
  shares: number | string;
}

const isValidTransactionType = (type: string): type is 'buy' | 'sell' | 'dividend' => {
  return ['buy', 'sell', 'dividend'].includes(type.toLowerCase());
};

export const validateTransaction = (input: TransactionInput): input is Transaction => {
  const type = String(input.type).toLowerCase();
  const price = Number(input.price);
  const shares = Number(input.shares);

  return !!(
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

export const parseCSVFile = (file: File): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse<TransactionInput>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.toLowerCase().trim(),
      complete: (results) => {
        try {
          console.log('Raw CSV data:', results.data);
          
          const filteredRows = results.data.filter(row => row.date && row.ticker && row.type && row.price && row.shares);
          console.log('Filtered rows:', filteredRows);
          
          const transactions = filteredRows
            .map(row => {
              const transaction = {
                id: Date.now() + Math.random(),
                date: new Date(row.date).toISOString(),
                ticker: String(row.ticker).toUpperCase(),
                type: String(row.type).toLowerCase(),
                price: Number(row.price),
                shares: Number(row.shares)
              };
              console.log('Processed transaction:', transaction);
              return transaction;
            })
            .filter((t): t is Transaction => {
              const isValid = validateTransaction(t);
              console.log('Validation result for:', t, isValid);
              return isValid;
            });

          console.log('Final transactions:', transactions);
          resolve(transactions);
        } catch (error) {
          console.error('Error in CSV parsing:', error);
          reject(error);
        }
      },
      error: (error) => reject(error)
    });
  });
};