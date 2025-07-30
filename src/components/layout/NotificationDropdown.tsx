import { useState } from "react";
import {
  Bell,
  Check,
  Clock,
  Users,
  Star,
  Settings,
  X,
  MoreVertical,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  useNotifications,
  useMarkNotificationRead,
  useNotificationSubscription,
} from "@/hooks/useNotifications";
import { useRestaurants } from "@/hooks/useRestaurants";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

export function NotificationDropdown() {
  const navigate = useNavigate();
  const { data: restaurants = [] } = useRestaurants();
  const restaurant = restaurants[0];
  const { data: notifications = [] } = useNotifications(restaurant?.id);
  const markAsRead = useMarkNotificationRead();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("unread");

  // Subscribe to real-time notifications
  useNotificationSubscription(restaurant?.id);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Filter notifications based on active tab
  const filteredNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "table_combination_needed":
        return <Users className="h-4 w-4 text-orange-500" />;
      case "capacity_exceeded":
        return <Clock className="h-4 w-4 text-red-500" />;
      case "large_party_request":
        return <Users className="h-4 w-4 text-purple-500" />;
      case "waitlist_conversion":
        return <Check className="h-4 w-4 text-green-500" />;
      case "manual_assignment_required":
        return <Bell className="h-4 w-4 text-yellow-500" />;
      case "review":
        return <Star className="h-4 w-4 text-blue-500" />;
      case "reservation_confirmed":
        return <Check className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const handleMarkAsRead = async (
    notificationId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    await markAsRead.mutateAsync(notificationId);
  };

  const handleNotificationClick = async (notification: any) => {
    // Mark as read first
    if (!notification.is_read) {
      await markAsRead.mutateAsync(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case "table_combination_needed":
      case "capacity_exceeded":
      case "manual_assignment_required":
        // Navigate to floor plan for table management
        navigate("/floor-plan");
        break;
      case "large_party_request":
        // Navigate to reservations for large party handling
        navigate("/reservations");
        break;
      case "waitlist_conversion":
        // Navigate to waitlist
        navigate("/waitlist");
        break;
      default:
        // Default to reservations page
        navigate("/reservations");
        break;
    }

    setIsOpen(false);
  };

  const handleActivateTableCombination = async (
    combo: any,
    notification: any
  ) => {
    try {
      // Mark notification as read
      if (!notification.is_read) {
        await markAsRead.mutateAsync(notification.id);
      }

      // Navigate to floor plan with the selected combination
      const comboData = encodeURIComponent(JSON.stringify(combo));
      navigate(`/floor-plan?combination=${comboData}`);

      setIsOpen(false);

      // Show success toast
      toast({
        title: "Tafel Combinatie Geactiveerd",
        description: `Tafels ${combo.table_numbers.join(
          ", "
        )} zijn gecombineerd voor ${combo.total_capacity} plaatsen.`,
      });
    } catch (error) {
      toast({
        title: "Fout",
        description: "Kon tafel combinatie niet activeren",
        variant: "destructive",
      });
    }
  };

  const handleCustomTableCombination = async (notification: any) => {
    try {
      // Mark notification as read
      if (!notification.is_read) {
        await markAsRead.mutateAsync(notification.id);
      }

      // Navigate to floor plan for custom combination
      navigate("/floor-plan?custom-combination=true");

      setIsOpen(false);

      toast({
        title: "Eigen Combinatie",
        description:
          "Je kunt nu je eigen tafel combinatie instellen op de plattegrond.",
      });
    } catch (error) {
      toast({
        title: "Fout",
        description: "Kon niet naar plattegrond navigeren",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-[600px]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-lg">Meldingen</h3>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "all"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("all")}
          >
            Alle
          </button>
          <button
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "unread"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("unread")}
          >
            Ongelezen
          </button>
        </div>

        {/* Notifications List */}
        <div className="max-h-[400px] overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">
                {activeTab === "unread"
                  ? "Geen ongelezen meldingen"
                  : "Geen meldingen"}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start space-x-3 p-4 hover:bg-accent transition-colors cursor-pointer border-b last:border-b-0"
                onClick={() => handleNotificationClick(notification)}
              >
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    {getNotificationIcon(notification.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${
                          notification.is_read
                            ? "text-muted-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(
                            new Date(notification.created_at),
                            {
                              addSuffix: true,
                              locale: nl,
                            }
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1 ml-2">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Additional data for specific notification types */}
                  {notification.type === "table_combination_needed" &&
                    notification.data?.suggested_combinations && (
                      <div className="w-full mt-2 p-2 bg-muted rounded-md">
                        <p className="text-xs font-medium mb-1">
                          Voorgestelde tafel combinaties:
                        </p>
                        {notification.data.suggested_combinations
                          .slice(0, 2)
                          .map((combo: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-center justify-between py-1"
                            >
                              <span className="text-xs text-muted-foreground">
                                • Tafels {combo.table_numbers.join(", ")} (
                                {combo.total_capacity} plaatsen)
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleActivateTableCombination(
                                    combo,
                                    notification
                                  );
                                }}
                              >
                                Activeren
                              </Button>
                            </div>
                          ))}
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCustomTableCombination(notification);
                            }}
                          >
                            Eigen combinatie instellen
                          </Button>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
