import { supabase } from "@/integrations/supabase/client";

export interface Table {
  id: string;
  table_number: string;
  capacity: number;
  status: "available" | "occupied" | "reserved" | "cleaning" | "out_of_order";
}

export interface TableCombination {
  tables: Table[];
  totalCapacity: number;
  isExact: boolean;
}

export async function findBestTableAssignment(
  restaurantId: string,
  partySize: number,
  reservationDate: string,
  reservationTime: string
): Promise<{
  assignment: Table[] | null;
  requiresCombination: boolean;
  availableCombinations: TableCombination[];
}> {
  // Get available tables
  const { data: allTables } = await supabase
    .from("restaurant_tables")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true);

  if (!allTables) {
    return {
      assignment: null,
      requiresCombination: false,
      availableCombinations: [],
    };
  }

  // Get existing reservations for this date and time
  const { data: existingReservations } = await supabase
    .from("reservations")
    .select("table_id")
    .eq("restaurant_id", restaurantId)
    .eq("reservation_date", reservationDate)
    .eq("reservation_time", reservationTime)
    .neq("status", "cancelled")
    .not("table_id", "is", null);

  const occupiedTableIds = new Set(
    existingReservations?.map((r) => r.table_id) || []
  );

  // Filter available tables
  const availableTables = allTables.filter(
    (table) => !occupiedTableIds.has(table.id)
  );

  // Try to find exact match first
  const exactMatch = availableTables.find(
    (table) => table.capacity === partySize
  );
  if (exactMatch) {
    return {
      assignment: [exactMatch],
      requiresCombination: false,
      availableCombinations: [],
    };
  }

  // For parties larger than 4, NEVER auto-assign - always require manual confirmation
  if (partySize > 4) {
    const combinations = findTableCombinations(availableTables, partySize);

    if (combinations.length > 0) {
      console.log(
        `Found ${combinations.length} combinations for ${partySize} people (manual assignment required):`,
        combinations.map((c) => ({
          tables: c.tables.map((t) => `${t.table_number}(${t.capacity})`),
          totalCapacity: c.totalCapacity,
          isExact: c.isExact,
        }))
      );

      // Always require manual confirmation for large parties
      return {
        assignment: null,
        requiresCombination: true,
        availableCombinations: combinations,
      };
    }
  }

  // Try to find a single table that can accommodate the party
  const singleTableMatch = availableTables.find(
    (table) => table.capacity >= partySize
  );
  if (singleTableMatch) {
    return {
      assignment: [singleTableMatch],
      requiresCombination: false,
      availableCombinations: [],
    };
  }

  // Find possible combinations (for parties of 4 or fewer that couldn't find a single table)
  const combinations = findTableCombinations(availableTables, partySize);

  if (combinations.length > 0) {
    // Return the best combination (smallest total capacity that fits)
    const bestCombination = combinations.reduce((best, current) => {
      if (current.totalCapacity < best.totalCapacity) {
        return current;
      }
      return best;
    });

    return {
      assignment: bestCombination.tables,
      requiresCombination: true,
      availableCombinations: combinations,
    };
  }

  return {
    assignment: null,
    requiresCombination: false,
    availableCombinations: [],
  };
}

function findTableCombinations(
  tables: Table[],
  targetCapacity: number
): TableCombination[] {
  const combinations: TableCombination[] = [];

  // Try combinations of 2 tables
  for (let i = 0; i < tables.length; i++) {
    for (let j = i + 1; j < tables.length; j++) {
      const table1 = tables[i];
      const table2 = tables[j];
      const totalCapacity = table1.capacity + table2.capacity;

      if (totalCapacity >= targetCapacity) {
        combinations.push({
          tables: [table1, table2],
          totalCapacity,
          isExact: totalCapacity === targetCapacity,
        });
      }
    }
  }

  // Try combinations of 3 tables
  for (let i = 0; i < tables.length; i++) {
    for (let j = i + 1; j < tables.length; j++) {
      for (let k = j + 1; k < tables.length; k++) {
        const table1 = tables[i];
        const table2 = tables[j];
        const table3 = tables[k];
        const totalCapacity =
          table1.capacity + table2.capacity + table3.capacity;

        if (totalCapacity >= targetCapacity) {
          combinations.push({
            tables: [table1, table2, table3],
            totalCapacity,
            isExact: totalCapacity === targetCapacity,
          });
        }
      }
    }
  }

  // Sort by total capacity (prefer smaller combinations)
  return combinations.sort((a, b) => a.totalCapacity - b.totalCapacity);
}

export async function createTableCombinationNotification(
  restaurantId: string,
  reservation: any,
  combinations: TableCombination[]
) {
  const bestCombination = combinations[0];
  const tableNumbers = bestCombination.tables
    .map((t) => t.table_number)
    .join(", ");

  // Serialize combinations for JSON storage
  const serializedCombinations = combinations.slice(0, 3).map((combo) => ({
    table_numbers: combo.tables.map((t) => t.table_number),
    total_capacity: combo.totalCapacity,
    is_exact: combo.isExact,
  }));

  await supabase.from("notifications").insert({
    restaurant_id: restaurantId,
    type: "table_combination_needed",
    title: "Tafel Combinatie Nodig",
    message: `Reservering voor ${reservation.party_size} personen (${reservation.customer_name}) vereist combinatie van tafels: ${tableNumbers}`,
    data: {
      reservation_id: reservation.id,
      customer_name: reservation.customer_name,
      party_size: reservation.party_size,
      reservation_date: reservation.reservation_date,
      reservation_time: reservation.reservation_time,
      suggested_combinations: serializedCombinations,
    },
  });
}
