'use client';

import React from 'react';
import { format as dateFormat } from 'date-fns';
import { Download, Upload, Plus, Pencil, Trash2, ArrowUpDown, CloudUpload } from 'lucide-react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import TransactionForm from './TransactionForm';
import { Transaction, TransactionFormData } from '@/lib/types';

// CSV Cleaning and Validation Functions
interface CSVRowData {
  date: string;
  ticker: string;
  type: string;
  price: string | number;
  shares: string | number;
  total?: string | number;
  [key: string]: unknown;
}

const cleanCSVData = (csvContent: string): CSVRowData[] => {
  // Split content into lines and clean each line
  const lines = csvContent.split('\n');
  
  // Clean lines
  const cleanedLines = lines.map(line => {
    // Remove any extra whitespace
    line = line.trim();
    
    // Fix merged lines by looking for date patterns in the middle of the line
    const datePattern = /\d{4}-\d{2}-\d{2}/g;
    const dates = line.match(datePattern);
    
    if (dates && dates.length > 1) {
      // Split the line at the second date occurrence
      const splitPoint = line.indexOf(dates[1]);
      return [
        line.substring(0, splitPoint).trim(),
        line.substring(splitPoint).trim()
      ];
    }
    
    return line;
  }).flat(); // Flatten array in case we split any lines
  
  // Rejoin lines with proper line endings
  const cleanedContent = cleanedLines.join('\n');
  
  // Parse the cleaned content
  const parsed = Papa.parse(cleanedContent, {
    header: true,
    skipEmptyLines: true,
    transform: (value, field) => {
      // Standardize number formatting for price and shares
      if (field === 'price' || field === 'shares') {
        return Number(value).toFixed(4);
      }
      return value;
    }
  });
  
  // Validate and clean each row
  const validatedData = (parsed.data as CSVRowData[]).filter(row => {
    return (
      row.date &&
      row.ticker &&
      row.type &&
      !isNaN(Number(row.price)) &&
      !isNaN(Number(row.shares))
    );
  });
  
  return validatedData;
};

// Export functions
const exportToJSON = (data: Transaction[]): Blob => {
  const dataStr = JSON.stringify(data, null, 2);
  return new Blob([dataStr], { type: 'application/json' });
};

const exportToCSV = (data: Transaction[]): Blob => {
  const csvData = data.map(t => ({
    date: dateFormat(new Date(t.date), 'yyyy-MM-dd'),
    ticker: t.ticker.trim().toUpperCase(),
    type: t.type.trim().toLowerCase(),
    price: t.price.toFixed(2),
    shares: t.shares.toFixed(2),
    total: (t.price * t.shares).toFixed(2)
  }));

  const csv = Papa.unparse(csvData, {
    header: true,
    delimiter: ",",
    newline: "\r\n",
    skipEmptyLines: true
  });
  
  return new Blob([csv], { type: 'text/csv;charset=utf-8' });
};

const downloadFile = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

