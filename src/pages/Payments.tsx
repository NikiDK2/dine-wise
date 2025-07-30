import { useState } from "react";
import { CreditCard, Search, Filter, TrendingUp, Euro, Calendar, CheckCircle, XCircle, Clock, RotateCcw } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useRestaurants } from "@/hooks/useRestaurants";
import { usePayments, usePaymentStats } from "@/hooks/usePayments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export default function Payments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: restaurants = [] } = useRestaurants();
  const selectedRestaurant = restaurants[0];
  const { data: payments = [] } = usePayments(selectedRestaurant?.id);
  const { data: stats } = usePaymentStats(selectedRestaurant?.id);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'refunded':
        return <RotateCcw className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Voltooid';
      case 'pending':
        return 'In Behandeling';
      case 'failed':
        return 'Mislukt';
      case 'refunded':
        return 'Terugbetaald';
      default:
        return 'Onbekend';
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'refunded':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatAmount = (amountCents: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: currency,
    }).format(amountCents / 100);
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: nl });
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.stripe_payment_intent_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const todayPayments = payments.filter(payment => {
    const paymentDate = new Date(payment.created_at);
    const today = new Date();
    return paymentDate.toDateString() === today.toDateString();
  });

  const thisMonthPayments = payments.filter(payment => {
    const paymentDate = new Date(payment.created_at);
    const now = new Date();
    return paymentDate.getMonth() === now.getMonth() && 
           paymentDate.getFullYear() === now.getFullYear();
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Betalingen</h1>
                <p className="text-muted-foreground">Bekijk en beheer betalingstransacties</p>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Totale Omzet</CardTitle>
                  <Euro className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats ? formatAmount(stats.totalRevenue) : '€0,00'}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vandaag</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats ? formatAmount(stats.todayRevenue) : '€0,00'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {todayPayments.length} transacties
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Deze Maand</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats ? formatAmount(stats.thisMonthRevenue) : '€0,00'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {thisMonthPayments.length} transacties
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Totale Transacties</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.totalTransactions || 0}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Succesvol</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.completedTransactions || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats && stats.totalTransactions > 0 
                      ? `${Math.round((stats.completedTransactions / stats.totalTransactions) * 100)}%`
                      : '0%'
                    } slaagkans
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="all">Alle Betalingen ({payments.length})</TabsTrigger>
                  <TabsTrigger value="today">Vandaag ({todayPayments.length})</TabsTrigger>
                  <TabsTrigger value="month">Deze Maand ({thisMonthPayments.length})</TabsTrigger>
                </TabsList>
                
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Zoek betalingen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-60"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Statussen</SelectItem>
                      <SelectItem value="completed">Voltooid</SelectItem>
                      <SelectItem value="pending">In Behandeling</SelectItem>
                      <SelectItem value="failed">Mislukt</SelectItem>
                      <SelectItem value="refunded">Terugbetaald</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <TabsContent value="all" className="space-y-4">
                <div className="space-y-4">
                  {filteredPayments.map((payment) => (
                    <Card key={payment.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(payment.status)}
                              <span className="font-mono text-sm text-muted-foreground">
                                #{payment.id.slice(0, 8)}...
                              </span>
                              <Badge variant={getStatusVariant(payment.status)}>
                                {getStatusLabel(payment.status)}
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Aangemaakt: {formatDateTime(payment.created_at)}</p>
                              {payment.paid_at && (
                                <p>Betaald: {formatDateTime(payment.paid_at)}</p>
                              )}
                              {payment.payment_method && (
                                <p>Methode: {payment.payment_method}</p>
                              )}
                              {payment.stripe_payment_intent_id && (
                                <p className="font-mono">Stripe ID: {payment.stripe_payment_intent_id}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              {formatAmount(payment.amount_cents, payment.currency)}
                            </div>
                            {payment.reservation_id && (
                              <p className="text-sm text-muted-foreground">
                                Reservering gekoppeld
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {filteredPayments.length === 0 && (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Geen betalingen gevonden</h3>
                        <p className="text-muted-foreground">
                          {searchTerm || statusFilter !== 'all' 
                            ? 'Probeer uw zoek- of filtercriteria aan te passen.'
                            : 'Er zijn nog geen betalingen geregistreerd.'
                          }
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="today" className="space-y-4">
                <div className="space-y-4">
                  {todayPayments.map((payment) => (
                    <Card key={payment.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(payment.status)}
                            <span className="font-mono text-sm">#{payment.id.slice(0, 8)}...</span>
                            <Badge variant={getStatusVariant(payment.status)}>
                              {getStatusLabel(payment.status)}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {formatAmount(payment.amount_cents, payment.currency)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(payment.created_at), 'HH:mm', { locale: nl })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="month" className="space-y-4">
                <div className="space-y-4">
                  {thisMonthPayments.map((payment) => (
                    <Card key={payment.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(payment.status)}
                            <span className="font-mono text-sm">#{payment.id.slice(0, 8)}...</span>
                            <Badge variant={getStatusVariant(payment.status)}>
                              {getStatusLabel(payment.status)}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {formatAmount(payment.amount_cents, payment.currency)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(payment.created_at), 'dd MMM HH:mm', { locale: nl })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}