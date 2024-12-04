'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

const FinancialStatements = ({ data }) => {
  const [periodicity, setPeriodicity] = useState('quarterly');
  const [copied, setCopied] = useState(false);

  if (!data?.financial_statements) return null;

  const statements = data.financial_statements[periodicity];
  
  const formatFinancialText = () => {
    let text = `Financial Statements (${periodicity.toUpperCase()})\n\n`;
    
    for (const [statementType, statement] of Object.entries(statements)) {
      text += `\n${statementType.toUpperCase()}\n`;
      text += '----------------------\n';
      
      const dates = Object.keys(statement).sort();
      const metrics = Object.keys(statement[dates[0]] || {}).sort();
      
      text += 'Metric\t|\t' + dates.map(d => d).join('\t|\t') + '\n';
      text += '-'.repeat(120) + '\n';

      for (const metric of metrics) {
        text += `${metric}\t|\t`;
        text += dates.map(date => {
          const value = statement[date]?.[metric];
          return value?.toLocaleString('en-US', { 
            style: 'currency', 
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }) || 'N/A';
        }).join('\t|\t');
        text += '\n';
      }
      text += '\n\n';
    }
    
    return text;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatFinancialText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleCopy}
          className="flex items-center gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy All
            </>
          )}
        </Button>
        
        <Tabs value={periodicity} onValueChange={setPeriodicity} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
            <TabsTrigger value="annual">Annual</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardContent className="p-4">
          <pre className="whitespace-pre-wrap font-mono text-sm overflow-x-auto">
            {formatFinancialText()}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialStatements;