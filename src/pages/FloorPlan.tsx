import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Plus,
  MapPin,
  Save,
  RotateCcw,
  Edit3,
  Check,
  X,
  Clock,
  Users,
  Bug,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useRestaurants } from "@/hooks/useRestaurants";
import {
  useRestaurantTables,
  useUpdateTable,
  useTableStatusSubscription,
} from "@/hooks/useTables";
import { useQueryClient } from "@tanstack/react-query";
import { useActiveReservations } from "@/hooks/useReservations";
import { useDate } from "@/components/layout/DateContext";
import { supabase } from "@/integrations/supabase/client";
import { CreateTableModal } from "@/components/tables/CreateTableModal";
import {
  findBestTableAssignment,
  createTableCombinationNotification,
} from "@/utils/tableAssignment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Node,
  NodeChange,
  Connection,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import TableNode from "@/components/floor-plan/TableNode";
import { TableCombinationModal } from "@/components/floor-plan/TableCombinationModal";

const nodeTypes = {
  table: TableNode,
};

// Dagdelen configuratie
const DAY_PERIODS = {
  MORNING: { start: "08:00", end: "10:30", name: "Ochtend", maxCapacity: 30 },
  LUNCH: { start: "10:30", end: "13:45", name: "Lunch", maxCapacity: 30 },
  EVENING: { start: "13:45", end: "23:00", name: "Avond", maxCapacity: 30 },
};