interface TransactionTableProps {
  transactions: Transaction[];
  onTransactionAdd: (payload: { 
    type?: 'single' | 'batch';
    transaction?: Transaction;
    transactions?: Transaction[];
  }) => void;
  onTransactionEdit: (transaction: Transaction) => void;
  onTransactionDelete: (id: string) => void;
  onTransactionsDeleteAll: () => void;
  onSync: () => void;
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onTransactionAdd,
  onTransactionEdit,
  onTransactionDelete,
  onTransactionsDeleteAll,
  onSync
}) => {
  const { toast } = useToast();
  const [filter, setFilter] = React.useState('');
  const [sortConfig, setSortConfig] = React.useState<{
    key: keyof Transaction;
    direction: 'asc' | 'desc';
  }>({
    key: 'date',
    direction: 'desc'
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = React.useState(false);
  const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | null>(null);

  const getFilteredAndSortedTransactions = React.useMemo(() => {
    return transactions
      .filter(transaction => 
        transaction.ticker.toLowerCase().includes(filter.toLowerCase())
      )
      .sort((a, b) => {
        if (sortConfig.key === 'date') {
          const dateA = new Date(a[sortConfig.key]).getTime();
          const dateB = new Date(b[sortConfig.key]).getTime();
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
        
        const valueA = a[sortConfig.key];
        const valueB = b[sortConfig.key];
        
        if (valueA === undefined || valueB === undefined) return 0;
        
        return sortConfig.direction === 'asc' 
          ? (valueA < valueB ? -1 : valueA > valueB ? 1 : 0)
          : (valueA > valueB ? -1 : valueA < valueB ? 1 : 0);
      });
  }, [transactions, filter, sortConfig]);

  const handleSort = (key: keyof Transaction) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleExport = (exportFormat: 'json' | 'csv') => {
    const timestamp = dateFormat(new Date(), 'yyyy-MM-dd');
    const filename = `stock_transactions_${timestamp}.${exportFormat}`;
    
    const blob = exportFormat === 'json' 
      ? exportToJSON(transactions)
      : exportToCSV(transactions);
    
    downloadFile(blob, filename);
  };

  const handleFileImport = async (file: File) => {
    try {
      // Read and clean the CSV content
      const text = await file.text();
      const cleanedData = cleanCSVData(text);
      
      if (!Array.isArray(cleanedData) || cleanedData.length === 0) {
        throw new Error('No valid transactions found in file');
      }

      // Process each transaction
      const processedTransactions: Transaction[] = cleanedData.map(row => ({
        id: crypto.randomUUID(),
        user_id: '',
        date: new Date(row.date).toISOString(),
        ticker: String(row.ticker).toUpperCase(),
        type: String(row.type).toLowerCase() as 'buy' | 'sell' | 'dividend',
        price: Number(row.price),
        shares: Number(row.shares),
        total_amount: Number(row.price) * Number(row.shares)
      }));

      // Validate the processed transactions
      const invalidTransactions = processedTransactions.filter(t => 
        !t.date || !t.ticker || !t.type || isNaN(t.price) || isNaN(t.shares) ||
        t.price <= 0 || t.shares <= 0
      );

      if (invalidTransactions.length > 0) {
        console.error('Invalid transactions found:', invalidTransactions);
        throw new Error(`Found ${invalidTransactions.length} invalid transactions`);
      }

      // Add all transactions as a batch
      onTransactionAdd({
        type: 'batch',
        transactions: processedTransactions
      });

      toast({
        title: "Success",
        description: `Imported ${processedTransactions.length} transactions successfully.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error importing transactions:', error);
      toast({
        variant: "destructive",
        title: "Import Error",
        description: (error as Error).message || 'Error importing transactions.',
        duration: 5000,
      });
    }
  };

  const ImportButton: React.FC<{ className?: string }> = ({ className }) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
  
    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      handleFileImport(file);
      
      // Reset the input
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    };
  
    return (
      <>
        <input
          type="file"
          ref={inputRef}
          onChange={handleImport}
          accept=".csv"
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          className={className}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          <span className="hidden sm:ml-2 sm:inline">Import</span>
        </Button>
      </>
    );
  };

  const MobileTransaction = ({ transaction }: { transaction: Transaction }) => (
    <Card className="mb-4 p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-lg">{transaction.ticker}</span>
            <Badge variant={
              transaction.type === 'buy' 
                ? 'default'
                : transaction.type === 'sell'
                ? 'sand'
                : 'blue'
            }>
              {transaction.type.toUpperCase()}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {dateFormat(new Date(transaction.date), "yyyy.MM.dd")}
          </div>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedTransaction(transaction);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit transaction</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setSelectedTransaction(transaction);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete transaction</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Price</p>
          <p className="font-medium">${transaction.price.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Shares</p>
          <p className="font-medium">{transaction.shares}</p>
        </div>
        <div className="col-span-2">
          <p className="text-muted-foreground">Total</p>
          <p className="font-medium">${(transaction.price * transaction.shares).toFixed(2)}</p>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">Transaction Log</h3>
            <Badge variant="secondary" className="text-xs px-2 py-0.5 whitespace-nowrap">
              {transactions.length} transactions
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onSync}
                    className="h-8 px-2 flex items-center gap-1.5"
                  >
                    <CloudUpload className="h-4 w-4" />
                    <span className="sm:inline text-sm font-medium">Sync</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sync with cloud storage</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Input
              placeholder="Filter by ticker..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full sm:w-64"
            />
            
            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="min-w-10">
                          <Download className="h-4 w-4" />
                          <span className="hidden sm:ml-2 sm:inline">Export</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleExport('json')}>
                          Export as JSON
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport('csv')}>
                          Export as CSV
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TooltipTrigger>
                  <TooltipContent>Export transactions</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <ImportButton className="min-w-10" />
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Add Transaction</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Transaction</DialogTitle>
                  </DialogHeader>
                  <TransactionForm
                    onSubmit={(formData: TransactionFormData) => {
                      const fullTransaction: Transaction = {
                        ...formData,
                        id: crypto.randomUUID(),
                        user_id: '',
                        total_amount: formData.price * formData.shares
                      };
                      onTransactionAdd({
                        type: 'single',
                        transaction: fullTransaction
                      });
                      setIsAddDialogOpen(false);
                    }}
                    onCancel={() => setIsAddDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>

              {transactions.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => setIsDeleteAllDialogOpen(true)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Remove All</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete all transactions</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden px-4 pb-4">
        {getFilteredAndSortedTransactions.map(transaction => (
          <MobileTransaction 
            key={`${transaction.id}-mobile`}
            transaction={transaction}
          />
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="overflow-x-auto px-6 pb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('date')}
                    className="w-full text-left font-medium"
                  >
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4 inline-block" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('ticker')}
                    className="w-full text-left font-medium"
                  >
                    Ticker
                    <ArrowUpDown className="ml-2 h-4 w-4 inline-block" />
                  </Button>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Shares</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getFilteredAndSortedTransactions.map(transaction => (
                <TableRow key={transaction.id}>
                  <TableCell>{dateFormat(new Date(transaction.date), "yyyy.MM.dd")}</TableCell>
                  <TableCell className="font-medium">{transaction.ticker}</TableCell>
                  <TableCell>
                    <Badge variant={
                      transaction.type === 'buy' 
                        ? 'default'
                        : transaction.type === 'sell'
                        ? 'sand'
                        : 'blue'
                    }>
                      {transaction.type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>${transaction.price.toFixed(2)}</TableCell>
                  <TableCell>{transaction.shares}</TableCell>
                  <TableCell>${(transaction.price * transaction.shares).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit transaction</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete transaction</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <TransactionForm
              initialData={selectedTransaction}
              onSubmit={(formData: TransactionFormData) => {
                const updatedTransaction: Transaction = {
                  ...formData,
                  id: selectedTransaction.id,
                  user_id: selectedTransaction.user_id,
                  total_amount: formData.price * formData.shares
                };
                onTransactionEdit(updatedTransaction);
                setIsEditDialogOpen(false);
              }}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Single Transaction Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (selectedTransaction) {
                  onTransactionDelete(selectedTransaction.id);
                }
                setIsDeleteDialogOpen(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Transactions Dialog */}
      <AlertDialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Transactions</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all transactions? This action cannot be undone and will remove all {transactions.length} transactions from your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onTransactionsDeleteAll();
                setIsDeleteAllDialogOpen(false);
                toast({
                  title: "Success",
                  description: "All transactions have been deleted.",
                });
              }}
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TransactionTable;