'use client';

import React from 'react';
import { format as dateFormat } from 'date-fns';
import Papa from 'papaparse';
import { Download, Upload, Plus, Pencil, Trash2, ArrowUpDown } from 'lucide-react';
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
import { Transaction } from '@/lib/types';
import TransactionForm from './TransactionForm';
import { validateTransaction, exportToJSON, exportToCSV, downloadFile, parseCSVFile} from '@/lib/transactions';

interface CSVRow {
  date: string;
  ticker: string;
  type: string;
  price: number;
  shares: number;
}

interface ImportedTransaction {
  id?: number;
  date: string;
  ticker: string;
  type: string;
  price: number;
  shares: number;
}

interface TransactionTableProps {
  transactions: Transaction[];
  onTransactionAdd: (transaction: Transaction) => void;
  onTransactionEdit: (transaction: Transaction) => void;
  onTransactionDelete: (id: number) => void;
  onTransactionsDeleteAll: () => void;
}

function isValidTransactionType(type: string): type is Transaction['type'] {
  return ['buy', 'sell', 'dividend'].includes(type.toLowerCase());
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onTransactionAdd,
  onTransactionEdit,
  onTransactionDelete,
  onTransactionsDeleteAll,
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
        
        return sortConfig.direction === 'asc' 
          ? valueA < valueB ? -1 : valueA > valueB ? 1 : 0
          : valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
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
      const transactions = await parseCSVFile(file);
      console.log('Parsed transactions:', transactions);
      transactions.forEach(onTransactionAdd);
      toast({
        title: "Success",
        description: `Imported ${transactions.length} transactions successfully.`,
      });
    } catch (error) {
      console.error('Error importing transactions:', error);
      toast({
        variant: "destructive",
        title: "Import Error",
        description: (error as Error).message || 'Error importing transactions.',
      });
    }
  };

  interface ImportButtonProps {
    className?: string;
  }
   
  const ImportButton = ({ className }: ImportButtonProps) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
  
    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.length) return;
      handleFileImport(e.target.files[0]);
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
          accept=".json,.csv"
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
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">Transaction Log</h3>
            <Badge variant="secondary">
              {transactions.length} transactions
            </Badge>
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
       <span className="sm:hidden">Add Transaction</span> 
        <span className="hidden sm:inline">Add Transaction</span>
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add New Transaction</DialogTitle>
      </DialogHeader>
      <TransactionForm
        onSubmit={(transaction: Transaction) => {
          onTransactionAdd(transaction);
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
            <Trash2 className="mr-2 h-4 w-4"/>
            <span className="ml-2 hidden md:inline">Remove All</span>
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
        : 'blue'  // for dividend
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
              onSubmit={(transaction) => {
                onTransactionEdit(transaction);
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