export default function FloorPlan() {
  const queryClient = useQueryClient();
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isEditingTable, setIsEditingTable] = useState(false);
  const [editingTableData, setEditingTableData] = useState({
    table_number: "",
    capacity: 1,
  });
  const [tableCombination, setTableCombination] = useState<any>(null);
  const [showCombinationModal, setShowCombinationModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("MORNING");
  const [activeCombinations, setActiveCombinations] = useState<Set<string>>(
    new Set()
  );
  const { data: restaurants = [] } = useRestaurants();
  const selectedRestaurant = restaurants[0];
  const { data: tables = [], refetch } = useRestaurantTables(
    selectedRestaurant?.id
  );

  // Get date from URL parameters or use global date
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get("date");
  const combinationParam = searchParams.get("combination");
  const customCombinationParam = searchParams.get("custom-combination");
  const { selectedDate: globalDate } = useDate();
  const selectedDate = dateParam ? new Date(dateParam) : globalDate;

  console.log("FloorPlan date debug:", {
    dateParam,
    globalDate: globalDate?.toISOString(),
    selectedDate: selectedDate?.toISOString(),
    isValidDate: selectedDate instanceof Date && !isNaN(selectedDate.getTime()),
  });

  // Get reservations for the selected date
  const { data: allReservations = [] } = useActiveReservations(
    selectedRestaurant?.id
  );

  // Filter reservations for the selected date and period
  const dayReservations = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    const selectedDateString = `${year}-${month}-${day}`;
    const filtered = allReservations.filter(
      (r) => r.reservation_date === selectedDateString
    );

    console.log("FloorPlan dayReservations debug:", {
      selectedDateString,
      allReservationsCount: allReservations.length,
      filteredCount: filtered.length,
      selectedPeriod,
      allReservations: allReservations.map((r) => ({
        id: r.id,
        date: r.reservation_date,
        table: r.table_id,
        guests: r.party_size,
        status: r.status,
        customer_name: r.customer_name,
        hasTableId: !!r.table_id,
        time: r.reservation_time,
      })),
      filteredReservations: filtered.map((r) => ({
        id: r.id,
        date: r.reservation_date,
        table: r.table_id,
        guests: r.party_size,
        status: r.status,
        customer_name: r.customer_name,
        hasTableId: !!r.table_id,
        time: r.reservation_time,
      })),
      reservationsWithoutTable: filtered.filter((r) => !r.table_id).length,
    });

    return filtered;
  }, [allReservations, selectedDate, selectedPeriod]);

  // Filter reservations by selected period
  const periodReservations = useMemo(() => {
    const period = DAY_PERIODS[selectedPeriod as keyof typeof DAY_PERIODS];
    if (!period) return dayReservations;

    const filtered = dayReservations.filter((reservation) => {
      const reservationTime = reservation.reservation_time;
      if (!reservationTime) return false;

      const time = reservationTime.substring(0, 5); // Get HH:MM part
      const isInPeriod = time >= period.start && time < period.end;
      const isNotCancelled = reservation.status !== "cancelled";

      console.log(
        `Period filter: ${reservation.customer_name} at ${time} (${
          period.start
        }-${period.end}) = ${isInPeriod}, cancelled: ${!isNotCancelled}`
      );

      return isInPeriod && isNotCancelled;
    });

    console.log("Period filtering result:", {
      selectedPeriod,
      periodStart: period.start,
      periodEnd: period.end,
      totalReservations: dayReservations.length,
      filteredReservations: filtered.length,
      reservations: filtered.map((r) => ({
        customer: r.customer_name,
        time: r.reservation_time,
        table: r.table_id,
        guests: r.party_size,
      })),
    });

    return filtered;
  }, [dayReservations, selectedPeriod]);

  // Calculate capacity for each period
  const periodCapacity = useMemo(() => {
    const period = DAY_PERIODS[selectedPeriod as keyof typeof DAY_PERIODS];
    if (!period) return { used: 0, available: 0, total: 0 };

    const usedCapacity = periodReservations.reduce(
      (sum, r) => sum + r.party_size,
      0
    );
    const availableCapacity = period.maxCapacity - usedCapacity;

    return {
      used: usedCapacity,
      available: Math.max(0, availableCapacity),
      total: period.maxCapacity,
    };
  }, [periodReservations, selectedPeriod]);

  // Subscribe to real-time table status updates
  useTableStatusSubscription(selectedRestaurant?.id);
  const updateTable = useUpdateTable();
  const { toast } = useToast();

  // Load active combinations from database when date changes
  useEffect(() => {
    console.log("=== LOADING ACTIVE COMBINATIONS FROM DATABASE ===");

    // Check localStorage for persistent combinations (primary source)
    const dateString = selectedDate.toISOString().split("T")[0];
    const storageKey = `combinations_${dateString}_${selectedPeriod}`;
    console.log("=== LOADING COMBINATIONS ===");
    console.log("Date:", dateString);
    console.log("Period:", selectedPeriod);
    console.log("Storage key:", storageKey);
    console.log("Current activeCombinations size:", activeCombinations.size);
    console.log("Period reservations count:", periodReservations.length);
    const storedCombinations = localStorage.getItem(storageKey);
    console.log("Stored combinations from localStorage:", storedCombinations);

    // First, check if we should clear combinations based on capacity mismatch
    const shouldClearCombinations = () => {
      if (periodReservations.length === 0) return true;

      // If there are stored combinations, check capacity mismatch
      if (storedCombinations) {
        try {
          const storedIds = JSON.parse(storedCombinations);
          const activeCombinationCapacity = storedIds.reduce(
            (total, tableId) => {
              const table = tables.find((t) => t.id === tableId);
              return total + (table?.capacity || 0);
            },
            0
          );

          const reservationCapacity = periodReservations.reduce(
            (total, r) => total + r.party_size,
            0
          );

          console.log("Pre-load capacity check:", {
            activeCombinationCapacity,
            reservationCapacity,
            shouldClear: activeCombinationCapacity !== reservationCapacity,
          });

          return activeCombinationCapacity !== reservationCapacity;
        } catch (error) {
          console.error("Error parsing stored combinations:", error);
          return true;
        }
      }

      return false;
    };

    // Clear combinations if needed
    if (shouldClearCombinations()) {
      console.log(
        "Clearing combinations due to capacity mismatch or no reservations"
      );
      localStorage.removeItem(storageKey);
      setActiveCombinations(new Set());
      return;
    }

    if (storedCombinations) {
      try {
        const storedIds = JSON.parse(storedCombinations);
        console.log("Parsed stored IDs:", storedIds);

        // Use only localStorage combinations as the primary source
        console.log("Using stored combinations as primary source:", storedIds);
        setActiveCombinations(new Set(storedIds));
        console.log(
          "✅ Successfully loaded combinations for period:",
          selectedPeriod
        );
        return;
      } catch (error) {
        console.error("Error parsing stored combinations:", error);
      }
    } else {
      console.log("No stored combinations found for date:", dateString);

      // Fallback: check for tables with reserved status that don't have reservations
      const reservedTablesWithoutReservations = tables.filter((table) => {
        const hasReservation = periodReservations.some(
          (r) => r.table_id === table.id
        );
        return table.status === "reserved" && !hasReservation;
      });

      const reservedTableIds = new Set(
        reservedTablesWithoutReservations.map((t) => t.id)
      );
      console.log(
        "Fallback: Found reserved tables without reservations:",
        reservedTableIds
      );

      // Store these in localStorage for future reference
      if (reservedTableIds.size > 0) {
        const storageKey = `combinations_${dateString}_${selectedPeriod}`;
        localStorage.setItem(
          storageKey,
          JSON.stringify(Array.from(reservedTableIds))
        );
        console.log(
          "Stored fallback combinations in localStorage:",
          Array.from(reservedTableIds)
        );
      }

      setActiveCombinations(reservedTableIds);
    }

    // Cleanup old localStorage entries that don't use the new format
    const cleanupOldStorage = () => {
      const oldKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          key.startsWith("combinations_") &&
          !key.includes("_MORNING") &&
          !key.includes("_LUNCH") &&
          !key.includes("_EVENING")
        ) {
          oldKeys.push(key);
        }
      }

      if (oldKeys.length > 0) {
        console.log("Cleaning up old localStorage keys:", oldKeys);
        oldKeys.forEach((key) => localStorage.removeItem(key));
      }

      // Also clear any combinations for the current date that don't match the current period
      const dateString = selectedDate.toISOString().split("T")[0];
      const currentStorageKey = `combinations_${dateString}_${selectedPeriod}`;

      // Clear any old format combinations for this date
      const oldDateKey = `combinations_${dateString}`;
      if (localStorage.getItem(oldDateKey)) {
        console.log("Cleaning up old date format combination:", oldDateKey);
        localStorage.removeItem(oldDateKey);
      }
    };

    cleanupOldStorage();
  }, [selectedDate, selectedPeriod, tables, periodReservations.length]);

  // Simple combination loading - only one useEffect
  useEffect(() => {
    console.log("=== MAIN COMBINATION LOADING useEffect TRIGGERED ===");
    console.log("Triggered by:", {
      selectedDate: selectedDate.toISOString().split("T")[0],
      selectedPeriod,
      tablesLength: tables.length,
      reservationsLength: periodReservations.length,
    });
    console.log(
      "Current activeCombinations state:",
      Array.from(activeCombinations)
    );
    console.log(
      "All periodReservations:",
      periodReservations.map((r) => ({
        id: r.id,
        customer: r.customer_name,
        party_size: r.party_size,
        table_id: r.table_id,
        status: r.status,
      }))
    );
    console.log(
      "All tables:",
      tables.map((t) => ({
        id: t.id,
        number: t.table_number,
        capacity: t.capacity,
        status: t.status,
      }))
    );

    if (tables.length > 0) {
      const dateString = selectedDate.toISOString().split("T")[0];
      const storageKey = `combinations_${dateString}_${selectedPeriod}`;
      const storedCombinations = localStorage.getItem(storageKey);

      console.log("Storage key:", storageKey);
      console.log("Stored combinations:", storedCombinations);
      console.log(
        "localStorage.getItem result:",
        localStorage.getItem(storageKey)
      );

      if (storedCombinations) {
        try {
          const storedIds = JSON.parse(storedCombinations);
          console.log("Loading combinations:", storedIds);

          // Validate combinations against current reservations
          const totalReservationCapacity = periodReservations.reduce(
            (sum, r) => sum + r.party_size,
            0
          );
          const totalCombinationCapacity = storedIds.reduce((sum, tableId) => {
            const table = tables.find((t) => t.id === tableId);
            return sum + (table ? table.capacity : 0);
          }, 0);

          console.log("=== VALIDATION DETAILS ===");
          console.log("Validation:", {
            totalReservationCapacity,
            totalCombinationCapacity,
            reservationCount: periodReservations.length,
            combinationCount: storedIds.length,
            reservations: periodReservations.map((r) => ({
              customer: r.customer_name,
              party_size: r.party_size,
            })),
            storedIds: storedIds,
            tablesInCombination: storedIds.map((tableId) => {
              const table = tables.find((t) => t.id === tableId);
              return table
                ? {
                    id: table.id,
                    number: table.table_number,
                    capacity: table.capacity,
                  }
                : { id: tableId, number: "NOT_FOUND", capacity: 0 };
            }),
          });

          // SMART VALIDATION: Load combinations if they reasonably match reservations
          const capacityDifference = Math.abs(
            totalCombinationCapacity - totalReservationCapacity
          );
          const isReasonableMatch = capacityDifference <= 2; // Allow small differences

          if (
            totalCombinationCapacity >= totalReservationCapacity &&
            periodReservations.length > 0 &&
            isReasonableMatch
          ) {
            console.log("Combinations are sufficient, loading...");
            setActiveCombinations(new Set(storedIds));

            // Force React Flow to re-render by updating nodes
            setTimeout(() => {
              console.log(
                "Forcing React Flow re-render after loading combinations"
              );
              setNodes((prevNodes) => {
                const newNodes = prevNodes.map((node) => {
                  const table = tables.find((t) => t.id === node.id);
                  if (table) {
                    const reservation = periodReservations.find(
                      (r) => r.table_id === table.id && r.status !== "cancelled"
                    );
                    const isInCombination = storedIds.includes(table.id);

                    const displayStatus =
                      reservation ||
                      (table.status === "reserved" && isInCombination)
                        ? "reserved"
                        : "available";

                    return {
                      ...node,
                      data: {
                        ...node.data,
                        status: displayStatus,
                      },
                    };
                  }
                  return node;
                });
                return newNodes;
              });
            }, 200);
          } else {
            console.log(
              "Combinations insufficient, unreasonable match, or no reservations, clearing..."
            );
            console.log("Reason:", {
              noReservations: periodReservations.length === 0,
              insufficientCapacity:
                totalCombinationCapacity < totalReservationCapacity,
              unreasonableMatch: !isReasonableMatch,
              combinationCapacity: totalCombinationCapacity,
              reservationCapacity: totalReservationCapacity,
              capacityDifference: capacityDifference,
              difference: totalReservationCapacity - totalCombinationCapacity,
            });
            setActiveCombinations(new Set());
            localStorage.removeItem(storageKey);

            // Force React Flow update to clear yellow tables
            setTimeout(() => {
              setNodes((prevNodes) => {
                const newNodes = prevNodes.map((node) => {
                  const table = tables.find((t) => t.id === node.id);
                  if (table) {
                    const reservation = periodReservations.find(
                      (r) => r.table_id === table.id && r.status !== "cancelled"
                    );

                    const displayStatus = reservation
                      ? "reserved"
                      : "available";

                    return {
                      ...node,
                      data: {
                        ...node.data,
                        status: displayStatus,
                      },
                    };
                  }
                  return node;
                });
                return newNodes;
              });
            }, 100);
          }
        } catch (error) {
          console.error("Error loading combinations:", error);
          setActiveCombinations(new Set());
        }
      } else {
        console.log("No combinations found, clearing active combinations");
        setActiveCombinations(new Set());
        if (periodReservations.length === 0) {
          console.log("No reservations exist, clearing localStorage");
          localStorage.removeItem(storageKey);
        }
      }
    }
  }, [selectedDate, selectedPeriod, tables.length, periodReservations]);

  // FIX NAVIGATION ISSUE: Reload combinations when returning to page
  useEffect(() => {
    console.log("=== NAVIGATION FIX: Checking for stored combinations ===");

    if (tables.length > 0 && periodReservations.length > 0) {
      const dateString = selectedDate.toISOString().split("T")[0];
      const storageKey = `combinations_${dateString}_${selectedPeriod}`;
      const storedCombinations = localStorage.getItem(storageKey);

      console.log("Navigation check - Storage key:", storageKey);
      console.log(
        "Navigation check - Stored combinations:",
        storedCombinations
      );
      console.log(
        "Navigation check - Current activeCombinations:",
        Array.from(activeCombinations)
      );
      console.log(
        "Navigation check - Period reservations:",
        periodReservations.map((r) => ({
          customer: r.customer_name,
          party_size: r.party_size,
        }))
      );

      // Check if we have stored combinations but missing active ones OR if active combinations don't match stored ones
      if (storedCombinations) {
        try {
          const storedIds = JSON.parse(storedCombinations);
          const totalReservationCapacity = periodReservations.reduce(
            (sum, r) => sum + r.party_size,
            0
          );
          const totalCombinationCapacity = storedIds.reduce((sum, tableId) => {
            const table = tables.find((t) => t.id === tableId);
            return sum + (table ? table.capacity : 0);
          }, 0);

          console.log("Navigation fix analysis:", {
            storedIds,
            totalReservationCapacity,
            totalCombinationCapacity,
            activeCombinationsSize: activeCombinations.size,
            storedCombinationsSize: storedIds.length,
            capacityDifference: Math.abs(
              totalCombinationCapacity - totalReservationCapacity
            ),
          });

          // Load combinations if they make sense AND if we're missing active combinations OR have unassigned reservations
          const unassignedReservations = periodReservations.filter(
            (r) => !r.table_id
          );
          const totalUnassignedCapacity = unassignedReservations.reduce(
            (sum, r) => sum + r.party_size,
            0
          );

          // Always load combinations if we have them and they have sufficient capacity
          if (totalCombinationCapacity >= totalReservationCapacity) {
            console.log("=== NAVIGATION FIX: Loading combinations ===");
            setActiveCombinations(new Set(storedIds));

            // Force React Flow update
            setTimeout(() => {
              setNodes((prevNodes) => {
                const newNodes = prevNodes.map((node) => {
                  const table = tables.find((t) => t.id === node.id);
                  if (table) {
                    const reservation = periodReservations.find(
                      (r) => r.table_id === table.id && r.status !== "cancelled"
                    );
                    const isInCombination = storedIds.includes(table.id);

                    const displayStatus = reservation
                      ? "reserved"
                      : "available";

                    console.log(
                      `Navigation fix - Table ${
                        table.table_number
                      }: ${displayStatus} (reservation: ${!!reservation}, combination: ${isInCombination})`
                    );

                    return {
                      ...node,
                      data: {
                        ...node.data,
                        status: displayStatus,
                      },
                    };
                  }
                  return node;
                });
                console.log("Navigation fix - React Flow updated");
                return newNodes;
              });
            }, 100);

            toast({
              title: "Combinaties Herladen",
              description: `${storedIds.length} combinaties herladen na navigatie`,
            });
          } else if (totalCombinationCapacity < totalReservationCapacity) {
            console.log(
              "=== NAVIGATION FIX: Combinations insufficient, clearing ==="
            );
            localStorage.removeItem(storageKey);
            setActiveCombinations(new Set());
            toast({
              title: "Oude Combinaties Gewist",
              description: "Combinaties waren niet meer geldig",
            });
          }
        } catch (error) {
          console.error("Navigation fix error:", error);
        }
      }
    }
  }, [tables.length, periodReservations.length, activeCombinations.size]);

  // Force reload combinations when periodReservations change significantly
  useEffect(() => {
    console.log("=== PERIOD RESERVATIONS CHANGED - CHECKING COMBINATIONS ===");
    console.log("Period reservations count:", periodReservations.length);
    console.log("Current active combinations:", Array.from(activeCombinations));

    if (tables.length > 0) {
      const dateString = selectedDate.toISOString().split("T")[0];
      const storageKey = `combinations_${dateString}_${selectedPeriod}`;
      const storedCombinations = localStorage.getItem(storageKey);

      if (storedCombinations) {
        try {
          const storedIds = JSON.parse(storedCombinations);
          const totalReservationCapacity = periodReservations.reduce(
            (sum, r) => sum + r.party_size,
            0
          );
          const totalCombinationCapacity = storedIds.reduce((sum, tableId) => {
            const table = tables.find((t) => t.id === tableId);
            return sum + (table ? table.capacity : 0);
          }, 0);

          console.log("Reservation change validation:", {
            totalReservationCapacity,
            totalCombinationCapacity,
            reservationCount: periodReservations.length,
            combinationCount: storedIds.length,
            reservations: periodReservations.map((r) => ({
              customer: r.customer_name,
              party_size: r.party_size,
            })),
          });

          // ENHANCED VALIDATION: Check if all reservations are covered
          if (periodReservations.length === 0) {
            console.log("No reservations left, clearing all combinations");
            setActiveCombinations(new Set());
            localStorage.removeItem(storageKey);
          } else {
            // Check if we have enough capacity AND if all reservations are covered
            const hasEnoughCapacity =
              totalCombinationCapacity >= totalReservationCapacity;
            const allReservationsCovered = periodReservations.every(
              (reservation) => {
                // Check if this reservation has a table assignment OR if there are enough combination tables
                return (
                  reservation.table_id ||
                  totalCombinationCapacity >= totalReservationCapacity
                );
              }
            );

            console.log("Enhanced validation:", {
              hasEnoughCapacity,
              allReservationsCovered,
              totalCombinationCapacity,
              totalReservationCapacity,
              reservationCount: periodReservations.length,
              combinationCount: storedIds.length,
              reservations: periodReservations.map((r) => ({
                customer: r.customer_name,
                party_size: r.party_size,
                hasTable: !!r.table_id,
              })),
            });

            if (hasEnoughCapacity && allReservationsCovered) {
              console.log(
                "Combinations are sufficient and all reservations covered, reloading..."
              );
              setActiveCombinations(new Set(storedIds));
            } else {
              console.log(
                "Combinations insufficient or not all reservations covered, clearing..."
              );
              console.log("Reason:", {
                insufficientCapacity: !hasEnoughCapacity,
                notAllCovered: !allReservationsCovered,
                capacityDifference:
                  totalReservationCapacity - totalCombinationCapacity,
              });
              console.log("About to clear activeCombinations and localStorage");
              setActiveCombinations(new Set());
              localStorage.removeItem(storageKey);
              console.log("Cleared activeCombinations and localStorage");
            }
          }

          // Force React Flow update
          setTimeout(() => {
            setNodes((prevNodes) => {
              const newNodes = prevNodes.map((node) => {
                const table = tables.find((t) => t.id === node.id);
                if (table) {
                  const reservation = periodReservations.find(
                    (r) => r.table_id === table.id && r.status !== "cancelled"
                  );
                  const isInCombination =
                    periodReservations.length > 0
                      ? storedIds.includes(table.id)
                      : false;

                  const displayStatus =
                    reservation ||
                    (table.status === "reserved" && isInCombination)
                      ? "reserved"
                      : "available";

                  return {
                    ...node,
                    data: {
                      ...node.data,
                      status: displayStatus,
                    },
                  };
                }
                return node;
              });
              return newNodes;
            });
          }, 100);
        } catch (error) {
          console.error(
            "Error checking combinations after reservation change:",
            error
          );
          setActiveCombinations(new Set());
        }
      } else if (
        periodReservations.length === 0 &&
        activeCombinations.size > 0
      ) {
        console.log(
          "No stored combinations but active combinations exist, clearing..."
        );
        setActiveCombinations(new Set());
      }
    }
  }, [periodReservations, tables.length, selectedDate, selectedPeriod]);

  // Force React Flow update when activeCombinations change
  useEffect(() => {
    console.log("=== ACTIVE COMBINATIONS CHANGED - UPDATING REACT FLOW ===");
    console.log("Active combinations:", Array.from(activeCombinations));

    if (tables.length > 0 && nodes.length > 0) {
      setNodes((prevNodes) => {
        const newNodes = prevNodes.map((node) => {
          const table = tables.find((t) => t.id === node.id);
          if (table) {
            const reservation = periodReservations.find(
              (r) => r.table_id === table.id && r.status !== "cancelled"
            );
            const isInCombination = activeCombinations.has(table.id);

            const displayStatus = reservation ? "reserved" : "available";

            console.log(
              `Table ${
                table.table_number
              }: ${displayStatus} (reservation: ${!!reservation}, combination: ${isInCombination})`
            );

            return {
              ...node,
              data: {
                ...node.data,
                status: displayStatus,
              },
            };
          }
          return node;
        });
        return newNodes;
      });
    }
  }, [activeCombinations, tables, periodReservations]);

  // Force reset activeCombinations when period changes
  // DISABLED: This was too aggressive and cleared combinations unnecessarily
  /*
  useEffect(() => {
    console.log("=== PERIOD CHANGE DETECTED ===");
    console.log("Previous period combinations cleared");
    setActiveCombinations(new Set());
  }, [selectedPeriod]);
  */

  // Load active combinations from URL parameters (overrides database loading)
  useEffect(() => {
    if (combinationParam) {
      try {
        const combination = JSON.parse(decodeURIComponent(combinationParam));
        const tableIds = combination.table_numbers
          .map((tableNumber: string) => {
            const table = tables.find((t) => t.table_number === tableNumber);
            return table?.id;
          })
          .filter(Boolean);

        console.log("Loading combinations from URL:", tableIds);
        setActiveCombinations(new Set(tableIds));
        // Force nodes to re-render when combinations change
        setNodes([]);
      } catch (error) {
        console.error("Error parsing combination parameter:", error);
      }
    }
  }, [combinationParam, tables]);

  // Handle table combination from URL parameters
  useEffect(() => {
    if (combinationParam) {
      try {
        const combination = JSON.parse(decodeURIComponent(combinationParam));
        setTableCombination(combination);
        setShowCombinationModal(true);

        toast({
          title: "Tafel Combinatie Geladen",
          description: `Tafels ${combination.table_numbers.join(
            ", "
          )} zijn gecombineerd voor ${combination.total_capacity} plaatsen.`,
        });
      } catch (error) {
        console.error("Error parsing combination parameter:", error);
      }
    } else if (customCombinationParam === "true") {
      setShowCombinationModal(true);

      toast({
        title: "Eigen Combinatie",
        description: "Je kunt nu je eigen tafel combinatie instellen.",
      });
    }
  }, [combinationParam, customCombinationParam, toast]);

  // Auto-assign tables to all reservations without table_id or with unassigned table_id
  // DISABLED: Automatic assignment is now manual only
  /*
  useEffect(() => {
    console.log("=== AUTO ASSIGN EFFECT TRIGGER ===");
    console.log("Day reservations:", dayReservations.length);
    console.log("Tables:", tables.length);
    console.log("Selected period:", selectedPeriod);
    console.log("Period reservations:", periodReservations.length);

    if (dayReservations.length > 0 && tables.length > 0) {
      console.log("=== AUTO ASSIGN TRIGGER ===");
      console.log("Day reservations:", dayReservations.length);
      console.log("Tables:", tables.length);
      console.log("Selected period:", selectedPeriod);
      const reservationsToAssign = dayReservations.filter((r) => {
        if (r.status === "cancelled") return false;

        // Include reservations without table_id
        if (!r.table_id) return true;

        // Include reservations with table_id but where the table is not reserved
        const assignedTable = tables.find((t) => t.id === r.table_id);
        return assignedTable && assignedTable.status !== "reserved";
      });

      console.log("Reservations to assign:", reservationsToAssign.length);
      console.log(
        "Reservations details:",
        reservationsToAssign.map((r) => ({
          id: r.id,
          customer: r.customer_name,
          guests: r.party_size,
          status: r.status,
          time: r.reservation_time,
          table_id: r.table_id,
        }))
      );

      if (reservationsToAssign.length > 0) {
        console.log("=== AUTO ASSIGN DEBUG ===");
        console.log("Auto-assigning reservations:", {
          reservationsToAssign: reservationsToAssign.length,
          totalTables: tables.length,
          totalDayReservations: dayReservations.length,
          availableTables: tables.filter((t) => t.status === "available")
            .length,
          reservedTables: tables.filter((t) => t.status === "reserved").length,
          occupiedTables: tables.filter((t) => t.status === "occupied").length,
          reservations: reservationsToAssign.map((r) => ({
            id: r.id,
            customer: r.customer_name,
            guests: r.party_size,
            status: r.status,
            time: r.reservation_time,
            table_id: r.table_id,
          })),
        });
        console.log(
          "All tables:",
          tables.map((t) => ({
            id: t.id,
            number: t.table_number,
            capacity: t.capacity,
            status: t.status,
          }))
        );

        reservationsToAssign.forEach(async (reservation) => {
          console.log(
            `\n--- Processing reservation ${reservation.id} (${reservation.customer_name}) ---`
          );
          console.log(
            `Party size: ${reservation.party_size}, Time: ${reservation.reservation_time}`
          );

          try {
            // Use the table assignment utility to find the best assignment
            const assignmentResult = await findBestTableAssignment(
              selectedRestaurant.id,
              reservation.party_size,
              reservation.reservation_date,
              reservation.reservation_time
            );

            console.log("Assignment result:", assignmentResult);

            if (
              assignmentResult.assignment &&
              assignmentResult.assignment.length > 0
            ) {
              // Single table or exact match found
              const assignedTables = assignmentResult.assignment;

              console.log(
                `Auto-assigning reservation ${reservation.id} to ${assignedTables.length} table(s):`,
                assignedTables.map((t) => `${t.table_number} (${t.capacity})`)
              );

              // Update the reservation with the first table_id (for single table assignments)
              const { error: reservationError } = await supabase
                .from("reservations")
                .update({ table_id: assignedTables[0].id })
                .eq("id", reservation.id);

              if (reservationError) {
                console.error(
                  "Error auto-assigning table to reservation:",
                  reservationError
                );
              } else {
                // Update all assigned tables to reserved status
                const tableUpdatePromises = assignedTables.map(
                  async (table) => {
                    const { error: tableError } = await supabase
                      .from("restaurant_tables")
                      .update({ status: "reserved" })
                      .eq("id", table.id);

                    if (tableError) {
                      console.error(
                        `Error updating table ${table.table_number} status:`,
                        tableError
                      );
                    } else {
                      console.log(
                        `Successfully marked table ${table.table_number} as reserved`
                      );
                    }
                  }
                );

                await Promise.all(tableUpdatePromises);
                console.log(
                  `Successfully assigned ${assignedTables.length} table(s) to reservation ${reservation.id}`
                );

                // Invalidate queries to refresh the UI
                console.log("Invalidating queries after table assignment...");
                queryClient.invalidateQueries({
                  queryKey: ["restaurant_tables", selectedRestaurant.id],
                });
                queryClient.invalidateQueries({
                  queryKey: ["reservations", selectedRestaurant.id],
                });
                console.log("Queries invalidated");
              }
            } else {
              console.log(
                `No suitable table or combination found for reservation ${reservation.id} with ${reservation.party_size} guests`
              );
            }
          } catch (error) {
            console.error("Error in auto-assignment process:", error);
          }
        });

        // Refresh data after auto-assignment
        console.log("Scheduling refetch in 1 second...");
        setTimeout(() => {
          console.log("Executing refetch...");
          refetch();
        }, 1000);
      }
    }
  }, [dayReservations, tables, refetch]);
  */

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Define handleTableStatusChange before using it in useEffect
  const handleTableStatusChange = useCallback(
    async (tableId: string, newStatus: string) => {
      try {
        await updateTable.mutateAsync({
          id: tableId,
          updates: { status: newStatus as any },
        });
        refetch();
      } catch (error) {
        toast({
          title: "Fout",
          description: "Kon tafelstatus niet bijwerken",
          variant: "destructive",
        });
      }
    },
    [updateTable, refetch, toast]
  );

  // Convert tables to React Flow nodes
  useEffect(() => {
    console.log("=== FLOORPLAN NODES EFFECT DEBUG ===");
    console.log("FloorPlan useEffect debug:", {
      tablesLength: tables.length,
      periodReservationsLength: periodReservations.length,
      selectedTable,
      hasDateParam: !!dateParam,
      selectedPeriod,
      activeCombinationsSize: activeCombinations.size,
    });

    // Force nodes to re-render when important data changes
    if (tables.length === 0) {
      console.log("No tables available, clearing nodes");
      setNodes([]);
      return;
    }
    console.log("Active combinations:", Array.from(activeCombinations));
    console.log(
      "Tables:",
      tables.map((t) => ({
        id: t.id,
        number: t.table_number,
        status: t.status,
      }))
    );
    console.log(
      "Period reservations:",
      periodReservations.map((r) => ({
        id: r.id,
        table_id: r.table_id,
        customer: r.customer_name,
      }))
    );

    if (tables.length > 0) {
      const tableNodes: Node[] = tables.map((table) => {
        // Get reservation for this table in the current period
        const reservation = periodReservations.find(
          (r) => r.table_id === table.id && r.status !== "cancelled"
        );

        console.log(`Table ${table.table_number} (${table.id}) debug:`, {
          tableId: table.id,
          tableNumber: table.table_number,
          tableStatus: table.status,
          reservation: reservation
            ? {
                id: reservation.id,
                customer: reservation.customer_name,
                guests: reservation.party_size,
                status: reservation.status,
                time: reservation.reservation_time,
              }
            : null,
        });

        // Determine display status based on table status and reservations
        let displayStatus = table.status;
        if (table.status === "cleaning") {
          displayStatus = "cleaning";
        } else if (reservation) {
          // Show as reserved if there's an actual reservation
          displayStatus = "reserved";
        } else if (table.status === "occupied") {
          displayStatus = "occupied";
        } else if (
          table.status === "reserved" &&
          activeCombinations.has(table.id)
        ) {
          // Show as reserved if it's part of an active combination
          displayStatus = "reserved";
        } else if (table.status === "reserved") {
          // If table is marked as reserved but not part of active combination, show as available
          displayStatus = "available";
        } else {
          displayStatus = "available";
        }

        console.log(`Table ${table.table_number} final status:`, {
          originalStatus: table.status,
          displayStatus: displayStatus,
          hasReservation: !!reservation,
          isInActiveCombination: activeCombinations.has(table.id),
          reservationDetails: reservation
            ? {
                customer: reservation.customer_name,
                guests: reservation.party_size,
                time: reservation.reservation_time,
              }
            : null,
        });

        return {
          id: table.id,
          type: "table",
          position: {
            x: (table.position_x || 0) * 100 + 100,
            y: (table.position_y || 0) * 100 + 100,
          },
          data: {
            tableNumber: table.table_number,
            capacity: table.capacity,
            status: displayStatus,
            reservation: reservation
              ? {
                  guestName: reservation.customer_name,
                  time: reservation.reservation_time,
                }
              : undefined,
            onStatusChange: (newStatus: string) =>
              handleTableStatusChange(table.id, newStatus),
            onSelect: () => setSelectedTable(table.id),
          },
          selected: selectedTable === table.id,
          style: {
            width: Math.max(80, table.capacity * 20),
            height: Math.max(80, table.capacity * 20),
          },
        };
      });
      console.log("Created table nodes:", tableNodes.length);
      console.log(
        "Node details:",
        tableNodes.map((n) => ({
          id: n.id,
          status: n.data.status,
          reservation: n.data.reservation,
        }))
      );

      // Only set nodes if we have valid nodes
      if (tableNodes.length > 0) {
        console.log("Setting nodes successfully");
        setNodes(tableNodes);
      } else {
        console.log("No valid nodes created, clearing nodes");
        setNodes([]);
      }
    } else {
      console.log("No tables available, setting empty nodes array");
      setNodes([]);
    }
  }, [
    tables,
    selectedTable,
    periodReservations,
    selectedPeriod,
    activeCombinations,
  ]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);

      // Check if position changed
      const hasPositionChange = changes.some(
        (change) => change.type === "position" && change.dragging === false
      );

      if (hasPositionChange) {
        setHasChanges(true);
      }
    },
    [onNodesChange]
  );

  // Handle table edit
  const handleEditTable = (table: any) => {
    setIsEditingTable(true);
    setEditingTableData({
      table_number: table.table_number,
      capacity: table.capacity,
    });
  };

  // Handle save table edit
  const handleSaveTableEdit = async () => {
    if (!selectedTable) return;

    try {
      await updateTable.mutateAsync({
        id: selectedTable,
        updates: {
          table_number: editingTableData.table_number,
          capacity: editingTableData.capacity,
        },
      });
      setIsEditingTable(false);
      toast({
        title: "Tafel Bijgewerkt",
        description: "Tafelgegevens zijn succesvol opgeslagen.",
      });
    } catch (error) {
      toast({
        title: "Fout",
        description: "Kon tafel niet bijwerken",
        variant: "destructive",
      });
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditingTable(false);
    const table = tables.find((t) => t.id === selectedTable);
    if (table) {
      setEditingTableData({
        table_number: table.table_number,
        capacity: table.capacity,
      });
    }
  };

  // Handle save positions
  const handleSavePositions = async () => {
    try {
      console.log("Saving positions for nodes:", nodes.length);
      console.log("Available tables:", tables.length);

      const updatePromises = nodes.map(async (node) => {
        const table = tables.find((t) => t.id === node.id);
        console.log(`Processing node ${node.id}:`, {
          table: !!table,
          position: node.position,
        });

        if (table) {
          const newX = Math.round(((node.position.x - 100) / 100) * 10) / 10;
          const newY = Math.round(((node.position.y - 100) / 100) * 10) / 10;

          console.log(
            `Table ${table.table_number} - Old: (${table.position_x}, ${table.position_y}), New: (${newX}, ${newY})`
          );

          // Always update positions, even if they seem the same
          await updateTable.mutateAsync({
            id: table.id,
            updates: {
              position_x: newX,
              position_y: newY,
            },
          });
          console.log(`Updated table ${table.table_number} position`);
        } else {
          console.log(`No table found for node ${node.id}`);
        }
      });

      await Promise.all(updatePromises);
      setHasChanges(false);
      toast({
        title: "Posities Opgeslagen",
        description: "Alle tafelposities zijn succesvol opgeslagen",
      });
      refetch();
    } catch (error) {
      console.error("Save positions error:", error);
      toast({
        title: "Fout",
        description: `Kon posities niet opslaan: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Handle reset positions
  const handleResetPositions = () => {
    if (tables.length > 0) {
      const resetNodes = tables.map((table) => {
        // Get reservation for this table
        const reservation = periodReservations.find(
          (r) => r.table_id === table.id && r.status !== "cancelled"
        );

        // Determine display status based on table status and reservations
        let displayStatus = table.status;
        if (table.status === "cleaning") {
          displayStatus = "cleaning";
        } else if (reservation) {
          // Show as reserved if there's an actual reservation
          displayStatus = "reserved";
        } else if (table.status === "occupied") {
          displayStatus = "occupied";
        } else if (
          table.status === "reserved" &&
          activeCombinations.has(table.id)
        ) {
          // Show as reserved if it's part of an active combination
          displayStatus = "reserved";
        } else if (table.status === "reserved") {
          // If table is marked as reserved but not part of active combination, show as available
          displayStatus = "available";
        } else {
          displayStatus = "available";
        }

        return {
          id: table.id,
          type: "table",
          position: {
            x: (table.position_x || 0) * 100 + 100,
            y: (table.position_y || 0) * 100 + 100,
          },
          data: {
            tableNumber: table.table_number,
            capacity: table.capacity,
            status: displayStatus,
            reservation: reservation
              ? {
                  guestName: reservation.customer_name,
                  time: reservation.reservation_time,
                }
              : undefined,
            onStatusChange: (newStatus: string) =>
              handleTableStatusChange(table.id, newStatus),
            onSelect: () => setSelectedTable(table.id),
          },
          selected: selectedTable === table.id,
          style: {
            width: Math.max(80, table.capacity * 20),
            height: Math.max(80, table.capacity * 20),
          },
        };
      });
      setNodes(resetNodes);
      setHasChanges(false);
    }
  };

  // Get status statistics
  const getStatusStats = () => {
    const stats = {
      available: 0,
      occupied: 0,
      reserved: 0,
      cleaning: 0,
      out_of_order: 0,
    };

    const reservedTables = [];
    const combinationTables = [];

    tables.forEach((table) => {
      const reservation = periodReservations.find(
        (r) => r.table_id === table.id && r.status !== "cancelled"
      );

      if (table.status === "cleaning") {
        stats.cleaning++;
      } else if (table.status === "out_of_order") {
        stats.out_of_order++;
      } else if (reservation) {
        // Count as reserved if there's an active reservation
        stats.reserved++;
        reservedTables.push({
          table: table.table_number,
          capacity: table.capacity,
          reason: "reservation",
          customer: reservation.customer_name,
          guests: reservation.party_size,
        });
      } else if (
        table.status === "reserved" &&
        activeCombinations.has(table.id) &&
        periodReservations.some((r) => !r.table_id && r.party_size > 4) // Only count for large unassigned reservations
      ) {
        // Count as reserved if it's part of an active combination AND there are large unassigned reservations
        stats.reserved++;
        combinationTables.push({
          table: table.table_number,
          capacity: table.capacity,
          reason: "combination",
        });
      } else if (table.status === "occupied") {
        stats.occupied++;
      } else {
        // All other cases count as available
        stats.available++;
      }
    });

    console.log("Status stats breakdown:", {
      totalReserved: stats.reserved,
      reservedTables,
      combinationTables,
      totalCapacity:
        reservedTables.reduce((sum, t) => sum + t.guests, 0) +
        combinationTables.reduce((sum, t) => sum + t.capacity, 0),
    });

    return stats;
  };

  const statusStats = getStatusStats();
  const totalCapacity = tables.reduce((sum, table) => sum + table.capacity, 0);
  const selectedTableData = selectedTable
    ? tables.find((t) => t.id === selectedTable)
    : null;

  // Handle apply table combination
  const handleApplyTableCombination = async (
    selectedTables: string[],
    totalCapacity: number
  ) => {
    console.log("=== TABLE COMBINATION DEBUG START ===");
    console.log("Selected tables:", selectedTables);
    console.log("Total capacity:", totalCapacity);
    console.log("Current restaurant ID:", selectedRestaurant.id);

    try {
      console.log("Starting table updates...");

      // Update all selected tables to be part of the combination
      const updatePromises = selectedTables.map(async (tableId) => {
        console.log(`Updating table ${tableId} to reserved status`);
        const result = await updateTable.mutateAsync({
          id: tableId,
          updates: {
            status: "reserved",
          },
        });
        console.log(`Table ${tableId} update result:`, result);
        return result;
      });

      console.log("Waiting for all table updates to complete...");
      const updateResults = await Promise.all(updatePromises);
      console.log("All table updates completed:", updateResults);

      // Track the combination in state
      setActiveCombinations((prev) => {
        const newSet = new Set(prev);
        selectedTables.forEach((tableId) => newSet.add(tableId));
        console.log("Updated activeCombinations:", Array.from(newSet));
        return newSet;
      });

      // Store combinations in localStorage for persistence (per date and period)
      const dateString = selectedDate.toISOString().split("T")[0];
      const storageKey = `combinations_${dateString}_${selectedPeriod}`;
      console.log("Storing combinations for date and period:", storageKey);
      console.log("Selected tables to store:", selectedTables);

      const storedCombinations = localStorage.getItem(storageKey);
      console.log("Existing stored combinations:", storedCombinations);

      let existingCombinations = [];
      if (storedCombinations) {
        try {
          existingCombinations = JSON.parse(storedCombinations);
          console.log("Parsed existing combinations:", existingCombinations);
        } catch (error) {
          console.error("Error parsing stored combinations:", error);
        }
      }

      // MERGE with existing combinations instead of replacing
      const allCombinations = [
        ...new Set([...existingCombinations, ...selectedTables]),
      ];
      console.log("All combinations to store (merged):", allCombinations);
      console.log("Combination breakdown:", {
        existing: existingCombinations,
        new: selectedTables,
        merged: allCombinations,
      });

      localStorage.setItem(storageKey, JSON.stringify(allCombinations));
      console.log(
        "Successfully stored combinations in localStorage:",
        allCombinations
      );

      console.log("Invalidating query caches...");
      // Invalidate queries to refresh the UI
      await queryClient.invalidateQueries({
        queryKey: ["restaurant_tables", selectedRestaurant.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["reservations", selectedRestaurant.id],
      });
      console.log("Query caches invalidated");

      // Force immediate state update for UI with ALL combinations
      console.log("Forcing immediate state update with ALL combinations...");
      setActiveCombinations(new Set(allCombinations));
      console.log(
        "Final activeCombinations state:",
        Array.from(allCombinations)
      );

      // Force React Flow to re-render immediately with ALL combinations
      setTimeout(() => {
        console.log("Forcing React Flow re-render after applying combination");
        setNodes((prevNodes) => {
          const newNodes = prevNodes.map((node) => {
            const table = tables.find((t) => t.id === node.id);
            if (table) {
              const reservation = periodReservations.find(
                (r) => r.table_id === table.id && r.status !== "cancelled"
              );
              const isInCombination = allCombinations.includes(table.id);

              const displayStatus = reservation ? "reserved" : "available";

              console.log(
                `Table ${
                  table.table_number
                }: ${displayStatus} (reservation: ${!!reservation}, combination: ${isInCombination})`
              );

              return {
                ...node,
                data: {
                  ...node.data,
                  status: displayStatus,
                },
              };
            }
            return node;
          });
          console.log(
            "React Flow updated with ALL combinations:",
            allCombinations
          );
          return newNodes;
        });
      }, 100);

      console.log("Refreshing data...");
      // Refresh data
      await refetch();
      console.log("Data refreshed");

      console.log("Current tables after update:");
      console.log(
        tables.map((t) => ({
          id: t.id,
          number: t.table_number,
          status: t.status,
          capacity: t.capacity,
        }))
      );

      toast({
        title: "Combinatie Toegepast",
        description: `Tafel combinatie van ${selectedTables.length} tafels met ${totalCapacity} plaatsen is succesvol toegepast.`,
      });

      // Clear the combination state
      setTableCombination(null);
      setShowCombinationModal(false);

      console.log("=== TABLE COMBINATION DEBUG END ===");
      console.log("=== FINAL STATE VERIFICATION ===");
      console.log("Final activeCombinations:", Array.from(activeCombinations));
      console.log(
        "Final localStorage content:",
        localStorage.getItem(
          `combinations_${
            selectedDate.toISOString().split("T")[0]
          }_${selectedPeriod}`
        )
      );
      console.log(
        "Final periodReservations:",
        periodReservations.map((r) => ({
          customer: r.customer_name,
          party_size: r.party_size,
        }))
      );
      console.log(
        "Final tables status:",
        tables.map((t) => ({
          number: t.table_number,
          status: t.status,
          capacity: t.capacity,
        }))
      );
    } catch (error) {
      console.error("Error in handleApplyTableCombination:", error);
      toast({
        title: "Fout",
        description: "Kon tafel combinatie niet toepassen",
        variant: "destructive",
      });
    }
  };

  // Reset all table combinations
  const handleResetCombinations = async () => {
    try {
      console.log("=== RESETTING ALL COMBINATIONS ===");

      // Find all tables with reserved status that don't have reservations
      const reservedTablesWithoutReservations = tables.filter((table) => {
        const hasReservation = periodReservations.some(
          (r) => r.table_id === table.id
        );
        return table.status === "reserved" && !hasReservation;
      });

      console.log(
        "Resetting tables:",
        reservedTablesWithoutReservations.map((t) => t.table_number)
      );

      // Update all these tables to available status
      const updatePromises = reservedTablesWithoutReservations.map(
        async (table) => {
          const result = await updateTable.mutateAsync({
            id: table.id,
            updates: {
              status: "available",
            },
          });
          return result;
        }
      );

      await Promise.all(updatePromises);

      // Clear active combinations
      setActiveCombinations(new Set());

      // Clear localStorage combinations for this date and period
      const dateString = selectedDate.toISOString().split("T")[0];
      const storageKey = `combinations_${dateString}_${selectedPeriod}`;
      localStorage.removeItem(storageKey);
      console.log(
        "Cleared combinations from localStorage for date and period:",
        storageKey
      );

      toast({
        title: "Combinaties Gereset",
        description: "Alle tafel combinaties zijn gereset naar beschikbaar.",
      });
    } catch (error) {
      console.error("Error resetting combinations:", error);
      toast({
        title: "Fout",
        description: "Kon combinaties niet resetten",
        variant: "destructive",
      });
    }
  };

  // Manual auto-assign function
  const handleAutoAssignTables = async () => {
    try {
      console.log("=== AUTO ASSIGN DEBUG START ===");
      console.log("Current date:", selectedDate);
      console.log("Selected period:", selectedPeriod);
      console.log("Total reservations for period:", periodReservations.length);
      console.log("Total tables:", tables.length);

      const reservationsWithoutTable = periodReservations.filter(
        (r) => !r.table_id
      );

      console.log(
        "Reservations without table:",
        reservationsWithoutTable.length
      );
      console.log(
        "All reservations for period:",
        periodReservations.map((r) => ({
          id: r.id,
          customer: r.customer_name,
          guests: r.party_size,
          table_id: r.table_id,
          time: r.reservation_time,
          status: r.status,
        }))
      );

      console.log(
        "All tables:",
        tables.map((t) => ({
          id: t.id,
          number: t.table_number,
          capacity: t.capacity,
          status: t.status,
          position_x: t.position_x,
          position_y: t.position_y,
        }))
      );

      console.log("Table status breakdown:", {
        available: tables.filter((t) => t.status === "available").length,
        reserved: tables.filter((t) => t.status === "reserved").length,
        occupied: tables.filter((t) => t.status === "occupied").length,
        cleaning: tables.filter((t) => t.status === "cleaning").length,
        out_of_order: tables.filter((t) => t.status === "out_of_order").length,
      });

      if (reservationsWithoutTable.length === 0) {
        toast({
          title: "Geen actie nodig",
          description: "Alle reserveringen hebben al een tafel toegewezen.",
        });
        return;
      }

      let assignedCount = 0;

      // Try to assign each reservation to a suitable table
      for (const reservation of reservationsWithoutTable) {
        console.log(`\n--- Processing reservation ${reservation.id} ---`);
        console.log(`Reservation details:`, {
          customer: reservation.customer_name,
          guests: reservation.party_size,
          time: reservation.reservation_time,
          status: reservation.status,
        });

        // Find all tables that could potentially fit
        const potentialTables = tables.filter(
          (t) => t.capacity >= reservation.party_size
        );
        console.log(
          `Potential tables (capacity >= ${reservation.party_size}):`,
          potentialTables.map((t) => ({
            id: t.id,
            number: t.table_number,
            capacity: t.capacity,
            status: t.status,
          }))
        );

        // Find tables that are not already assigned
        const unassignedTables = potentialTables.filter(
          (t) => !periodReservations.some((r) => r.table_id === t.id)
        );
        console.log(
          `Unassigned tables:`,
          unassignedTables.map((t) => ({
            id: t.id,
            number: t.table_number,
            capacity: t.capacity,
            status: t.status,
          }))
        );

        // For large parties (>4), try to find table combinations
        if (reservation.party_size > 4) {
          console.log(
            `🔍 Looking for table combinations for ${reservation.party_size} people`
          );

          // Use the table assignment utility to find combinations
          const assignmentResult = await findBestTableAssignment(
            selectedRestaurant.id,
            reservation.party_size,
            selectedDate.toISOString().split("T")[0],
            reservation.reservation_time
          );

          if (assignmentResult.availableCombinations.length > 0) {
            console.log(
              `✅ Found ${assignmentResult.availableCombinations.length} combinations for ${reservation.party_size} people`
            );

            // Create notification for manual combination
            await createTableCombinationNotification(
              selectedRestaurant.id,
              {
                id: reservation.id,
                customer_name: reservation.customer_name,
                party_size: reservation.party_size,
                reservation_date: selectedDate,
                reservation_time: reservation.reservation_time,
              },
              assignmentResult.availableCombinations
            );

            console.log(`📢 Created notification for manual table combination`);
            continue; // Skip to next reservation
          } else {
            console.log(
              `❌ No combinations found for ${reservation.party_size} people`
            );
          }
        }

        // Find a single table that fits the party size and is not already assigned to another reservation
        const suitableTable = tables.find(
          (t) =>
            t.capacity >= reservation.party_size &&
            !periodReservations.some(
              (r) => r.table_id === t.id && r.id !== reservation.id
            )
        );

        if (suitableTable) {
          console.log(
            `✅ Found suitable table: ${suitableTable.table_number} (capacity: ${suitableTable.capacity}, status: ${suitableTable.status})`
          );

          try {
            // Update the reservation with table_id
            const { error: reservationError } = await supabase
              .from("reservations")
              .update({ table_id: suitableTable.id })
              .eq("id", reservation.id);

            if (reservationError) {
              console.error(
                "❌ Error assigning table to reservation:",
                reservationError
              );
            } else {
              // Update table status to reserved
              const { error: tableError } = await supabase
                .from("restaurant_tables")
                .update({ status: "reserved" })
                .eq("id", suitableTable.id);

              if (tableError) {
                console.error("❌ Error updating table status:", tableError);
              } else {
                assignedCount++;
                console.log(
                  `✅ Successfully assigned table ${suitableTable.table_number} to reservation ${reservation.id} and marked as reserved`
                );
              }
            }
          } catch (error) {
            console.error("❌ Error in assignment process:", error);
          }
        } else {
          console.log(
            `❌ No suitable table found for reservation ${reservation.id} with ${reservation.party_size} guests`
          );
          console.log(
            `Available tables:`,
            tables
              .filter((t) => t.status === "available")
              .map((t) => ({
                number: t.table_number,
                capacity: t.capacity,
              }))
          );
        }
      }

      // Refresh data
      refetch();

      console.log("=== AUTO ASSIGN DEBUG END ===");
      console.log(`Final result: ${assignedCount} tables assigned`);

      if (assignedCount > 0) {
        toast({
          title: "Tafels Toegewezen",
          description: `${assignedCount} reserveringen hebben een tafel gekregen.`,
        });
      } else {
        toast({
          title: "Geen geschikte tafels",
          description:
            "Er zijn geen geschikte tafels beschikbaar voor de reserveringen.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in handleAutoAssignTables:", error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het toewijzen van tafels.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Plattegrond
                  {dateParam && (
                    <span className="text-lg font-normal text-muted-foreground ml-2">
                      -{" "}
                      {selectedDate.toLocaleDateString("nl-NL", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year:
                          selectedDate.getFullYear() !==
                          new Date().getFullYear()
                            ? "numeric"
                            : undefined,
                      })}
                    </span>
                  )}
                </h1>
                <p className="text-muted-foreground">
                  Sleep tafels om de plattegrond aan te passen
                  {dateParam && (
                    <span className="ml-1">
                      • {periodReservations.length} reserveringen voor{" "}
                      {
                        DAY_PERIODS[selectedPeriod as keyof typeof DAY_PERIODS]
                          ?.name
                      }
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {hasChanges && (
                  <>
                    <Button variant="outline" onClick={handleResetPositions}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                    <Button onClick={handleSavePositions}>
                      <Save className="h-4 w-4 mr-2" />
                      Posities Opslaan
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={handleAutoAssignTables}
                  className="bg-blue-50 hover:bg-blue-100"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Tafels Auto-Toewijzen
                </Button>
                <Button
                  variant="outline"
                  onClick={handleResetCombinations}
                  className="bg-red-50 hover:bg-red-100"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Combinaties Resetten
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("=== DEBUG CURRENT STATE ===");
                    console.log("Selected period:", selectedPeriod);
                    console.log(
                      "Active combinations:",
                      Array.from(activeCombinations)
                    );

                    // Debug all reservations
                    console.log(
                      "ALL Period reservations:",
                      periodReservations.map((r) => ({
                        id: r.id,
                        table_id: r.table_id,
                        customer: r.customer_name,
                        party_size: r.party_size,
                        status: r.status,
                        time: r.reservation_time,
                      }))
                    );

                    // Debug large party reservations specifically
                    const largePartyReservations = periodReservations.filter(
                      (r) => r.party_size > 4
                    );
                    console.log(
                      "LARGE PARTY reservations (>4 people):",
                      largePartyReservations.map((r) => ({
                        id: r.id,
                        table_id: r.table_id,
                        customer: r.customer_name,
                        party_size: r.party_size,
                        status: r.status,
                        time: r.reservation_time,
                        hasTable: !!r.table_id,
                      }))
                    );

                    // Debug reservations without table assignment OR not covered by combinations
                    const unassignedReservations = periodReservations.filter(
                      (r) => {
                        // If has table_id, it's assigned
                        if (r.table_id) return false;

                        // If no table_id, check if it's covered by active combinations
                        const totalCombinationCapacity = Array.from(
                          activeCombinations
                        ).reduce((sum, tableId) => {
                          const table = tables.find((t) => t.id === tableId);
                          return sum + (table ? table.capacity : 0);
                        }, 0);

                        const totalReservationCapacity =
                          periodReservations.reduce(
                            (sum, res) => sum + res.party_size,
                            0
                          );

                        // If combinations have enough capacity for all reservations, consider it assigned
                        return (
                          totalCombinationCapacity < totalReservationCapacity
                        );
                      }
                    );
                    console.log(
                      "UNASSIGNED reservations (no table_id):",
                      unassignedReservations.map((r) => ({
                        id: r.id,
                        table_id: r.table_id,
                        customer: r.customer_name,
                        party_size: r.party_size,
                        status: r.status,
                        time: r.reservation_time,
                      }))
                    );

                    console.log(
                      "Tables status:",
                      tables.map((t) => ({
                        id: t.id,
                        number: t.table_number,
                        capacity: t.capacity,
                        status: t.status,
                        hasReservation: periodReservations.some(
                          (r) => r.table_id === t.id
                        ),
                        inActiveCombination: activeCombinations.has(t.id),
                      }))
                    );

                    const yellowTables = tables.filter((t) => {
                      const reservation = periodReservations.find(
                        (r) => r.table_id === t.id && r.status !== "cancelled"
                      );
                      return (
                        reservation ||
                        (t.status === "reserved" &&
                          activeCombinations.has(t.id))
                      );
                    });

                    console.log(
                      "Yellow tables:",
                      yellowTables.map((t) => ({
                        number: t.table_number,
                        capacity: t.capacity,
                        status: t.status,
                        hasReservation: periodReservations.some(
                          (r) => r.table_id === t.id
                        ),
                        inActiveCombination: activeCombinations.has(t.id),
                      }))
                    );

                    // Calculate total capacity
                    const totalCapacity = periodReservations.reduce(
                      (sum, r) => sum + r.party_size,
                      0
                    );
                    const yellowCapacity = yellowTables.reduce(
                      (sum, t) => sum + t.capacity,
                      0
                    );
                    const capacitySummary = {
                      totalReservations: periodReservations.length,
                      totalCapacity: totalCapacity,
                      yellowTables: yellowTables.length,
                      yellowCapacity: yellowCapacity,
                      difference: totalCapacity - yellowCapacity,
                    };
                    console.log("CAPACITY SUMMARY:", capacitySummary);

                    // Show toast with summary
                    toast({
                      title: "Debug Status",
                      description: `Reserveringen: ${capacitySummary.totalReservations} (${capacitySummary.totalCapacity} personen) | Gele tafels: ${capacitySummary.yellowTables} (${capacitySummary.yellowCapacity} personen) | Verschil: ${capacitySummary.difference}`,
                      duration: 5000,
                    });

                    // Show detailed breakdown of the 4-person difference
                    if (capacitySummary.difference > 0) {
                      const unassignedReservations = periodReservations.filter(
                        (r) => {
                          // If has table_id, it's assigned
                          if (r.table_id) return false;

                          // If no table_id, check if it's covered by active combinations
                          const totalCombinationCapacity = Array.from(
                            activeCombinations
                          ).reduce((sum, tableId) => {
                            const table = tables.find((t) => t.id === tableId);
                            return sum + (table ? table.capacity : 0);
                          }, 0);

                          const totalReservationCapacity =
                            periodReservations.reduce(
                              (sum, res) => sum + res.party_size,
                              0
                            );

                          // If combinations have enough capacity for all reservations, consider it assigned
                          return (
                            totalCombinationCapacity < totalReservationCapacity
                          );
                        }
                      );
                      const assignedReservations = periodReservations.filter(
                        (r) => r.table_id
                      );

                      console.log("DETAILED BREAKDOWN:", {
                        unassignedReservations: unassignedReservations.map(
                          (r) => ({
                            customer: r.customer_name,
                            party_size: r.party_size,
                            time: r.reservation_time,
                          })
                        ),
                        assignedReservations: assignedReservations.map((r) => ({
                          customer: r.customer_name,
                          party_size: r.party_size,
                          table_id: r.table_id,
                          time: r.reservation_time,
                        })),
                      });

                      alert(
                        `DETAILED BREAKDOWN:\n\nNiet-toegewezen reserveringen (${
                          capacitySummary.difference
                        } personen):\n${unassignedReservations
                          .map(
                            (r) =>
                              `${r.customer_name}: ${r.party_size} personen`
                          )
                          .join(
                            "\n"
                          )}\n\nToegewezen reserveringen:\n${assignedReservations
                          .map(
                            (r) =>
                              `${r.customer_name}: ${r.party_size} personen (tafel ${r.table_id})`
                          )
                          .join("\n")}`
                      );
                    }

                    // Debug active combinations state
                    console.log("ACTIVE COMBINATIONS DEBUG:", {
                      activeCombinationsSize: activeCombinations.size,
                      activeCombinationsArray: Array.from(activeCombinations),
                      tablesInCombinations: tables
                        .filter((t) => activeCombinations.has(t.id))
                        .map((t) => ({
                          id: t.id,
                          number: t.table_number,
                          status: t.status,
                          capacity: t.capacity,
                        })),
                    });

                    // Show detailed alert for large party reservations
                    if (largePartyReservations.length > 0) {
                      const largePartyInfo = largePartyReservations
                        .map(
                          (r) =>
                            `${r.customer_name}: ${r.party_size} personen${
                              r.table_id ? " (heeft tafel)" : " (geen tafel)"
                            }`
                        )
                        .join("\n");

                      alert(`GROTE GROEPEN (>4 personen):\n${largePartyInfo}`);
                    }

                    // Show detailed alert for unassigned reservations
                    if (unassignedReservations.length > 0) {
                      const unassignedInfo = unassignedReservations
                        .map(
                          (r) => `${r.customer_name}: ${r.party_size} personen`
                        )
                        .join("\n");

                      alert(
                        `NIET-TOEGEWEZEN RESERVERINGEN:\n${unassignedInfo}`
                      );
                    }
                  }}
                  className="bg-blue-50 hover:bg-blue-100 border-2 border-blue-300"
                >
                  <Bug className="h-4 w-4 mr-2" />
                  Debug Status
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("=== FORCE LOAD COMBINATIONS ===");
                    const dateString = selectedDate.toISOString().split("T")[0];
                    const storageKey = `combinations_${dateString}_${selectedPeriod}`;
                    const storedCombinations = localStorage.getItem(storageKey);

                    console.log("Storage key:", storageKey);
                    console.log("Stored combinations:", storedCombinations);

                    if (storedCombinations) {
                      try {
                        const storedIds = JSON.parse(storedCombinations);
                        console.log("Force loading combinations:", storedIds);
                        setActiveCombinations(new Set(storedIds));
                        toast({
                          title: "Combinaties Geladen",
                          description: `${storedIds.length} combinaties geladen voor ${selectedPeriod}`,
                        });
                      } catch (error) {
                        console.error("Error loading combinations:", error);
                        toast({
                          title: "Fout",
                          description: "Kon combinaties niet laden",
                          variant: "destructive",
                        });
                      }
                    } else {
                      console.log("No combinations found in localStorage");
                      toast({
                        title: "Geen Combinaties",
                        description: `Geen combinaties gevonden voor ${selectedPeriod}`,
                      });
                    }
                  }}
                  className="bg-green-50 hover:bg-green-100"
                >
                  🔄 Force Load
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("=== SYNC COMBINATIONS ===");
                    const dateString = selectedDate.toISOString().split("T")[0];
                    const storageKey = `combinations_${dateString}_${selectedPeriod}`;
                    const storedCombinations = localStorage.getItem(storageKey);

                    console.log(
                      "Current activeCombinations:",
                      Array.from(activeCombinations)
                    );
                    console.log("Stored combinations:", storedCombinations);

                    if (storedCombinations) {
                      try {
                        const storedIds = JSON.parse(storedCombinations);
                        console.log("Stored IDs:", storedIds);

                        // Force sync with localStorage
                        setActiveCombinations(new Set(storedIds));

                        // Force React Flow update
                        setTimeout(() => {
                          setNodes((prevNodes) => {
                            const newNodes = prevNodes.map((node) => {
                              const table = tables.find(
                                (t) => t.id === node.id
                              );
                              if (table) {
                                const reservation = periodReservations.find(
                                  (r) =>
                                    r.table_id === table.id &&
                                    r.status !== "cancelled"
                                );
                                const isInCombination = storedIds.includes(
                                  table.id
                                );

                                const displayStatus =
                                  reservation ||
                                  (table.status === "reserved" &&
                                    isInCombination)
                                    ? "reserved"
                                    : "available";

                                return {
                                  ...node,
                                  data: {
                                    ...node.data,
                                    status: displayStatus,
                                  },
                                };
                              }
                              return node;
                            });
                            return newNodes;
                          });
                        }, 100);

                        const totalCombinationCapacity = storedIds.reduce(
                          (sum, tableId) => {
                            const table = tables.find((t) => t.id === tableId);
                            return sum + (table ? table.capacity : 0);
                          },
                          0
                        );

                        toast({
                          title: "Combinaties Gesynchroniseerd",
                          description: `${storedIds.length} combinaties (${totalCombinationCapacity} personen) gesynchroniseerd`,
                        });
                      } catch (error) {
                        console.error("Error syncing combinations:", error);
                        toast({
                          title: "Fout",
                          description: "Kon combinaties niet synchroniseren",
                          variant: "destructive",
                        });
                      }
                    } else {
                      console.log("No stored combinations found");
                      toast({
                        title: "Geen Combinaties",
                        description:
                          "Geen combinaties gevonden in localStorage",
                      });
                    }
                  }}
                  className="bg-purple-50 hover:bg-purple-100"
                >
                  🔄 Sync Combinaties
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("=== VALIDATE COMBINATIONS ===");
                    const dateString = selectedDate.toISOString().split("T")[0];
                    const storageKey = `combinations_${dateString}_${selectedPeriod}`;
                    const storedCombinations = localStorage.getItem(storageKey);

                    console.log(
                      "Current reservations:",
                      periodReservations.map((r) => ({
                        customer: r.customer_name,
                        party_size: r.party_size,
                      }))
                    );
                    console.log(
                      "Current activeCombinations:",
                      Array.from(activeCombinations)
                    );

                    if (storedCombinations) {
                      try {
                        const storedIds = JSON.parse(storedCombinations);
                        const totalReservationCapacity =
                          periodReservations.reduce(
                            (sum, r) => sum + r.party_size,
                            0
                          );
                        const totalCombinationCapacity = storedIds.reduce(
                          (sum, tableId) => {
                            const table = tables.find((t) => t.id === tableId);
                            return sum + (table ? table.capacity : 0);
                          },
                          0
                        );

                        console.log("Validation Results:", {
                          storedIds,
                          totalReservationCapacity,
                          totalCombinationCapacity,
                          isValid:
                            totalCombinationCapacity >=
                              totalReservationCapacity &&
                            periodReservations.length > 0,
                        });

                        if (
                          totalCombinationCapacity >=
                            totalReservationCapacity &&
                          periodReservations.length > 0
                        ) {
                          toast({
                            title: "Combinaties Geldig",
                            description: `Capaciteit: ${totalCombinationCapacity} personen, Reserveringen: ${totalReservationCapacity} personen`,
                          });
                        } else {
                          toast({
                            title: "Combinaties Ongeldig",
                            description: `Capaciteit: ${totalCombinationCapacity} personen, Reserveringen: ${totalReservationCapacity} personen`,
                            variant: "destructive",
                          });
                        }
                      } catch (error) {
                        console.error("Error validating combinations:", error);
                      }
                    } else {
                      toast({
                        title: "Geen Combinaties",
                        description:
                          "Geen combinaties gevonden in localStorage",
                      });
                    }
                  }}
                  className="bg-yellow-50 hover:bg-yellow-100"
                >
                  🔍 Valideer Combinaties
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log(
                      "=== FORCE RELOAD AFTER RESERVATION CHANGES ==="
                    );
                    console.log(
                      "Current period reservations:",
                      periodReservations.map((r) => ({
                        customer: r.customer_name,
                        party_size: r.party_size,
                      }))
                    );
                    console.log(
                      "Current active combinations:",
                      Array.from(activeCombinations)
                    );

                    const dateString = selectedDate.toISOString().split("T")[0];
                    const storageKey = `combinations_${dateString}_${selectedPeriod}`;
                    const storedCombinations = localStorage.getItem(storageKey);

                    if (storedCombinations) {
                      try {
                        const storedIds = JSON.parse(storedCombinations);
                        const totalReservationCapacity =
                          periodReservations.reduce(
                            (sum, r) => sum + r.party_size,
                            0
                          );
                        const totalCombinationCapacity = storedIds.reduce(
                          (sum, tableId) => {
                            const table = tables.find((t) => t.id === tableId);
                            return sum + (table ? table.capacity : 0);
                          },
                          0
                        );

                        console.log("Force reload validation:", {
                          totalReservationCapacity,
                          totalCombinationCapacity,
                          reservationCount: periodReservations.length,
                          combinationCount: storedIds.length,
                        });

                        if (periodReservations.length === 0) {
                          console.log(
                            "No reservations, clearing all combinations"
                          );
                          setActiveCombinations(new Set());
                          localStorage.removeItem(storageKey);
                          toast({
                            title: "Combinaties Gewist",
                            description:
                              "Geen reserveringen meer, alle combinaties gewist",
                          });
                        } else if (
                          totalCombinationCapacity >= totalReservationCapacity
                        ) {
                          console.log("Reloading valid combinations");
                          setActiveCombinations(new Set(storedIds));
                          toast({
                            title: "Combinaties Herladen",
                            description: `${storedIds.length} combinaties herladen voor ${totalReservationCapacity} personen`,
                          });
                        } else {
                          console.log("Invalid combinations, clearing");
                          setActiveCombinations(new Set());
                          localStorage.removeItem(storageKey);
                          toast({
                            title: "Ongeldige Combinaties",
                            description:
                              "Combinaties gewist vanwege capaciteit mismatch",
                            variant: "destructive",
                          });
                        }

                        // Force React Flow update
                        setTimeout(() => {
                          setNodes((prevNodes) => {
                            const newNodes = prevNodes.map((node) => {
                              const table = tables.find(
                                (t) => t.id === node.id
                              );
                              if (table) {
                                const reservation = periodReservations.find(
                                  (r) =>
                                    r.table_id === table.id &&
                                    r.status !== "cancelled"
                                );
                                const isInCombination =
                                  periodReservations.length > 0
                                    ? storedIds.includes(table.id)
                                    : false;

                                const displayStatus =
                                  reservation ||
                                  (table.status === "reserved" &&
                                    isInCombination)
                                    ? "reserved"
                                    : "available";

                                return {
                                  ...node,
                                  data: {
                                    ...node.data,
                                    status: displayStatus,
                                  },
                                };
                              }
                              return node;
                            });
                            return newNodes;
                          });
                        }, 100);
                      } catch (error) {
                        console.error(
                          "Error force reloading combinations:",
                          error
                        );
                        toast({
                          title: "Fout",
                          description: "Kon combinaties niet herladen",
                          variant: "destructive",
                        });
                      }
                    } else {
                      console.log("No stored combinations found");
                      setActiveCombinations(new Set());
                      toast({
                        title: "Geen Combinaties",
                        description:
                          "Geen combinaties gevonden in localStorage",
                      });
                    }
                  }}
                  className="bg-blue-50 hover:bg-blue-100"
                >
                  🔄 Herlaad na Wijzigingen
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("=== FORCE CLEAR ALL COMBINATIONS ===");
                    const dateString = selectedDate.toISOString().split("T")[0];
                    const storageKey = `combinations_${dateString}_${selectedPeriod}`;

                    console.log("Clearing combinations for:", storageKey);
                    console.log(
                      "Current reservations:",
                      periodReservations.map((r) => ({
                        customer: r.customer_name,
                        party_size: r.party_size,
                      }))
                    );

                    // Clear all combinations
                    setActiveCombinations(new Set());
                    localStorage.removeItem(storageKey);

                    // Force React Flow update
                    setTimeout(() => {
                      setNodes((prevNodes) => {
                        const newNodes = prevNodes.map((node) => {
                          const table = tables.find((t) => t.id === node.id);
                          if (table) {
                            const reservation = periodReservations.find(
                              (r) =>
                                r.table_id === table.id &&
                                r.status !== "cancelled"
                            );

                            const displayStatus = reservation
                              ? "reserved"
                              : "available";

                            return {
                              ...node,
                              data: {
                                ...node.data,
                                status: displayStatus,
                              },
                            };
                          }
                          return node;
                        });
                        return newNodes;
                      });
                    }, 100);

                    toast({
                      title: "Combinaties Gewist",
                      description:
                        "Alle combinaties zijn gewist en tafels gereset",
                    });
                  }}
                  className="bg-red-50 hover:bg-red-100"
                >
                  🗑️ Wis Alle Combinaties
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("=== FORCE CLEAR LOCALSTORAGE ===");
                    const dateString = selectedDate.toISOString().split("T")[0];
                    const storageKey = `combinations_${dateString}_${selectedPeriod}`;

                    console.log("Clearing localStorage for:", storageKey);
                    console.log(
                      "Current reservations:",
                      periodReservations.map((r) => ({
                        customer: r.customer_name,
                        party_size: r.party_size,
                      }))
                    );

                    // Clear localStorage and state
                    localStorage.removeItem(storageKey);
                    setActiveCombinations(new Set());

                    // Force React Flow update
                    setTimeout(() => {
                      setNodes((prevNodes) => {
                        const newNodes = prevNodes.map((node) => {
                          const table = tables.find((t) => t.id === node.id);
                          if (table) {
                            const reservation = periodReservations.find(
                              (r) =>
                                r.table_id === table.id &&
                                r.status !== "cancelled"
                            );

                            const displayStatus = reservation
                              ? "reserved"
                              : "available";

                            return {
                              ...node,
                              data: {
                                ...node.data,
                                status: displayStatus,
                              },
                            };
                          }
                          return node;
                        });
                        return newNodes;
                      });
                    }, 100);

                    toast({
                      title: "localStorage Gewist",
                      description: `localStorage combinaties voor ${selectedPeriod} zijn gewist`,
                    });
                  }}
                  className="bg-gray-50 hover:bg-gray-100"
                >
                  🗑️ Wis localStorage
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("=== FORCE RELOAD AFTER NAVIGATION ===");
                    const dateString = selectedDate.toISOString().split("T")[0];
                    const storageKey = `combinations_${dateString}_${selectedPeriod}`;
                    const storedCombinations = localStorage.getItem(storageKey);

                    console.log("Storage key:", storageKey);
                    console.log("Stored combinations:", storedCombinations);
                    console.log(
                      "Current reservations:",
                      periodReservations.map((r) => ({
                        customer: r.customer_name,
                        party_size: r.party_size,
                      }))
                    );

                    if (storedCombinations) {
                      try {
                        const storedIds = JSON.parse(storedCombinations);
                        const totalReservationCapacity =
                          periodReservations.reduce(
                            (sum, r) => sum + r.party_size,
                            0
                          );
                        const totalCombinationCapacity = storedIds.reduce(
                          (sum, tableId) => {
                            const table = tables.find((t) => t.id === tableId);
                            return sum + (table ? table.capacity : 0);
                          },
                          0
                        );

                        console.log("Navigation reload validation:", {
                          totalReservationCapacity,
                          totalCombinationCapacity,
                          reservationCount: periodReservations.length,
                          combinationCount: storedIds.length,
                        });

                        if (
                          periodReservations.length > 0 &&
                          totalCombinationCapacity >= totalReservationCapacity
                        ) {
                          console.log(
                            "Force reloading combinations after navigation"
                          );
                          setActiveCombinations(new Set(storedIds));

                          // Force React Flow update
                          setTimeout(() => {
                            setNodes((prevNodes) => {
                              const newNodes = prevNodes.map((node) => {
                                const table = tables.find(
                                  (t) => t.id === node.id
                                );
                                if (table) {
                                  const reservation = periodReservations.find(
                                    (r) =>
                                      r.table_id === table.id &&
                                      r.status !== "cancelled"
                                  );
                                  const isInCombination = storedIds.includes(
                                    table.id
                                  );

                                  const displayStatus =
                                    reservation || isInCombination
                                      ? "reserved"
                                      : "available";

                                  return {
                                    ...node,
                                    data: {
                                      ...node.data,
                                      status: displayStatus,
                                    },
                                  };
                                }
                                return node;
                              });
                              return newNodes;
                            });
                          }, 100);

                          toast({
                            title: "Combinaties Herladen",
                            description: `${storedIds.length} combinaties herladen na navigatie`,
                          });
                        } else {
                          console.log("No valid combinations to reload");
                          toast({
                            title: "Geen Combinaties",
                            description:
                              "Geen geldige combinaties gevonden om te herladen",
                          });
                        }
                      } catch (error) {
                        console.error(
                          "Error reloading combinations after navigation:",
                          error
                        );
                        toast({
                          title: "Fout",
                          description: "Kon combinaties niet herladen",
                          variant: "destructive",
                        });
                      }
                    } else {
                      console.log("No stored combinations found");
                      toast({
                        title: "Geen Combinaties",
                        description:
                          "Geen combinaties gevonden in localStorage",
                      });
                    }
                  }}
                  className="bg-indigo-50 hover:bg-indigo-100"
                >
                  🔄 Herlaad na Navigatie
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("=== COMPLETE STATE DUMP ===");
                    console.log("=== CURRENT STATE ===");
                    console.log(
                      "Selected date:",
                      selectedDate.toISOString().split("T")[0]
                    );
                    console.log("Selected period:", selectedPeriod);
                    console.log(
                      "Active combinations:",
                      Array.from(activeCombinations)
                    );
                    console.log(
                      "Active combinations size:",
                      activeCombinations.size
                    );

                    console.log("=== RESERVATIONS ===");
                    console.log(
                      "All periodReservations:",
                      periodReservations.map((r) => ({
                        id: r.id,
                        customer: r.customer_name,
                        party_size: r.party_size,
                        table_id: r.table_id,
                        status: r.status,
                        time: r.reservation_time,
                      }))
                    );
                    console.log(
                      "Total reservation capacity:",
                      periodReservations.reduce(
                        (sum, r) => sum + r.party_size,
                        0
                      )
                    );

                    console.log("=== TABLES ===");
                    console.log(
                      "All tables:",
                      tables.map((t) => ({
                        id: t.id,
                        number: t.table_number,
                        capacity: t.capacity,
                        status: t.status,
                        hasReservation: periodReservations.some(
                          (r) => r.table_id === t.id
                        ),
                        inActiveCombination: activeCombinations.has(t.id),
                      }))
                    );

                    console.log("=== LOCALSTORAGE ===");
                    const dateString = selectedDate.toISOString().split("T")[0];
                    const storageKey = `combinations_${dateString}_${selectedPeriod}`;
                    const storedCombinations = localStorage.getItem(storageKey);
                    console.log("Storage key:", storageKey);
                    console.log("Stored combinations:", storedCombinations);
                    if (storedCombinations) {
                      try {
                        const storedIds = JSON.parse(storedCombinations);
                        console.log("Parsed stored combinations:", storedIds);
                        const totalCombinationCapacity = storedIds.reduce(
                          (sum, tableId) => {
                            const table = tables.find((t) => t.id === tableId);
                            return sum + (table ? table.capacity : 0);
                          },
                          0
                        );
                        console.log(
                          "Stored combination capacity:",
                          totalCombinationCapacity
                        );
                      } catch (error) {
                        console.error(
                          "Error parsing stored combinations:",
                          error
                        );
                      }
                    }

                    console.log("=== REACT FLOW NODES ===");
                    console.log(
                      "Current nodes:",
                      nodes.map((node) => ({
                        id: node.id,
                        data: node.data,
                      }))
                    );

                    console.log("=== VALIDATION CHECK ===");
                    const totalReservationCapacity = periodReservations.reduce(
                      (sum, r) => sum + r.party_size,
                      0
                    );
                    const totalActiveCombinationCapacity = Array.from(
                      activeCombinations
                    ).reduce((sum, tableId) => {
                      const table = tables.find((t) => t.id === tableId);
                      return sum + (table ? table.capacity : 0);
                    }, 0);
                    console.log("Validation results:", {
                      totalReservationCapacity,
                      totalActiveCombinationCapacity,
                      activeCombinationsSize: activeCombinations.size,
                      reservationCount: periodReservations.length,
                      tablesCount: tables.length,
                      nodesCount: nodes.length,
                    });

                    toast({
                      title: "State Dump Complete",
                      description:
                        "Check console for complete state information",
                    });
                  }}
                  className="bg-pink-50 hover:bg-pink-100"
                >
                  🔍 Complete State Dump
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("=== MULTIPLE RESERVATION ANALYSIS ===");
                    console.log("=== ALL RESERVATIONS ===");
                    console.log(
                      "Period reservations:",
                      periodReservations.map((r) => ({
                        id: r.id,
                        customer: r.customer_name,
                        party_size: r.party_size,
                        table_id: r.table_id,
                        status: r.status,
                        time: r.reservation_time,
                      }))
                    );

                    console.log("=== ALL TABLES STATUS ===");
                    console.log(
                      "Tables:",
                      tables.map((t) => ({
                        id: t.id,
                        number: t.table_number,
                        capacity: t.capacity,
                        status: t.status,
                        hasReservation: periodReservations.some(
                          (r) => r.table_id === t.id
                        ),
                        inActiveCombination: activeCombinations.has(t.id),
                      }))
                    );

                    console.log("=== COMBINATION ANALYSIS ===");
                    const dateString = selectedDate.toISOString().split("T")[0];
                    const storageKey = `combinations_${dateString}_${selectedPeriod}`;
                    const storedCombinations = localStorage.getItem(storageKey);

                    if (storedCombinations) {
                      try {
                        const storedIds = JSON.parse(storedCombinations);
                        console.log("Stored combination IDs:", storedIds);

                        const combinationTables = storedIds.map((tableId) => {
                          const table = tables.find((t) => t.id === tableId);
                          return table
                            ? {
                                id: table.id,
                                number: table.table_number,
                                capacity: table.capacity,
                                status: table.status,
                              }
                            : { id: tableId, number: "NOT_FOUND", capacity: 0 };
                        });

                        console.log("Combination tables:", combinationTables);

                        const totalCombinationCapacity =
                          combinationTables.reduce(
                            (sum, t) => sum + t.capacity,
                            0
                          );
                        const totalReservationCapacity =
                          periodReservations.reduce(
                            (sum, r) => sum + r.party_size,
                            0
                          );

                        console.log("Capacity analysis:", {
                          totalCombinationCapacity,
                          totalReservationCapacity,
                          difference:
                            totalCombinationCapacity - totalReservationCapacity,
                          hasEnoughCapacity:
                            totalCombinationCapacity >=
                            totalReservationCapacity,
                        });

                        // Check which reservations are covered
                        const coveredReservations = periodReservations.filter(
                          (r) => r.table_id
                        );
                        const uncoveredReservations = periodReservations.filter(
                          (r) => !r.table_id
                        );

                        console.log("Reservation coverage:", {
                          total: periodReservations.length,
                          covered: coveredReservations.length,
                          uncovered: uncoveredReservations.length,
                          coveredDetails: coveredReservations.map((r) => ({
                            customer: r.customer_name,
                            party_size: r.party_size,
                          })),
                          uncoveredDetails: uncoveredReservations.map((r) => ({
                            customer: r.customer_name,
                            party_size: r.party_size,
                          })),
                        });
                      } catch (error) {
                        console.error("Error analyzing combinations:", error);
                      }
                    } else {
                      console.log("No stored combinations found");
                    }

                    toast({
                      title: "Multiple Reservation Analysis",
                      description: "Check console for detailed analysis",
                    });
                  }}
                  className="bg-cyan-50 hover:bg-cyan-100"
                >
                  📊 Multi-Reservation Analysis
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("=== FORCE LOAD ALL COMBINATIONS ===");

                    // Clear current state
                    setActiveCombinations(new Set());

                    // Get all reservations for this period
                    const dateString = selectedDate.toISOString().split("T")[0];
                    const storageKey = `combinations_${dateString}_${selectedPeriod}`;
                    const storedCombinations = localStorage.getItem(storageKey);

                    console.log("Force loading for:", storageKey);
                    console.log("Stored combinations:", storedCombinations);

                    if (storedCombinations) {
                      try {
                        const storedIds = JSON.parse(storedCombinations);
                        console.log("Parsed stored IDs:", storedIds);

                        // Force load all combinations
                        setActiveCombinations(new Set(storedIds));

                        // Force React Flow update immediately
                        setTimeout(() => {
                          setNodes((prevNodes) => {
                            const newNodes = prevNodes.map((node) => {
                              const table = tables.find(
                                (t) => t.id === node.id
                              );
                              if (table) {
                                const reservation = periodReservations.find(
                                  (r) =>
                                    r.table_id === table.id &&
                                    r.status !== "cancelled"
                                );
                                const isInCombination = storedIds.includes(
                                  table.id
                                );

                                const displayStatus =
                                  reservation ||
                                  (table.status === "reserved" &&
                                    isInCombination)
                                    ? "reserved"
                                    : "available";

                                return {
                                  ...node,
                                  data: {
                                    ...node.data,
                                    status: displayStatus,
                                  },
                                };
                              }
                              return node;
                            });
                            console.log(
                              "Force loaded combinations and updated React Flow"
                            );
                            return newNodes;
                          });
                        }, 100);

                        toast({
                          title: "Combinations Force Loaded",
                          description: `Loaded ${storedIds.length} table combinations`,
                        });
                      } catch (error) {
                        console.error(
                          "Error force loading combinations:",
                          error
                        );
                        toast({
                          title: "Error",
                          description: "Failed to load combinations",
                          variant: "destructive",
                        });
                      }
                    } else {
                      console.log("No stored combinations found");
                      toast({
                        title: "No Combinations",
                        description:
                          "No stored combinations found for this period",
                      });
                    }
                  }}
                  className="bg-orange-50 hover:bg-orange-100"
                >
                  🔄 Force Load All Combinations
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("=== FIX 14 PERSONEN PROBLEEM ===");

                    // Get all reservations for this period
                    console.log(
                      "All reservations:",
                      periodReservations.map((r) => ({
                        customer: r.customer_name,
                        party_size: r.party_size,
                        table_id: r.table_id,
                      }))
                    );

                    // Get stored combinations
                    const dateString = selectedDate.toISOString().split("T")[0];
                    const storageKey = `combinations_${dateString}_${selectedPeriod}`;
                    const storedCombinations = localStorage.getItem(storageKey);

                    console.log("Storage key:", storageKey);
                    console.log("Stored combinations:", storedCombinations);

                    if (storedCombinations) {
                      try {
                        const storedIds = JSON.parse(storedCombinations);
                        console.log("Parsed stored IDs:", storedIds);

                        // Force load combinations
                        setActiveCombinations(new Set(storedIds));

                        // Force React Flow update with simplified logic
                        setTimeout(() => {
                          setNodes((prevNodes) => {
                            const newNodes = prevNodes.map((node) => {
                              const table = tables.find(
                                (t) => t.id === node.id
                              );
                              if (table) {
                                const reservation = periodReservations.find(
                                  (r) =>
                                    r.table_id === table.id &&
                                    r.status !== "cancelled"
                                );
                                const isInCombination = storedIds.includes(
                                  table.id
                                );

                                // SIMPLIFIED LOGIC: Show yellow if in combination OR has reservation
                                const displayStatus =
                                  reservation || isInCombination
                                    ? "reserved"
                                    : "available";

                                console.log(
                                  `Table ${
                                    table.table_number
                                  }: ${displayStatus} (reservation: ${!!reservation}, combination: ${isInCombination})`
                                );

                                return {
                                  ...node,
                                  data: {
                                    ...node.data,
                                    status: displayStatus,
                                  },
                                };
                              }
                              return node;
                            });
                            console.log(
                              "Fixed 14 personen problem - React Flow updated"
                            );
                            return newNodes;
                          });
                        }, 100);

                        toast({
                          title: "14 Personen Probleem Opgelost",
                          description: `${
                            storedIds.length
                          } tafels nu geel voor ${periodReservations.reduce(
                            (sum, r) => sum + r.party_size,
                            0
                          )} personen`,
                        });
                      } catch (error) {
                        console.error(
                          "Error fixing 14 personen problem:",
                          error
                        );
                        toast({
                          title: "Fout",
                          description: "Kon probleem niet oplossen",
                          variant: "destructive",
                        });
                      }
                    } else {
                      console.log("No stored combinations found");
                      toast({
                        title: "Geen Combinaties",
                        description: "Geen combinaties gevonden om te laden",
                      });
                    }
                  }}
                  className="bg-red-50 hover:bg-red-100"
                >
                  🔧 Fix 14 Personen
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("=== CLEAR ALL OLD COMBINATIONS ===");

                    // Clear all combinations for all dates and periods
                    const keysToRemove = [];
                    for (let i = 0; i < localStorage.length; i++) {
                      const key = localStorage.key(i);
                      if (key && key.startsWith("combinations_")) {
                        keysToRemove.push(key);
                      }
                    }

                    keysToRemove.forEach((key) => {
                      localStorage.removeItem(key);
                      console.log("Removed:", key);
                    });

                    // Clear current active combinations
                    setActiveCombinations(new Set());

                    // Force React Flow update
                    setTimeout(() => {
                      setNodes((prevNodes) => {
                        const newNodes = prevNodes.map((node) => {
                          const table = tables.find((t) => t.id === node.id);
                          if (table) {
                            const reservation = periodReservations.find(
                              (r) =>
                                r.table_id === table.id &&
                                r.status !== "cancelled"
                            );

                            const displayStatus = reservation
                              ? "reserved"
                              : "available";

                            return {
                              ...node,
                              data: {
                                ...node.data,
                                status: displayStatus,
                              },
                            };
                          }
                          return node;
                        });
                        return newNodes;
                      });
                    }, 100);

                    console.log("Cleared combinations for keys:", keysToRemove);
                    toast({
                      title: "Alle Oude Combinaties Gewist",
                      description: `${keysToRemove.length} combinatie sets gewist uit localStorage`,
                    });
                  }}
                  className="bg-red-50 hover:bg-red-100"
                >
                  🗑️ Wis Alle Oude Combinaties
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("=== SHOW ALL COMBINATIONS DEBUG ===");

                    const dateString = selectedDate.toISOString().split("T")[0];
                    const storageKey = `combinations_${dateString}_${selectedPeriod}`;
                    const storedCombinations = localStorage.getItem(storageKey);

                    console.log("Storage key:", storageKey);
                    console.log("Stored combinations:", storedCombinations);

                    if (storedCombinations) {
                      try {
                        const storedIds = JSON.parse(storedCombinations);
                        console.log("Parsed stored IDs:", storedIds);

                        const combinationTables = storedIds.map(
                          (tableId: string) => {
                            const table = tables.find((t) => t.id === tableId);
                            return table
                              ? {
                                  id: table.id,
                                  number: table.table_number,
                                  capacity: table.capacity,
                                  status: table.status,
                                }
                              : {
                                  id: tableId,
                                  number: "NOT_FOUND",
                                  capacity: 0,
                                };
                          }
                        );

                        const totalCombinationCapacity =
                          combinationTables.reduce(
                            (sum, t) => sum + t.capacity,
                            0
                          );
                        const totalReservationCapacity =
                          periodReservations.reduce(
                            (sum, r) => sum + r.party_size,
                            0
                          );

                        console.log("=== COMBINATION ANALYSIS ===");
                        console.log("Combination tables:", combinationTables);
                        console.log(
                          "Total combination capacity:",
                          totalCombinationCapacity
                        );
                        console.log(
                          "Total reservation capacity:",
                          totalReservationCapacity
                        );
                        console.log(
                          "Active combinations state:",
                          Array.from(activeCombinations)
                        );
                        console.log(
                          "All reservations:",
                          periodReservations.map((r) => ({
                            customer: r.customer_name,
                            party_size: r.party_size,
                            table_id: r.table_id,
                          }))
                        );

                        // Force show all combinations in React Flow
                        setActiveCombinations(new Set(storedIds));

                        setTimeout(() => {
                          setNodes((prevNodes) => {
                            const newNodes = prevNodes.map((node) => {
                              const table = tables.find(
                                (t) => t.id === node.id
                              );
                              if (table) {
                                const reservation = periodReservations.find(
                                  (r) =>
                                    r.table_id === table.id &&
                                    r.status !== "cancelled"
                                );
                                const isInCombination = storedIds.includes(
                                  table.id
                                );

                                const displayStatus =
                                  reservation || isInCombination
                                    ? "reserved"
                                    : "available";

                                console.log(
                                  `Table ${
                                    table.table_number
                                  }: ${displayStatus} (reservation: ${!!reservation}, combination: ${isInCombination})`
                                );

                                return {
                                  ...node,
                                  data: {
                                    ...node.data,
                                    status: displayStatus,
                                  },
                                };
                              }
                              return node;
                            });
                            return newNodes;
                          });
                        }, 100);

                        toast({
                          title: "Alle Combinaties Getoond",
                          description: `${storedIds.length} tafels (${totalCombinationCapacity} personen) nu zichtbaar`,
                        });
                      } catch (error) {
                        console.error("Error showing combinations:", error);
                        toast({
                          title: "Fout",
                          description: "Kon combinaties niet tonen",
                          variant: "destructive",
                        });
                      }
                    } else {
                      console.log("No stored combinations found");
                      toast({
                        title: "Geen Combinaties",
                        description:
                          "Geen combinaties gevonden in localStorage",
                      });
                    }
                  }}
                  className="bg-blue-50 hover:bg-blue-100"
                >
                  👁️ Toon Alle Combinaties
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("=== FORCE MERGE ALL COMBINATIONS ===");

                    // Get all reservations for this period
                    const dateString = selectedDate.toISOString().split("T")[0];
                    const storageKey = `combinations_${dateString}_${selectedPeriod}`;
                    const storedCombinations = localStorage.getItem(storageKey);

                    console.log(
                      "Current reservations:",
                      periodReservations.map((r) => ({
                        customer: r.customer_name,
                        party_size: r.party_size,
                        table_id: r.table_id,
                      }))
                    );

                    if (storedCombinations) {
                      try {
                        const storedIds = JSON.parse(storedCombinations);
                        console.log("Current stored combinations:", storedIds);

                        // Calculate total capacity needed
                        const totalNeededCapacity = periodReservations.reduce(
                          (sum, r) => sum + r.party_size,
                          0
                        );
                        const currentCombinationCapacity = storedIds.reduce(
                          (sum, tableId) => {
                            const table = tables.find((t) => t.id === tableId);
                            return sum + (table ? table.capacity : 0);
                          },
                          0
                        );

                        console.log("Capacity analysis:", {
                          needed: totalNeededCapacity,
                          current: currentCombinationCapacity,
                          difference:
                            totalNeededCapacity - currentCombinationCapacity,
                        });

                        // If we have enough capacity, force load all combinations
                        if (currentCombinationCapacity >= totalNeededCapacity) {
                          console.log(
                            "Enough capacity, forcing load of all combinations"
                          );
                          setActiveCombinations(new Set(storedIds));

                          // Force React Flow update
                          setTimeout(() => {
                            setNodes((prevNodes) => {
                              const newNodes = prevNodes.map((node) => {
                                const table = tables.find(
                                  (t) => t.id === node.id
                                );
                                if (table) {
                                  const reservation = periodReservations.find(
                                    (r) =>
                                      r.table_id === table.id &&
                                      r.status !== "cancelled"
                                  );
                                  const isInCombination = storedIds.includes(
                                    table.id
                                  );

                                  const displayStatus =
                                    reservation || isInCombination
                                      ? "reserved"
                                      : "available";

                                  console.log(
                                    `Table ${
                                      table.table_number
                                    }: ${displayStatus} (reservation: ${!!reservation}, combination: ${isInCombination})`
                                  );

                                  return {
                                    ...node,
                                    data: {
                                      ...node.data,
                                      status: displayStatus,
                                    },
                                  };
                                }
                                return node;
                              });
                              console.log(
                                "Force merged all combinations in React Flow"
                              );
                              return newNodes;
                            });
                          }, 100);

                          toast({
                            title: "Alle Combinaties Geforceerd",
                            description: `${storedIds.length} tafels (${currentCombinationCapacity} personen) nu zichtbaar`,
                          });
                        } else {
                          console.log(
                            "Not enough capacity, cannot force merge"
                          );
                          toast({
                            title: "Onvoldoende Capaciteit",
                            description: `Huidige combinaties dekken maar ${currentCombinationCapacity} van ${totalNeededCapacity} personen`,
                            variant: "destructive",
                          });
                        }
                      } catch (error) {
                        console.error(
                          "Error force merging combinations:",
                          error
                        );
                        toast({
                          title: "Fout",
                          description: "Kon combinaties niet forceren",
                          variant: "destructive",
                        });
                      }
                    } else {
                      console.log("No stored combinations found");
                      toast({
                        title: "Geen Combinaties",
                        description: "Geen combinaties gevonden om te forceren",
                      });
                    }
                  }}
                  className="bg-green-50 hover:bg-green-100"
                >
                  🔧 Forceer Alle Combinaties
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("=== FIX DISCREPANCY: 2 vs 14 PERSONEN ===");

                    // Get current reservations
                    const currentReservations = periodReservations.map((r) => ({
                      customer: r.customer_name,
                      party_size: r.party_size,
                      table_id: r.table_id,
                    }));

                    console.log("Current reservations:", currentReservations);
                    const totalReservationCapacity = currentReservations.reduce(
                      (sum, r) => sum + r.party_size,
                      0
                    );

                    // Get stored combinations
                    const dateString = selectedDate.toISOString().split("T")[0];
                    const storageKey = `combinations_${dateString}_${selectedPeriod}`;
                    const storedCombinations = localStorage.getItem(storageKey);

                    console.log("Storage key:", storageKey);
                    console.log("Stored combinations:", storedCombinations);

                    if (storedCombinations) {
                      try {
                        const storedIds = JSON.parse(storedCombinations);
                        const combinationTables = storedIds.map(
                          (tableId: string) => {
                            const table = tables.find((t) => t.id === tableId);
                            return table
                              ? {
                                  id: table.id,
                                  number: table.table_number,
                                  capacity: table.capacity,
                                }
                              : {
                                  id: tableId,
                                  number: "NOT_FOUND",
                                  capacity: 0,
                                };
                          }
                        );

                        const totalCombinationCapacity =
                          combinationTables.reduce(
                            (sum, t) => sum + t.capacity,
                            0
                          );

                        console.log("=== DISCREPANCY ANALYSIS ===");
                        console.log("Reservations:", currentReservations);
                        console.log(
                          "Reservation capacity:",
                          totalReservationCapacity
                        );
                        console.log("Combination tables:", combinationTables);
                        console.log(
                          "Combination capacity:",
                          totalCombinationCapacity
                        );
                        console.log(
                          "Discrepancy:",
                          totalCombinationCapacity - totalReservationCapacity
                        );

                        // Clear all combinations and localStorage
                        console.log(
                          "Clearing all combinations due to discrepancy"
                        );
                        setActiveCombinations(new Set());
                        localStorage.removeItem(storageKey);

                        // Force React Flow update to show only actual reservations
                        setTimeout(() => {
                          setNodes((prevNodes) => {
                            const newNodes = prevNodes.map((node) => {
                              const table = tables.find(
                                (t) => t.id === node.id
                              );
                              if (table) {
                                const reservation = periodReservations.find(
                                  (r) =>
                                    r.table_id === table.id &&
                                    r.status !== "cancelled"
                                );

                                const displayStatus = reservation
                                  ? "reserved"
                                  : "available";

                                console.log(
                                  `Table ${
                                    table.table_number
                                  }: ${displayStatus} (reservation: ${!!reservation})`
                                );

                                return {
                                  ...node,
                                  data: {
                                    ...node.data,
                                    status: displayStatus,
                                  },
                                };
                              }
                              return node;
                            });
                            console.log(
                              "Fixed discrepancy - only actual reservations shown"
                            );
                            return newNodes;
                          });
                        }, 100);

                        toast({
                          title: "Discrepantie Opgelost",
                          description: `Combinaties gewist: ${totalCombinationCapacity} → ${totalReservationCapacity} personen`,
                        });
                      } catch (error) {
                        console.error("Error fixing discrepancy:", error);
                        toast({
                          title: "Fout",
                          description: "Kon discrepantie niet oplossen",
                          variant: "destructive",
                        });
                      }
                    } else {
                      console.log("No stored combinations found");
                      toast({
                        title: "Geen Combinaties",
                        description: "Geen combinaties gevonden om te wissen",
                      });
                    }
                  }}
                  className="bg-red-50 hover:bg-red-100"
                >
                  🚨 Fix 2 vs 14 Personen
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("=== FIX NAVIGATION ISSUE ===");

                    // Get current state
                    const dateString = selectedDate.toISOString().split("T")[0];
                    const storageKey = `combinations_${dateString}_${selectedPeriod}`;
                    const storedCombinations = localStorage.getItem(storageKey);

                    console.log("Current state:", {
                      activeCombinations: Array.from(activeCombinations),
                      storedCombinations,
                      periodReservations: periodReservations.map((r) => ({
                        customer: r.customer_name,
                        party_size: r.party_size,
                      })),
                    });

                    if (storedCombinations && activeCombinations.size === 0) {
                      console.log("=== NAVIGATION ISSUE DETECTED ===");

                      try {
                        const storedIds = JSON.parse(storedCombinations);
                        const totalReservationCapacity =
                          periodReservations.reduce(
                            (sum, r) => sum + r.party_size,
                            0
                          );
                        const totalCombinationCapacity = storedIds.reduce(
                          (sum, tableId) => {
                            const table = tables.find((t) => t.id === tableId);
                            return sum + (table ? table.capacity : 0);
                          },
                          0
                        );

                        console.log("Navigation fix analysis:", {
                          storedIds,
                          totalReservationCapacity,
                          totalCombinationCapacity,
                          capacityDifference: Math.abs(
                            totalCombinationCapacity - totalReservationCapacity
                          ),
                        });

                        // Force load combinations
                        if (
                          totalCombinationCapacity >= totalReservationCapacity
                        ) {
                          console.log("=== FORCING COMBINATION LOAD ===");
                          setActiveCombinations(new Set(storedIds));

                          // Force React Flow update
                          setTimeout(() => {
                            setNodes((prevNodes) => {
                              const newNodes = prevNodes.map((node) => {
                                const table = tables.find(
                                  (t) => t.id === node.id
                                );
                                if (table) {
                                  const reservation = periodReservations.find(
                                    (r) =>
                                      r.table_id === table.id &&
                                      r.status !== "cancelled"
                                  );
                                  const isInCombination = storedIds.includes(
                                    table.id
                                  );

                                  const displayStatus =
                                    reservation || isInCombination
                                      ? "reserved"
                                      : "available";

                                  console.log(
                                    `Navigation fix - Table ${
                                      table.table_number
                                    }: ${displayStatus} (reservation: ${!!reservation}, combination: ${isInCombination})`
                                  );

                                  return {
                                    ...node,
                                    data: {
                                      ...node.data,
                                      status: displayStatus,
                                    },
                                  };
                                }
                                return node;
                              });
                              console.log(
                                "Navigation fix - React Flow updated"
                              );
                              return newNodes;
                            });
                          }, 100);

                          toast({
                            title: "Navigatie Probleem Opgelost",
                            description: `${storedIds.length} combinaties herladen`,
                          });
                        } else {
                          console.log("=== COMBINATIONS INSUFFICIENT ===");
                          localStorage.removeItem(storageKey);
                          toast({
                            title: "Oude Combinaties Gewist",
                            description: "Combinaties waren niet meer geldig",
                          });
                        }
                      } catch (error) {
                        console.error("Navigation fix error:", error);
                        toast({
                          title: "Fout",
                          description: "Kon navigatie probleem niet oplossen",
                          variant: "destructive",
                        });
                      }
                    } else if (activeCombinations.size > 0) {
                      console.log("Active combinations already loaded");
                      toast({
                        title: "Geen Probleem",
                        description: "Combinaties zijn al geladen",
                      });
                    } else {
                      console.log("No stored combinations found");
                      toast({
                        title: "Geen Combinaties",
                        description: "Geen combinaties gevonden om te laden",
                      });
                    }
                  }}
                  className="bg-yellow-50 hover:bg-yellow-100"
                >
                  🔄 Fix Navigatie Probleem
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("=== FIX MISSING 6 PERSONEN ===");

                    // Get current state
                    const dateString = selectedDate.toISOString().split("T")[0];
                    const storageKey = `combinations_${dateString}_${selectedPeriod}`;
                    const storedCombinations = localStorage.getItem(storageKey);

                    console.log("Current state analysis:", {
                      periodReservations: periodReservations.map((r) => ({
                        customer: r.customer_name,
                        party_size: r.party_size,
                        table_id: r.table_id,
                      })),
                      totalReservationCapacity: periodReservations.reduce(
                        (sum, r) => sum + r.party_size,
                        0
                      ),
                      activeCombinations: Array.from(activeCombinations),
                      storedCombinations,
                      yellowTablesCount: Array.from(activeCombinations).length,
                    });

                    if (storedCombinations) {
                      try {
                        const storedIds = JSON.parse(storedCombinations);
                        const totalReservationCapacity =
                          periodReservations.reduce(
                            (sum, r) => sum + r.party_size,
                            0
                          );
                        const totalCombinationCapacity = storedIds.reduce(
                          (sum, tableId) => {
                            const table = tables.find((t) => t.id === tableId);
                            return sum + (table ? table.capacity : 0);
                          },
                          0
                        );

                        console.log("=== MISSING PERSONS ANALYSIS ===");
                        console.log("Stored combinations:", storedIds);
                        console.log(
                          "Combination tables:",
                          storedIds.map((tableId) => {
                            const table = tables.find((t) => t.id === tableId);
                            return table
                              ? {
                                  id: table.id,
                                  number: table.table_number,
                                  capacity: table.capacity,
                                }
                              : {
                                  id: tableId,
                                  number: "NOT_FOUND",
                                  capacity: 0,
                                };
                          })
                        );
                        console.log("Capacity analysis:", {
                          reservationCapacity: totalReservationCapacity,
                          combinationCapacity: totalCombinationCapacity,
                          missingCapacity:
                            totalReservationCapacity - totalCombinationCapacity,
                          activeCombinationsCount: activeCombinations.size,
                          storedCombinationsCount: storedIds.length,
                        });

                        // Force load all stored combinations
                        console.log("=== FORCING ALL COMBINATIONS TO LOAD ===");
                        setActiveCombinations(new Set(storedIds));

                        // Force React Flow update with ALL combinations
                        setTimeout(() => {
                          setNodes((prevNodes) => {
                            const newNodes = prevNodes.map((node) => {
                              const table = tables.find(
                                (t) => t.id === node.id
                              );
                              if (table) {
                                const reservation = periodReservations.find(
                                  (r) =>
                                    r.table_id === table.id &&
                                    r.status !== "cancelled"
                                );
                                const isInCombination = storedIds.includes(
                                  table.id
                                );

                                const displayStatus =
                                  reservation || isInCombination
                                    ? "reserved"
                                    : "available";

                                console.log(
                                  `Table ${
                                    table.table_number
                                  }: ${displayStatus} (reservation: ${!!reservation}, combination: ${isInCombination})`
                                );

                                return {
                                  ...node,
                                  data: {
                                    ...node.data,
                                    status: displayStatus,
                                  },
                                };
                              }
                              return node;
                            });
                            console.log(
                              "All combinations loaded in React Flow"
                            );
                            return newNodes;
                          });
                        }, 100);

                        toast({
                          title: "Ontbrekende Personen Opgelost",
                          description: `${storedIds.length} tafels (${totalCombinationCapacity} personen) nu zichtbaar`,
                        });
                      } catch (error) {
                        console.error("Error fixing missing persons:", error);
                        toast({
                          title: "Fout",
                          description: "Kon ontbrekende personen niet oplossen",
                          variant: "destructive",
                        });
                      }
                    } else {
                      console.log("No stored combinations found");
                      toast({
                        title: "Geen Combinaties",
                        description: "Geen combinaties gevonden om te laden",
                      });
                    }
                  }}
                  className="bg-purple-50 hover:bg-purple-100"
                >
                  👥 Fix Ontbrekende 6 Personen
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("=== FIX MERGING PROBLEM ===");

                    // Get current state
                    const dateString = selectedDate.toISOString().split("T")[0];
                    const storageKey = `combinations_${dateString}_${selectedPeriod}`;
                    const storedCombinations = localStorage.getItem(storageKey);

                    console.log("Current state:", {
                      activeCombinations: Array.from(activeCombinations),
                      storedCombinations,
                      periodReservations: periodReservations.map((r) => ({
                        customer: r.customer_name,
                        party_size: r.party_size,
                      })),
                    });

                    if (storedCombinations) {
                      try {
                        const storedIds = JSON.parse(storedCombinations);
                        const totalReservationCapacity =
                          periodReservations.reduce(
                            (sum, r) => sum + r.party_size,
                            0
                          );
                        const totalCombinationCapacity = storedIds.reduce(
                          (sum, tableId) => {
                            const table = tables.find((t) => t.id === tableId);
                            return sum + (table ? table.capacity : 0);
                          },
                          0
                        );

                        console.log("=== MERGING ANALYSIS ===");
                        console.log("Stored combinations:", storedIds);
                        console.log(
                          "Active combinations:",
                          Array.from(activeCombinations)
                        );
                        console.log("Capacity analysis:", {
                          reservationCapacity: totalReservationCapacity,
                          combinationCapacity: totalCombinationCapacity,
                          activeCombinationsCount: activeCombinations.size,
                          storedCombinationsCount: storedIds.length,
                        });

                        // Check if activeCombinations match stored combinations
                        const activeArray = Array.from(activeCombinations);
                        const isMatching =
                          storedIds.length === activeArray.length &&
                          storedIds.every((id) => activeArray.includes(id));

                        console.log("Matching analysis:", {
                          isMatching,
                          activeArray,
                          storedIds,
                        });

                        if (!isMatching) {
                          console.log("=== FIXING MERGING MISMATCH ===");

                          // Force load all stored combinations
                          setActiveCombinations(new Set(storedIds));

                          // Force React Flow update
                          setTimeout(() => {
                            setNodes((prevNodes) => {
                              const newNodes = prevNodes.map((node) => {
                                const table = tables.find(
                                  (t) => t.id === node.id
                                );
                                if (table) {
                                  const reservation = periodReservations.find(
                                    (r) =>
                                      r.table_id === table.id &&
                                      r.status !== "cancelled"
                                  );
                                  const isInCombination = storedIds.includes(
                                    table.id
                                  );

                                  const displayStatus =
                                    reservation || isInCombination
                                      ? "reserved"
                                      : "available";

                                  console.log(
                                    `Table ${
                                      table.table_number
                                    }: ${displayStatus} (reservation: ${!!reservation}, combination: ${isInCombination})`
                                  );

                                  return {
                                    ...node,
                                    data: {
                                      ...node.data,
                                      status: displayStatus,
                                    },
                                  };
                                }
                                return node;
                              });
                              console.log("Merging fix - React Flow updated");
                              return newNodes;
                            });
                          }, 100);

                          toast({
                            title: "Merging Probleem Opgelost",
                            description: `${storedIds.length} combinaties gesynchroniseerd`,
                          });
                        } else {
                          console.log(
                            "Active combinations already match stored combinations"
                          );
                          toast({
                            title: "Geen Probleem",
                            description: "Combinaties zijn al gesynchroniseerd",
                          });
                        }
                      } catch (error) {
                        console.error("Error fixing merging problem:", error);
                        toast({
                          title: "Fout",
                          description: "Kon merging probleem niet oplossen",
                          variant: "destructive",
                        });
                      }
                    } else {
                      console.log("No stored combinations found");
                      toast({
                        title: "Geen Combinaties",
                        description:
                          "Geen combinaties gevonden om te synchroniseren",
                      });
                    }
                  }}
                  className="bg-indigo-50 hover:bg-indigo-100"
                >
                  🔗 Fix Merging Probleem
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("=== FIX ASSIGNMENT SYNC PROBLEM ===");

                    // Get current state
                    const dateString = selectedDate.toISOString().split("T")[0];
                    const storageKey = `combinations_${dateString}_${selectedPeriod}`;
                    const storedCombinations = localStorage.getItem(storageKey);

                    console.log("=== CURRENT STATE ANALYSIS ===");
                    console.log(
                      "All reservations:",
                      periodReservations.map((r) => ({
                        id: r.id,
                        customer: r.customer_name,
                        party_size: r.party_size,
                        table_id: r.table_id,
                        status: r.status,
                      }))
                    );

                    console.log("Stored combinations:", storedCombinations);
                    console.log(
                      "Active combinations:",
                      Array.from(activeCombinations)
                    );

                    if (storedCombinations) {
                      try {
                        const storedIds = JSON.parse(storedCombinations);

                        // Find reservations without table_id OR with table_id but not in active combinations
                        const unassignedReservations =
                          periodReservations.filter((r) => {
                            // If no table_id, it's unassigned
                            if (!r.table_id) return true;

                            // If has table_id but table is not in active combinations, it might be unassigned
                            const table = tables.find(
                              (t) => t.id === r.table_id
                            );
                            if (!table) return true;

                            // Check if this table is part of active combinations
                            return !storedIds.includes(r.table_id);
                          });

                        const assignedReservations = periodReservations.filter(
                          (r) => {
                            if (!r.table_id) return false;
                            return storedIds.includes(r.table_id);
                          }
                        );

                        console.log("=== ASSIGNMENT ANALYSIS ===");
                        console.log(
                          "Unassigned reservations:",
                          unassignedReservations.map((r) => ({
                            customer: r.customer_name,
                            party_size: r.party_size,
                          }))
                        );
                        console.log(
                          "Assigned reservations:",
                          assignedReservations.map((r) => ({
                            customer: r.customer_name,
                            party_size: r.party_size,
                            table_id: r.table_id,
                          }))
                        );
                        console.log(
                          "Stored combination tables:",
                          storedIds.map((tableId) => {
                            const table = tables.find((t) => t.id === tableId);
                            return table
                              ? {
                                  id: table.id,
                                  number: table.table_number,
                                  capacity: table.capacity,
                                }
                              : {
                                  id: tableId,
                                  number: "NOT_FOUND",
                                  capacity: 0,
                                };
                          })
                        );

                        // Calculate total capacity needed for unassigned reservations
                        const totalUnassignedCapacity =
                          unassignedReservations.reduce(
                            (sum, r) => sum + r.party_size,
                            0
                          );
                        const totalCombinationCapacity = storedIds.reduce(
                          (sum, tableId) => {
                            const table = tables.find((t) => t.id === tableId);
                            return sum + (table ? table.capacity : 0);
                          },
                          0
                        );

                        console.log("Capacity analysis:", {
                          unassignedCapacity: totalUnassignedCapacity,
                          combinationCapacity: totalCombinationCapacity,
                          hasEnoughCapacity:
                            totalCombinationCapacity >= totalUnassignedCapacity,
                        });

                        // If we have enough capacity for unassigned reservations, force load combinations
                        if (
                          totalCombinationCapacity >= totalUnassignedCapacity &&
                          unassignedReservations.length > 0
                        ) {
                          console.log(
                            "=== FORCING COMBINATION LOAD FOR UNASSIGNED RESERVATIONS ==="
                          );

                          // Force load all combinations
                          setActiveCombinations(new Set(storedIds));

                          // Force React Flow update
                          setTimeout(() => {
                            setNodes((prevNodes) => {
                              const newNodes = prevNodes.map((node) => {
                                const table = tables.find(
                                  (t) => t.id === node.id
                                );
                                if (table) {
                                  const reservation = periodReservations.find(
                                    (r) =>
                                      r.table_id === table.id &&
                                      r.status !== "cancelled"
                                  );
                                  const isInCombination = storedIds.includes(
                                    table.id
                                  );

                                  const displayStatus =
                                    reservation || isInCombination
                                      ? "reserved"
                                      : "available";

                                  console.log(
                                    `Table ${
                                      table.table_number
                                    }: ${displayStatus} (reservation: ${!!reservation}, combination: ${isInCombination})`
                                  );

                                  return {
                                    ...node,
                                    data: {
                                      ...node.data,
                                      status: displayStatus,
                                    },
                                  };
                                }
                                return node;
                              });
                              console.log(
                                "Assignment sync - React Flow updated"
                              );
                              return newNodes;
                            });
                          }, 100);

                          toast({
                            title: "Toewijzing Gesynchroniseerd",
                            description: `${storedIds.length} tafels toegewezen voor ${totalUnassignedCapacity} personen`,
                          });
                        } else {
                          console.log(
                            "Not enough capacity or no unassigned reservations"
                          );
                          toast({
                            title: "Geen Actie Nodig",
                            description:
                              "Geen onvoldoende capaciteit of geen niet-toegewezen reserveringen",
                          });
                        }
                      } catch (error) {
                        console.error("Error fixing assignment sync:", error);
                        toast({
                          title: "Fout",
                          description: "Kon toewijzing niet synchroniseren",
                          variant: "destructive",
                        });
                      }
                    } else {
                      console.log("No stored combinations found");
                      toast({
                        title: "Geen Combinaties",
                        description:
                          "Geen combinaties gevonden om te synchroniseren",
                      });
                    }
                  }}
                  className="bg-green-50 hover:bg-green-100"
                >
                  🔄 Fix Toewijzing Sync
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log(
                      "=== FORCE LOAD ALL COMBINATIONS FOR ALL RESERVATIONS ==="
                    );

                    // Get current state
                    const dateString = selectedDate.toISOString().split("T")[0];
                    const storageKey = `combinations_${dateString}_${selectedPeriod}`;
                    const storedCombinations = localStorage.getItem(storageKey);

                    console.log("=== FORCE LOAD ANALYSIS ===");
                    console.log(
                      "All reservations:",
                      periodReservations.map((r) => ({
                        id: r.id,
                        customer: r.customer_name,
                        party_size: r.party_size,
                        table_id: r.table_id,
                        status: r.status,
                      }))
                    );

                    if (storedCombinations) {
                      try {
                        const storedIds = JSON.parse(storedCombinations);
                        const totalReservationCapacity =
                          periodReservations.reduce(
                            (sum, r) => sum + r.party_size,
                            0
                          );
                        const totalCombinationCapacity = storedIds.reduce(
                          (sum, tableId) => {
                            const table = tables.find((t) => t.id === tableId);
                            return sum + (table ? table.capacity : 0);
                          },
                          0
                        );

                        console.log("=== FORCE LOAD DETAILS ===");
                        console.log("Stored combinations:", storedIds);
                        console.log(
                          "Combination tables:",
                          storedIds.map((tableId) => {
                            const table = tables.find((t) => t.id === tableId);
                            return table
                              ? {
                                  id: table.id,
                                  number: table.table_number,
                                  capacity: table.capacity,
                                }
                              : {
                                  id: tableId,
                                  number: "NOT_FOUND",
                                  capacity: 0,
                                };
                          })
                        );
                        console.log("Capacity analysis:", {
                          reservationCapacity: totalReservationCapacity,
                          combinationCapacity: totalCombinationCapacity,
                          hasEnoughCapacity:
                            totalCombinationCapacity >=
                            totalReservationCapacity,
                        });

                        // Force load all combinations regardless of assignment status
                        console.log("=== FORCING LOAD OF ALL COMBINATIONS ===");
                        setActiveCombinations(new Set(storedIds));

                        // Force React Flow update
                        setTimeout(() => {
                          setNodes((prevNodes) => {
                            const newNodes = prevNodes.map((node) => {
                              const table = tables.find(
                                (t) => t.id === node.id
                              );
                              if (table) {
                                const reservation = periodReservations.find(
                                  (r) =>
                                    r.table_id === table.id &&
                                    r.status !== "cancelled"
                                );
                                const isInCombination = storedIds.includes(
                                  table.id
                                );

                                const displayStatus =
                                  reservation || isInCombination
                                    ? "reserved"
                                    : "available";

                                console.log(
                                  `Table ${
                                    table.table_number
                                  }: ${displayStatus} (reservation: ${!!reservation}, combination: ${isInCombination})`
                                );

                                return {
                                  ...node,
                                  data: {
                                    ...node.data,
                                    status: displayStatus,
                                  },
                                };
                              }
                              return node;
                            });
                            console.log("Force load - React Flow updated");
                            return newNodes;
                          });
                        }, 100);

                        toast({
                          title: "Alle Combinaties Geforceerd",
                          description: `${storedIds.length} tafels geladen voor ${totalReservationCapacity} personen`,
                        });
                      } catch (error) {
                        console.error(
                          "Error force loading combinations:",
                          error
                        );
                        toast({
                          title: "Fout",
                          description: "Kon combinaties niet forceren",
                          variant: "destructive",
                        });
                      }
                    } else {
                      console.log("No stored combinations found");
                      toast({
                        title: "Geen Combinaties",
                        description: "Geen combinaties gevonden om te forceren",
                      });
                    }
                  }}
                  className="bg-orange-50 hover:bg-orange-100"
                >
                  ⚡ Forceer Alle Combinaties
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("=== FIX DEBUG STATUS ASSIGNMENT ===");

                    // Get current state
                    const dateString = selectedDate.toISOString().split("T")[0];
                    const storageKey = `combinations_${dateString}_${selectedPeriod}`;
                    const storedCombinations = localStorage.getItem(storageKey);

                    console.log("=== DEBUG STATUS ANALYSIS ===");
                    console.log(
                      "All reservations:",
                      periodReservations.map((r) => ({
                        id: r.id,
                        customer: r.customer_name,
                        party_size: r.party_size,
                        table_id: r.table_id,
                        status: r.status,
                      }))
                    );

                    console.log(
                      "Active combinations:",
                      Array.from(activeCombinations)
                    );
                    console.log("Stored combinations:", storedCombinations);

                    if (storedCombinations) {
                      try {
                        const storedIds = JSON.parse(storedCombinations);
                        const totalReservationCapacity =
                          periodReservations.reduce(
                            (sum, r) => sum + r.party_size,
                            0
                          );
                        const totalCombinationCapacity = storedIds.reduce(
                          (sum, tableId) => {
                            const table = tables.find((t) => t.id === tableId);
                            return sum + (table ? table.capacity : 0);
                          },
                          0
                        );

                        console.log("=== ASSIGNMENT ANALYSIS ===");
                        console.log(
                          "Reservations without table_id:",
                          periodReservations
                            .filter((r) => !r.table_id)
                            .map((r) => ({
                              customer: r.customer_name,
                              party_size: r.party_size,
                            }))
                        );
                        console.log("Capacity analysis:", {
                          reservationCapacity: totalReservationCapacity,
                          combinationCapacity: totalCombinationCapacity,
                          hasEnoughCapacity:
                            totalCombinationCapacity >=
                            totalReservationCapacity,
                          shouldBeAssigned:
                            totalCombinationCapacity >=
                            totalReservationCapacity,
                        });

                        // Show corrected assignment status
                        if (
                          totalCombinationCapacity >= totalReservationCapacity
                        ) {
                          console.log(
                            "=== ALL RESERVATIONS SHOULD BE CONSIDERED ASSIGNED ==="
                          );

                          const reservationsWithoutTableId =
                            periodReservations.filter((r) => !r.table_id);
                          const reservationsWithTableId =
                            periodReservations.filter((r) => r.table_id);

                          console.log(
                            "Reservations with table_id:",
                            reservationsWithTableId.map((r) => ({
                              customer: r.customer_name,
                              party_size: r.party_size,
                              table_id: r.table_id,
                            }))
                          );

                          console.log(
                            "Reservations without table_id (but covered by combinations):",
                            reservationsWithoutTableId.map((r) => ({
                              customer: r.customer_name,
                              party_size: r.party_size,
                              covered: true,
                            }))
                          );

                          toast({
                            title: "Debug Status Gecorrigeerd",
                            description: `${reservationsWithoutTableId.length} reserveringen zonder table_id maar wel toegewezen via combinaties`,
                          });
                        } else {
                          console.log(
                            "=== NOT ENOUGH COMBINATION CAPACITY ==="
                          );
                          toast({
                            title: "Onvoldoende Capaciteit",
                            description: `Combinaties dekken maar ${totalCombinationCapacity} van ${totalReservationCapacity} personen`,
                          });
                        }
                      } catch (error) {
                        console.error("Error fixing debug status:", error);
                        toast({
                          title: "Fout",
                          description: "Kon debug status niet corrigeren",
                          variant: "destructive",
                        });
                      }
                    } else {
                      console.log("No stored combinations found");
                      toast({
                        title: "Geen Combinaties",
                        description: "Geen combinaties gevonden voor analyse",
                      });
                    }
                  }}
                  className="bg-pink-50 hover:bg-pink-100"
                >
                  🔧 Fix Debug Status
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Clear all combinations for current date and period
                    const dateString = selectedDate.toISOString().split("T")[0];
                    const storageKey = `combinations_${dateString}_${selectedPeriod}`;
                    localStorage.removeItem(storageKey);
                    setActiveCombinations(new Set());
                    console.log(
                      "Manually cleared combinations for:",
                      storageKey
                    );
                    toast({
                      title: "Combinaties Gewist",
                      description: `Alle combinaties voor ${selectedPeriod} zijn gewist.`,
                    });
                  }}
                  className="bg-orange-50 hover:bg-orange-100"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Wis Combinaties
                </Button>
                {selectedRestaurant && (
                  <CreateTableModal restaurantId={selectedRestaurant.id} />
                )}
              </div>
            </div>

            {/* Period Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Dagdeel Selectie</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(DAY_PERIODS).map(([key, period]) => (
                    <Button
                      key={key}
                      variant={selectedPeriod === key ? "default" : "outline"}
                      onClick={() => setSelectedPeriod(key)}
                      className="flex flex-col items-center space-y-2 h-auto py-4"
                    >
                      <span className="font-medium">{period.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {period.start} - {period.end}
                      </span>
                      <Badge variant="secondary">
                        {dayReservations
                          .filter((r) => {
                            const time = r.reservation_time?.substring(0, 5);
                            return (
                              time >= period.start &&
                              time < period.end &&
                              r.status !== "cancelled"
                            );
                          })
                          .reduce((sum, r) => sum + r.party_size, 0)}
                        /{period.maxCapacity} personen
                      </Badge>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Totaal Tafels
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{tables.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Capaciteit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalCapacity}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-600">
                    Beschikbaar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statusStats.available}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-600">
                    Bezet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statusStats.occupied}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-yellow-600">
                    Gereserveerd
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statusStats.reserved}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-600">
                    Schoonmaken
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statusStats.cleaning}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-600">
                    <Users className="h-4 w-4 inline mr-1" />
                    {
                      DAY_PERIODS[selectedPeriod as keyof typeof DAY_PERIODS]
                        ?.name
                    }
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {periodCapacity.used}/{periodCapacity.total}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {periodCapacity.available} beschikbaar
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Floor Plan */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Interactive Floor Plan */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5" />
                      <span>
                        Interactieve Plattegrond -{" "}
                        {
                          DAY_PERIODS[
                            selectedPeriod as keyof typeof DAY_PERIODS
                          ]?.name
                        }
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="h-[600px] border rounded-lg overflow-hidden">
                      {tables.length === 0 || nodes.length === 0 ? (
                        <div className="flex items-center justify-center h-full bg-gray-50">
                          <div className="text-center text-muted-foreground">
                            <MapPin className="h-12 w-12 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                              {tables.length === 0
                                ? "Geen tafels gevonden"
                                : "Tafels laden..."}
                            </h3>
                            <p className="mb-4">
                              {tables.length === 0
                                ? "Voeg uw eerste tafel toe om te beginnen."
                                : "Even geduld, de tafels worden geladen..."}
                            </p>
                            <div className="text-xs text-muted-foreground mb-4">
                              Debug: restaurants={restaurants.length}, tables=
                              {tables.length}, nodes={nodes.length}, restaurant=
                              {selectedRestaurant?.id}
                            </div>
                            {selectedRestaurant && (
                              <CreateTableModal
                                restaurantId={selectedRestaurant.id}
                              />
                            )}
                          </div>
                        </div>
                      ) : (
                        <ReactFlow
                          key={`${
                            selectedDate.toISOString().split("T")[0]
                          }-${selectedPeriod}`}
                          nodes={nodes}
                          edges={edges}
                          onNodesChange={handleNodesChange}
                          onEdgesChange={onEdgesChange}
                          nodeTypes={nodeTypes}
                          fitView
                          style={{ backgroundColor: "#F7F9FB" }}
                          nodesDraggable={true}
                          nodesConnectable={false}
                          elementsSelectable={true}
                          onLoad={() => {
                            console.log(
                              "ReactFlow re-rendered with key:",
                              `${
                                selectedDate.toISOString().split("T")[0]
                              }-${selectedPeriod}`
                            );
                          }}
                        >
                          <Background />
                          <Controls />
                        </ReactFlow>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Table Details Panel */}
              <div className="space-y-6">
                {selectedTableData && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Tafel Details</CardTitle>
                      {!isEditingTable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTable(selectedTableData)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {isEditingTable ? (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="table_number">Tafelnummer</Label>
                            <Input
                              id="table_number"
                              value={editingTableData.table_number}
                              onChange={(e) =>
                                setEditingTableData((prev) => ({
                                  ...prev,
                                  table_number: e.target.value,
                                }))
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="capacity">
                              Capaciteit (personen)
                            </Label>
                            <Input
                              id="capacity"
                              type="number"
                              min="1"
                              max="20"
                              value={editingTableData.capacity}
                              onChange={(e) =>
                                setEditingTableData((prev) => ({
                                  ...prev,
                                  capacity: parseInt(e.target.value) || 1,
                                }))
                              }
                            />
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={handleSaveTableEdit}
                              className="flex-1"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Opslaan
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEdit}
                              className="flex-1"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Annuleren
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <h3 className="font-semibold text-lg">
                              {selectedTableData.table_number}
                            </h3>
                            <p className="text-muted-foreground">
                              Capaciteit: {selectedTableData.capacity} personen
                            </p>
                          </div>
                        </>
                      )}

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Status</label>
                        <Select
                          value={selectedTableData.status}
                          onValueChange={(value) =>
                            handleTableStatusChange(selectedTableData.id, value)
                          }
                          disabled={isEditingTable}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">
                              Beschikbaar
                            </SelectItem>
                            <SelectItem value="occupied">Bezet</SelectItem>
                            <SelectItem value="reserved">
                              Gereserveerd
                            </SelectItem>
                            <SelectItem value="cleaning">
                              Schoonmaken
                            </SelectItem>
                            <SelectItem value="out_of_order">
                              Buiten Dienst
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {!isEditingTable && (
                        <div className="pt-4 border-t">
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>
                              Positie: ({selectedTableData.position_x || 0},{" "}
                              {selectedTableData.position_y || 0})
                            </p>
                            <p>
                              Aangemaakt:{" "}
                              {new Date(
                                selectedTableData.created_at
                              ).toLocaleDateString("nl-NL")}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Legend */}
                <Card>
                  <CardHeader>
                    <CardTitle>Status Legenda</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded bg-green-500" />
                      <span className="text-sm">Beschikbaar</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded bg-red-500" />
                      <span className="text-sm">Bezet</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded bg-yellow-500" />
                      <span className="text-sm">Gereserveerd</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded bg-blue-500" />
                      <span className="text-sm">Schoonmaken</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded bg-gray-500" />
                      <span className="text-sm">Buiten Dienst</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Instructions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Instructies</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>• Sleep tafels om ze te verplaatsen</p>
                    <p>• Klik op een tafel om details te bekijken</p>
                    <p>• Gebruik de knoppen om posities op te slaan</p>
                    <p>• Zoom in/uit met het muiswiel</p>
                    <p>• Selecteer een dagdeel om reserveringen te filteren</p>
                    <p>
                      • Bevestigde reserveringen krijgen automatisch een tafel
                      toegewezen
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Table Combination Modal */}
      <TableCombinationModal
        isOpen={showCombinationModal}
        onClose={() => {
          setShowCombinationModal(false);
          setTableCombination(null);
        }}
        combination={tableCombination}
        tables={tables}
        onApplyCombination={handleApplyTableCombination}
      />
    </div>
  );
}
