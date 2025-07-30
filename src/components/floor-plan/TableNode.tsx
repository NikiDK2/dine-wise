import { memo } from "react";
import { Handle, Position, NodeResizer } from "@xyflow/react";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface TableNodeProps {
  data: {
    tableNumber: string;
    capacity: number;
    status: "available" | "occupied" | "reserved" | "cleaning" | "out_of_order";
    reservation?: {
      guestName: string;
      time: string;
    };
    onStatusChange: (status: string) => void;
    onSelect: () => void;
  };
  selected: boolean;
}

const TableNode = memo(({ data, selected }: TableNodeProps) => {
  console.log(`TableNode ${data.tableNumber} render:`, {
    tableNumber: data.tableNumber,
    capacity: data.capacity,
    status: data.status,
    reservation: data.reservation,
    selected: selected,
  });

  const getStatusColor = (status: string) => {
    const color = (() => {
      switch (status) {
        case "available":
          return "bg-green-500 border-green-600";
        case "occupied":
          return "bg-red-500 border-red-600";
        case "reserved":
          return "bg-yellow-500 border-yellow-600";
        case "cleaning":
          return "bg-blue-500 border-blue-600";
        case "out_of_order":
          return "bg-gray-500 border-gray-600";
        default:
          return "bg-gray-300 border-gray-400";
      }
    })();

    console.log(
      `TableNode ${data.tableNumber} status: ${status} -> color: ${color}`
    );
    return color;
  };

  return (
    <div
      className={cn(
        "relative rounded-lg border-2 cursor-pointer transition-all duration-200 min-w-[80px] min-h-[80px] flex flex-col items-center justify-center text-white font-bold text-sm shadow-lg",
        getStatusColor(data.status),
        selected && "ring-4 ring-primary ring-opacity-50 scale-105"
      )}
      onClick={data.onSelect}
    >
      {selected && <NodeResizer minWidth={60} minHeight={60} />}

      <div className="text-center">
        <div className="flex items-center justify-center mb-1">
          <span className="text-base">{data.tableNumber}</span>
        </div>
        <div className="flex items-center justify-center text-xs">
          <Users className="h-3 w-3 mr-1" />
          <span>{data.capacity}</span>
        </div>
        {data.reservation && (
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {data.reservation.guestName} - {data.reservation.time}
          </div>
        )}
      </div>
    </div>
  );
});

TableNode.displayName = "TableNode";

export default TableNode;
