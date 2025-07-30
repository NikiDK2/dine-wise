import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Clock, Users, UserPlus, Phone, Mail, MoreVertical, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useRestaurants } from "@/hooks/useRestaurants";
import { useWaitlist, useUpdateWaitlistEntry, useDeleteWaitlistEntry } from "@/hooks/useWaitlist";
import { CreateWaitlistModal } from "@/components/waitlist/CreateWaitlistModal";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export default function Waitlist() {
  const { data: restaurants } = useRestaurants();
  const restaurant = restaurants?.[0];
  const { data: waitlist = [] } = useWaitlist(restaurant?.id);
  const updateWaitlistEntry = useUpdateWaitlistEntry();
  const deleteWaitlistEntry = useDeleteWaitlistEntry();

  const waitingEntries = waitlist.filter(entry => entry.status === 'waiting');
  const todayEntries = waitlist.filter(entry => 
    entry.preferred_date === new Date().toISOString().split('T')[0]
  );

  const handleStatusUpdate = async (entryId: string, status: string) => {
    await updateWaitlistEntry.mutateAsync({
      id: entryId,
      updates: { status: status as any }
    });
  };

  const handleDelete = async (entryId: string) => {
    await deleteWaitlistEntry.mutateAsync(entryId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'default';
      case 'contacted': return 'secondary';
      case 'confirmed': return 'outline';
      case 'expired': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'waiting': return 'Wachtend';
      case 'contacted': return 'Gecontacteerd';
      case 'confirmed': return 'Bevestigd';
      case 'expired': return 'Verlopen';
      default: return status;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Wachtlijst</h1>
              <p className="text-muted-foreground">
                Beheer klanten die op een plek wachten
              </p>
            </div>
            {restaurant && <CreateWaitlistModal restaurantId={restaurant.id} />}
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <StatsCard
              title="Wachtenden"
              value={waitingEntries.length.toString()}
              description="Klanten in de wachtlijst"
              icon={Users}
              trend="neutral"
            />
            <StatsCard
              title="Gemiddelde Wachttijd"
              value="15 min"
              description="Geschatte wachttijd"
              icon={Clock}
              trend="neutral"
            />
            <StatsCard
              title="Vandaag"
              value={todayEntries.length.toString()}
              description="Entries voor vandaag"
              icon={UserPlus}
              trend="neutral"
            />
          </div>

          {waitlist.length === 0 ? (
            <div className="bg-card rounded-lg border p-8 text-center">
              <h3 className="text-lg font-medium mb-2">Geen klanten in de wachtlijst</h3>
              <p className="text-muted-foreground mb-4">
                Er zijn momenteel geen klanten die wachten op een tafel.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {waitlist.map((entry) => (
                <Card key={entry.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{entry.customer_name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusColor(entry.status)}>
                          {getStatusLabel(entry.status)}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleStatusUpdate(entry.id, 'contacted')}
                            >
                              Markeer als gecontacteerd
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusUpdate(entry.id, 'confirmed')}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Markeer als bevestigd
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusUpdate(entry.id, 'expired')}
                            >
                              Markeer als verlopen
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(entry.id)}
                              className="text-destructive"
                            >
                              Verwijderen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Datum:</span>
                        <p className="text-muted-foreground">
                          {format(new Date(entry.preferred_date), 'dd MMM yyyy', { locale: nl })}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Tijd:</span>
                        <p className="text-muted-foreground">{entry.preferred_time}</p>
                      </div>
                      <div>
                        <span className="font-medium">Personen:</span>
                        <p className="text-muted-foreground">{entry.party_size}</p>
                      </div>
                      <div>
                        <span className="font-medium">Toegevoegd:</span>
                        <p className="text-muted-foreground">
                          {format(new Date(entry.created_at), 'dd MMM HH:mm', { locale: nl })}
                        </p>
                      </div>
                    </div>
                    
                    {(entry.customer_email || entry.customer_phone) && (
                      <div className="flex items-center space-x-4 mt-4 pt-4 border-t">
                        {entry.customer_email && (
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>{entry.customer_email}</span>
                          </div>
                        )}
                        {entry.customer_phone && (
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{entry.customer_phone}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {entry.notes && (
                      <div className="mt-4 pt-4 border-t">
                        <span className="font-medium text-sm">Opmerkingen:</span>
                        <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}