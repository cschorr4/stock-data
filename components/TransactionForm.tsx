import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface TransactionFormProps {
  initialData?: {
    id?: number;
    date?: string;
    ticker?: string;
    type?: 'buy' | 'sell' | 'dividend';
    price?: number;
    shares?: number;
  };
  onSubmit: (transaction: {
    id: number;
    date: string;
    ticker: string;
    type: 'buy' | 'sell' | 'dividend';
    price: number;
    shares: number;
  }) => void;
  onCancel: () => void;
}

const TransactionForm = ({ initialData, onSubmit, onCancel }: TransactionFormProps) => {
  const [formState, setFormState] = useState({
    ticker: initialData?.ticker || '',
    type: initialData?.type || 'buy',
    price: initialData?.price?.toString() || '',
    shares: initialData?.shares?.toString() || ''
  });
  
  const [selectedDate, setSelectedDate] = useState<Date>(
    initialData?.date ? new Date(initialData.date) : new Date()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: initialData?.id || Date.now(),
      date: selectedDate.toISOString(),
      ticker: formState.ticker.toUpperCase(),
      type: formState.type as 'buy' | 'sell' | 'dividend',
      price: parseFloat(formState.price),
      shares: parseFloat(formState.shares)
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "yyyy.MM.dd") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label>Ticker</Label>
        <Input
          name="ticker"
          value={formState.ticker}
          onChange={handleInputChange}
          placeholder="AAPL"
          className="uppercase"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Type</Label>
        <Select 
          onValueChange={(value: 'buy' | 'sell' | 'dividend') => 
            setFormState(prev => ({ ...prev, type: value }))} 
          value={formState.type}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="buy">Buy</SelectItem>
            <SelectItem value="sell">Sell</SelectItem>
            <SelectItem value="dividend">Dividend</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Price</Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          name="price"
          value={formState.price}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Shares</Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          name="shares"
          value={formState.shares}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? 'Update' : 'Add'} Transaction
        </Button>
      </div>
    </form>
  );
};

export default TransactionForm;