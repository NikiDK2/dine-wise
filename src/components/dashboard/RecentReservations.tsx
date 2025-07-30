import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Phone, Mail, Plus } from "lucide-react"
import { Reservation } from "@/hooks/useReservations"

interface RecentReservationsProps {
  reservations: Reservation[];
  selectedDate?: Date;
}

export function RecentReservations({ reservations, selectedDate = new Date() }: RecentReservationsProps) {
  const displayReservations = reservations.slice(0, 4); // Show only first 4
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  
  return (
    <Card className="bg-gradient-card shadow-elegant">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          {isToday ? "Today's Reservations" : `Reservations for ${selectedDate.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayReservations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              {isToday ? "No reservations for today yet" : "No reservations for this day"}
            </p>
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Reservation
            </Button>
          </div>
        ) : (
          displayReservations.map((reservation) => (
            <div key={reservation.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50 transition-all duration-200 hover:bg-muted/50">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {reservation.customer_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-foreground">{reservation.customer_name}</p>
                    <StatusBadge variant={reservation.status} size="sm">
                      {reservation.status}
                    </StatusBadge>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span>{reservation.reservation_time}</span>
                    <span>•</span>
                    <span>{reservation.party_size} guests</span>
                    <span>•</span>
                    <span>Table {reservation.restaurant_tables?.table_number || 'TBD'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {reservation.customer_phone && (
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Phone className="h-4 w-4" />
                  </Button>
                )}
                {reservation.customer_email && (
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Mail className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
        
        <Button variant="outline" className="w-full mt-4 transition-all duration-200 hover:bg-primary/5">
          View All Reservations
        </Button>
      </CardContent>
    </Card>
  )
}