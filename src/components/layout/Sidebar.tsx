import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  Utensils,
  CreditCard,
  BarChart3,
  Settings,
  Home,
  Clock,
  MessageSquare,
  FileText,
  CalendarDays,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home, badge: undefined },
  { name: "Reserveringen", href: "/reservations", icon: Calendar, badge: "12" },
  {
    name: "Plattegrond",
    href: "/floor-plan",
    icon: Utensils,
    badge: undefined,
  },
  { name: "Gasten", href: "/guests", icon: Users, badge: undefined },
  { name: "Wachtlijst", href: "/waitlist", icon: Clock, badge: "3" },
  { name: "Betalingen", href: "/payments", icon: CreditCard, badge: undefined },
  { name: "Reviews", href: "/reviews", icon: MessageSquare, badge: undefined },
  { name: "Agenda", href: "/agenda", icon: CalendarDays, badge: undefined },
  { name: "Rapporten", href: "/reports", icon: BarChart3, badge: undefined },
  { name: "Instellingen", href: "/settings", icon: Settings, badge: undefined },
];

const quickStats = [
  { label: "Reserveringen vandaag", value: "47", status: "confirmed" as const },
  { label: "Beschikbare tafels", value: "8", status: "available" as const },
  { label: "Wachtlijst", value: "3", status: "pending" as const },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isCurrentPath = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div
      className={cn(
        "bg-card border-r border-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {/* New Restaurant Button */}
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start gap-3 transition-all duration-200",
            collapsed && "px-2"
          )}
          onClick={() => navigate("/create-restaurant")}
        >
          <Plus className="h-5 w-5 flex-shrink-0" />
          {!collapsed && (
            <span className="flex-1 text-left">Nieuw Restaurant</span>
          )}
        </Button>

        <div className="space-y-1">
          {navigation.map((item) => {
            const isCurrent = isCurrentPath(item.href);
            return (
              <Button
                key={item.name}
                variant={isCurrent ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 transition-all duration-200",
                  isCurrent &&
                    "bg-primary text-primary-foreground shadow-status",
                  collapsed && "px-2"
                )}
                onClick={() => navigate(item.href)}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.badge && (
                      <StatusBadge variant="pending" size="sm">
                        {item.badge}
                      </StatusBadge>
                    )}
                  </>
                )}
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Quick Stats */}
      {!collapsed && (
        <div className="p-4 border-t border-border">
          <h3 className="text-sm font-medium text-foreground mb-3">
            Snelle weergave
          </h3>
          <div className="space-y-3">
            {quickStats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-semibold text-foreground">
                    {stat.value}
                  </p>
                </div>
                <StatusBadge variant={stat.status} size="sm">
                  {stat.status}
                </StatusBadge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full"
        >
          <FileText className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Inklappen</span>}
        </Button>
      </div>
    </div>
  );
}
