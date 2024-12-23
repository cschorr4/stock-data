import React from 'react';
import { format } from 'date-fns';
import { Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/components/ui/use-toast';
import { Transaction } from '@/lib/types';
import {
  exportToJSON,
  exportToCSV,
  downloadFile,
  parseJSONFile,
  parseCSVFile
} from '@/lib/transactions';

interface ImportButtonProps {
  onImport: (transactions: Transaction[]) => void;
}

export const ImportButton: React.FC<ImportButtonProps> = ({ onImport }) => {
  const { toast } = useToast();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    
    try {
      let transactions: Transaction[];
      
      if (file.type === 'application/json') {
        transactions = await parseJSONFile(file);
      } else if (file.type === 'text/csv') {
        transactions = await parseCSVFile(file);
      } else {
        throw new Error('Unsupported file format. Please use JSON or CSV.');
      }
      
      onImport(transactions);
      toast({
        title: "Success",
        description: `Imported ${transactions.length} transactions successfully.`,
      });
    } catch (err) {
      const error = err as Error;
      console.error('Error importing transactions:', error);
      toast({
        variant: "destructive",
        title: "Import Error",
        description: error.message || 'Error importing transactions. Please check the file format.',
      });
    }

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
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mr-2 h-4 w-4" />
        Import
      </Button>
    </>
  );
};

interface ExportButtonProps {
  transactions: Transaction[];
}

export const ExportButton: React.FC<ExportButtonProps> = ({ transactions }) => {
  const formatDate = (date: Date): string => format(date, 'yyyy-MM-dd');

  const handleExport = (exportFormat: 'json' | 'csv') => {
    const timestamp = formatDate(new Date());
    const filename = `stock_transactions_${timestamp}.${exportFormat}`;
    const blob = exportFormat === 'json'
      ? exportToJSON(transactions)
      : exportToCSV(transactions);
    downloadFile(blob, filename);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
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
  );
};