import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon: LucideIcon
  description?: string
  className?: string
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  trend = 'neutral', 
  icon: Icon, 
  description,
  className 
}: StatsCardProps) {
  return (
    <Card className={cn("bg-gradient-card shadow-elegant transition-all duration-200 hover:shadow-status", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="bg-primary/10 p-2 rounded-lg">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end space-x-2">
          <div className="text-3xl font-bold text-foreground">{value}</div>
          {change && (
            <div className={cn(
              "text-sm font-medium",
              trend === 'up' && "text-status-available",
              trend === 'down' && "text-status-occupied", 
              trend === 'neutral' && "text-muted-foreground"
            )}>
              {change}
            </div>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}