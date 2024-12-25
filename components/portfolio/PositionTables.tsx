import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OpenPositionsTable from '@/components/OpenPositionsTable';
import ClosedPositionsTable from '@/components/ClosedPositionsTable';
import { Position, ClosedPosition } from '@/lib/types';

interface PositionTablesProps {
  openPositions: Position[];
  closedPositions: ClosedPosition[];
}

const PositionTables: React.FC<PositionTablesProps> = ({
  openPositions,
  closedPositions
}) => {
  return (
    <div className="w-full p-4">
      <Tabs defaultValue="open" className="w-full">
        <div className="flex justify-center mb-4">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="open" className="data-[state=active]:bg-green-500/10">
              Open ({openPositions.length})
            </TabsTrigger>
            <TabsTrigger value="closed" className="data-[state=active]:bg-blue-500/10">
              Closed ({closedPositions.length})
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="open" className="mt-0">
          <OpenPositionsTable positions={openPositions} />
        </TabsContent>
        <TabsContent value="closed" className="mt-0">
          <ClosedPositionsTable positions={closedPositions} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PositionTables;