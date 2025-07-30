import { useState, useEffect } from "react";
import { X, Plus, Minus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface TableCombinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  combination?: any;
  tables: any[];
  onApplyCombination: (selectedTables: string[], totalCapacity: number) => void;
}

export function TableCombinationModal({
  isOpen,
  onClose,
  combination,
  tables,
  onApplyCombination,
}: TableCombinationModalProps) {
  const { toast } = useToast();
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [totalCapacity, setTotalCapacity] = useState(0);

  // Initialize with combination data if provided
  useEffect(() => {
    if (combination && combination.table_numbers) {
      // Find table IDs based on table numbers
      const tableIds = combination.table_numbers
        .map((tableNumber: string) => {
          const table = tables.find((t) => t.table_number === tableNumber);
          return table?.id;
        })
        .filter(Boolean);

      setSelectedTables(tableIds);
      setTotalCapacity(combination.total_capacity || 0);
    } else {
      setSelectedTables([]);
      setTotalCapacity(0);
    }
  }, [combination, tables]);

  const handleTableToggle = (tableId: string) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;

    if (selectedTables.includes(tableId)) {
      // Remove table
      setSelectedTables((prev) => prev.filter((id) => id !== tableId));
      setTotalCapacity((prev) => prev - table.capacity);
    } else {
      // Add table
      setSelectedTables((prev) => [...prev, tableId]);
      setTotalCapacity((prev) => prev + table.capacity);
    }
  };

  const handleApplyCombination = () => {
    if (selectedTables.length === 0) {
      toast({
        title: "Geen tafels geselecteerd",
        description: "Selecteer minimaal één tafel voor de combinatie.",
        variant: "destructive",
      });
      return;
    }

    onApplyCombination(selectedTables, totalCapacity);
    onClose();

    toast({
      title: "Tafel Combinatie Toegepast",
      description: `Combinatie van ${selectedTables.length} tafels met ${totalCapacity} plaatsen is toegepast.`,
    });
  };

  const getTableStatus = (table: any) => {
    if (table.status === "occupied") return "occupied";
    if (table.status === "cleaning") return "cleaning";
    if (table.status === "out_of_order") return "out_of_order";
    return "available";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "occupied":
        return "bg-red-500";
      case "cleaning":
        return "bg-blue-500";
      case "out_of_order":
        return "bg-gray-500";
      default:
        return "bg-green-500";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Tafel Combinatie Instellen</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Combination Info */}
          {combination && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-2">
                Voorgestelde Combinatie
              </h3>
              <p className="text-sm text-blue-700">
                Tafels: {combination.table_numbers?.join(", ")} (
                {combination.total_capacity} plaatsen)
              </p>
            </div>
          )}

          {/* Selected Tables Summary */}
          {selectedTables.length > 0 && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-900 mb-2">
                Geselecteerde Combinatie
              </h3>
              <div className="flex items-center justify-between">
                <p className="text-sm text-green-700">
                  {selectedTables.length} tafels geselecteerd
                </p>
                <Badge variant="secondary" className="text-green-700">
                  {totalCapacity} plaatsen
                </Badge>
              </div>
            </div>
          )}

          {/* Available Tables */}
          <div>
            <h3 className="font-medium mb-3">Beschikbare Tafels</h3>
            <div className="grid grid-cols-2 gap-3">
              {tables.map((table) => {
                const isSelected = selectedTables.includes(table.id);
                const status = getTableStatus(table);
                const isDisabled =
                  status === "occupied" ||
                  status === "cleaning" ||
                  status === "out_of_order";

                return (
                  <div
                    key={table.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => !isDisabled && handleTableToggle(table.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          Tafel {table.table_number}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {table.capacity} plaatsen
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-3 h-3 rounded-full ${getStatusColor(
                            status
                          )}`}
                        />
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Annuleren
            </Button>
            <Button onClick={handleApplyCombination}>
              Combinatie Toepassen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
