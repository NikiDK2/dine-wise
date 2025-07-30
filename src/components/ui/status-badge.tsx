import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-all duration-200",
  {
    variants: {
      variant: {
        available: "bg-status-available/10 text-status-available ring-status-available/20",
        occupied: "bg-status-occupied/10 text-status-occupied ring-status-occupied/20",
        reserved: "bg-status-reserved/10 text-status-reserved ring-status-reserved/20",
        cleaning: "bg-status-cleaning/10 text-status-cleaning ring-status-cleaning/20",
        confirmed: "bg-primary/10 text-primary ring-primary/20",
        pending: "bg-accent/10 text-accent-foreground ring-accent/20",
        seated: "bg-status-occupied/10 text-status-occupied ring-status-occupied/20",
        completed: "bg-status-available/10 text-status-available ring-status-available/20",
        cancelled: "bg-muted/10 text-muted-foreground ring-muted/20",
        no_show: "bg-status-occupied/10 text-status-occupied ring-status-occupied/20"
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-3 py-1 text-xs", 
        lg: "px-4 py-1.5 text-sm"
      }
    },
    defaultVariants: {
      variant: "available",
      size: "md"
    }
  }
)

export interface StatusBadgeProps 
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <span
        className={cn(statusBadgeVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
StatusBadge.displayName = "StatusBadge"

export { StatusBadge, statusBadgeVariants }