import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Maximize2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRestaurantTables } from "@/hooks/useTables";
import { useActiveReservations } from "@/hooks/useReservations";
import { useNavigate } from "react-router-dom";

type TableStatus = "available" | "occupied" | "reserved" | "cleaning";

interface FloorPlanPreviewProps {
  restaurantId: string;
  selectedDate?: Date;
}

const getTableColor = (status: TableStatus) => {
  switch (status) {
    case "available":
      return "bg-status-available border-status-available";
    case "occupied":
      return "bg-status-occupied border-status-occupied";
    case "reserved":
      return "bg-status-reserved border-status-reserved";
    case "cleaning":
      return "bg-status-cleaning border-status-cleaning";
    default:
      return "bg-muted border-muted";
  }
};

const getDisplayStatus = (
  tableStatus: string,
  hasReservation: boolean
): TableStatus => {
  if (tableStatus === "cleaning") return "cleaning";
  if (hasReservation) return "reserved";
  if (tableStatus === "occupied") return "occupied";
  if (tableStatus === "reserved") {
    // Show as reserved if there's a reservation or if it's part of a combination
    // For now, we'll show it as available if there's no reservation
    return "available";
  }
  return "available";
};

export function FloorPlanPreview({
  restaurantId,
  selectedDate = new Date(),
}: FloorPlanPreviewProps) {
  const navigate = useNavigate();
  const { data: tables = [] } = useRestaurantTables(restaurantId);
  const { data: allReservations = [] } = useActiveReservations(restaurantId); // Use active reservations to exclude cancelled

  // Filter reservations for the selected date - fix timezone issue
  const year = selectedDate.getFullYear();
  const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
  const day = String(selectedDate.getDate()).padStart(2, "0");
  const selectedDateString = `${year}-${month}-${day}`;
  const dayReservations = allReservations.filter(
    (r) => r.reservation_date === selectedDateString
  );

  // Create a map of table reservations for selected date
  const tableReservations = dayReservations.reduce((acc, reservation) => {
    if (reservation.table_id && reservation.status !== "cancelled") {
      acc[reservation.table_id] = reservation;
    }
    return acc;
  }, {} as Record<string, any>);

  // Transform tables data to match component expectations
  const transformedTables = tables.map((table) => {
    const reservation = tableReservations[table.id];
    const displayStatus = getDisplayStatus(table.status, !!reservation);

    // Use the same positioning logic as FloorPlan.tsx but scale for preview
    // Position calculation: (position * 100 + 300) to match FloorPlan scaling
    const floorPlanX = Number(table.position_x || 0) * 100 + 300;
    const floorPlanY = Number(table.position_y || 0) * 100 + 300;

    // Scale down for preview - divide by 6 to fit well in the smaller preview area
    const previewX = floorPlanX / 6;
    const previewY = floorPlanY / 6;

    return {
      id: table.id,
      number: table.table_number,
      seats: table.capacity,
      status: displayStatus,
      x: Math.max(5, Math.min(95, previewX)), // Keep within bounds with margin
      y: Math.max(5, Math.min(95, previewY)), // Keep within bounds with margin
      reservation: reservation
        ? {
            guestName: reservation.customer_name,
            time: reservation.reservation_time,
          }
        : undefined,
    };
  });

  const statusCounts = transformedTables.reduce((acc, table) => {
    acc[table.status] = (acc[table.status] || 0) + 1;
    return acc;
  }, {} as Record<TableStatus, number>);

  return (
    <Card className="bg-gradient-card shadow-elegant">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-foreground">
          Floor Plan
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => {
              const year = selectedDate.getFullYear();
              const month = String(selectedDate.getMonth() + 1).padStart(
                2,
                "0"
              );
              const day = String(selectedDate.getDate()).padStart(2, "0");
              const dateString = `${year}-${month}-${day}`;
              navigate(`/floor-plan?date=${dateString}`);
            }}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Floor Plan Visualization */}
        <div className="relative bg-background/50 border border-border/50 rounded-lg p-4 h-64 overflow-hidden">
          {/* Restaurant Layout Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-background/80 rounded-lg"></div>

          {/* Tables */}
          {transformedTables.map((table) => (
            <div
              key={table.id}
              className={cn(
                "absolute w-8 h-8 rounded border-2 flex items-center justify-center text-xs font-medium text-white cursor-pointer transition-all duration-200 hover:scale-110 shadow-sm",
                getTableColor(table.status)
              )}
              style={{
                left: `${table.x}%`,
                top: `${table.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              title={`${table.number} - ${table.seats} seats - ${table.status}${
                table.reservation ? ` - ${table.reservation.guestName}` : ""
              }`}
            >
              {table.number}
            </div>
          ))}

          {/* Legend */}
          <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm rounded-lg p-2 border border-border/50">
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded border bg-status-available border-status-available"></div>
                <span className="text-muted-foreground">Available</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded border bg-status-occupied border-status-occupied"></div>
                <span className="text-muted-foreground">Occupied</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded border bg-status-reserved border-status-reserved"></div>
                <span className="text-muted-foreground">Reserved</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded border bg-status-cleaning border-status-cleaning"></div>
                <span className="text-muted-foreground">Cleaning</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 rounded-lg bg-status-available/10 border border-status-available/20">
            <div className="text-lg font-bold text-status-available">
              {statusCounts.available || 0}
            </div>
            <div className="text-xs text-muted-foreground">Available</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-status-occupied/10 border border-status-occupied/20">
            <div className="text-lg font-bold text-status-occupied">
              {statusCounts.occupied || 0}
            </div>
            <div className="text-xs text-muted-foreground">Occupied</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-status-reserved/10 border border-status-reserved/20">
            <div className="text-lg font-bold text-status-reserved">
              {statusCounts.reserved || 0}
            </div>
            <div className="text-xs text-muted-foreground">Reserved</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-status-cleaning/10 border border-status-cleaning/20">
            <div className="text-lg font-bold text-status-cleaning">
              {statusCounts.cleaning || 0}
            </div>
            <div className="text-xs text-muted-foreground">Cleaning</div>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full transition-all duration-200 hover:bg-primary/5"
          onClick={() => {
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
            const day = String(selectedDate.getDate()).padStart(2, "0");
            const dateString = `${year}-${month}-${day}`;
            navigate(`/floor-plan?date=${dateString}`);
          }}
        >
          Open Full Floor Plan
        </Button>
      </CardContent>
    </Card>
  );
}
