import { useState } from "react";
import { Upload, FileText, AlertCircle, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCreateCustomer } from "@/hooks/useCustomers";

interface CsvImportModalProps {
  restaurantId: string;
}

interface ParsedCustomer {
  name: string;
  email?: string;
  phone?: string;
  professional_email?: string;
  professional_phone?: string;
  allergies?: string;
  allergies_tags?: string[];
  preferences?: string;
  notes?: string;
  first_name?: string;
  last_name?: string;
  address?: string;
  city?: string;
  zip?: string;
  country?: string;
  birthdate?: string;
  company?: string;
  language?: string;
  guest_status?: string;
  email_optin_marketing?: boolean;
  email_optin_registration_date?: string;
  sms_optin_marketing?: boolean;
  sms_optin_registration_date?: string;
  email_optin_reviews?: boolean;
  email_optin_reviews_registration_date?: string;
  sms_optin_reviews?: boolean;
  sms_optin_reviews_registration_date?: string;
  has_no_show?: boolean;
  is_blacklisted?: boolean;
  bookings_number?: number;
  created_at?: string;
  updated_at?: string;
}

export function CsvImportModal({ restaurantId }: CsvImportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [headerMapping, setHeaderMapping] = useState<Record<string, string>>({});
  const [rawCsvData, setRawCsvData] = useState<string[][]>([]);
  const [parsedData, setParsedData] = useState<ParsedCustomer[]>([]);
  const [showMapping, setShowMapping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{ success: number; failed: number } | null>(null);
  const { toast } = useToast();
  const createCustomer = useCreateCustomer();

  // Database field options for mapping
  const databaseFields = [
    { value: 'skip', label: 'Niet koppelen' },
    { value: 'name', label: 'Naam (verplicht)' },
    { value: 'first_name', label: 'Voornaam' },
    { value: 'last_name', label: 'Achternaam' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Telefoon' },
    { value: 'professional_email', label: 'Professioneel Email' },
    { value: 'professional_phone', label: 'Professioneel Telefoon' },
    { value: 'address', label: 'Adres' },
    { value: 'city', label: 'Stad' },
    { value: 'zip', label: 'Postcode' },
    { value: 'country', label: 'Land' },
    { value: 'birthdate', label: 'Geboortedatum' },
    { value: 'company', label: 'Bedrijf' },
    { value: 'language', label: 'Taal' },
    { value: 'guest_status', label: 'Gast Status' },
    { value: 'allergies', label: 'Allergieën' },
    { value: 'allergies_tags', label: 'Allergie Tags' },
    { value: 'notes', label: 'Notities' },
    { value: 'preferences', label: 'Voorkeuren' },
    { value: 'email_optin_marketing', label: 'Email Opt-in Marketing' },
    { value: 'email_optin_registration_date', label: 'Email Opt-in Registratie Datum' },
    { value: 'sms_optin_marketing', label: 'SMS Opt-in Marketing' },
    { value: 'sms_optin_registration_date', label: 'SMS Opt-in Registratie Datum' },
    { value: 'email_optin_reviews', label: 'Email Opt-in Reviews' },
    { value: 'email_optin_reviews_registration_date', label: 'Email Opt-in Reviews Registratie Datum' },
    { value: 'sms_optin_reviews', label: 'SMS Opt-in Reviews' },
    { value: 'sms_optin_reviews_registration_date', label: 'SMS Opt-in Reviews Registratie Datum' },
    { value: 'has_no_show', label: 'Heeft No-show' },
    { value: 'is_blacklisted', label: 'Is Geblokkeerd' },
    { value: 'bookings_number', label: 'Aantal Boekingen' },
    { value: 'created_at', label: 'Aangemaakt Op' },
    { value: 'updated_at', label: 'Bijgewerkt Op' },
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      parseCSVInitial(file);
    } else {
      toast({
        title: "Ongeldig bestand",
        description: "Selecteer een geldig CSV-bestand.",
        variant: "destructive",
      });
    }
  };

  const parseCSVInitial = async (file: File) => {
    try {
      console.log('Starting CSV parsing for file:', file.name);
      const text = await file.text();
      
      // Try both comma and semicolon as separators
      let lines = text.split('\n').filter(line => line.trim());
      let separator = ',';
      
      if (lines.length > 0) {
        const firstLine = lines[0];
        const commaCount = (firstLine.match(/,/g) || []).length;
        const semicolonCount = (firstLine.match(/;/g) || []).length;
        
        if (semicolonCount > commaCount) {
          separator = ';';
        }
      }
      
      if (lines.length === 0) {
        toast({
          title: "Leeg bestand",
          description: "Het CSV-bestand lijkt leeg te zijn.",
          variant: "destructive",
        });
        return;
      }
      
      // Parse headers
      const rawHeaders = lines[0].split(separator).map(h => h.trim().replace(/"/g, ''));
      setCsvHeaders(rawHeaders);
      
      // Store raw CSV data for later processing
      const csvData = lines.slice(1).map(line => 
        line.split(separator).map(v => v.trim().replace(/"/g, ''))
      );
      setRawCsvData(csvData);
      
      // Show mapping interface
      setShowMapping(true);
      
    } catch (error) {
      console.error('CSV parsing error:', error);
      toast({
        title: "Parsing fout",
        description: `Er is een fout opgetreden: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const processWithMapping = () => {
    try {
      const customers: ParsedCustomer[] = [];
      
      for (let i = 0; i < rawCsvData.length; i++) {
        const values = rawCsvData[i];
        const customer: ParsedCustomer = { name: '' };
        
        // Apply mapping
        csvHeaders.forEach((header, index) => {
          const dbField = headerMapping[header];
          const value = values[index] || '';
          
          if (dbField && dbField !== 'skip' && value) {
            switch (dbField) {
              case 'name':
                customer.name = value;
                break;
              case 'first_name':
                customer.first_name = value;
                break;
              case 'last_name':
                customer.last_name = value;
                break;
              case 'email':
                customer.email = value;
                break;
              case 'phone':
                customer.phone = value;
                break;
              case 'professional_email':
                customer.professional_email = value;
                break;
              case 'professional_phone':
                customer.professional_phone = value;
                break;
              case 'allergies':
                customer.allergies = value;
                break;
              case 'allergies_tags':
                customer.allergies_tags = value ? value.split(',').map(tag => tag.trim()) : [];
                break;
              case 'notes':
                customer.notes = value;
                break;
              case 'preferences':
                customer.preferences = value;
                break;
              case 'address':
                customer.address = value;
                break;
              case 'city':
                customer.city = value;
                break;
              case 'zip':
                customer.zip = value;
                break;
              case 'country':
                customer.country = value;
                break;
              case 'birthdate':
                customer.birthdate = value;
                break;
              case 'company':
                customer.company = value;
                break;
              case 'language':
                customer.language = value;
                break;
              case 'guest_status':
                customer.guest_status = value;
                break;
              case 'email_optin_marketing':
                customer.email_optin_marketing = value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
                break;
              case 'email_optin_registration_date':
                customer.email_optin_registration_date = value && value !== '-' && value !== '' ? value : undefined;
                break;
              case 'sms_optin_marketing':
                customer.sms_optin_marketing = value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
                break;
              case 'sms_optin_registration_date':
                customer.sms_optin_registration_date = value && value !== '-' && value !== '' ? value : undefined;
                break;
              case 'email_optin_reviews':
                customer.email_optin_reviews = value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
                break;
              case 'email_optin_reviews_registration_date':
                customer.email_optin_reviews_registration_date = value && value !== '-' && value !== '' ? value : undefined;
                break;
              case 'sms_optin_reviews':
                customer.sms_optin_reviews = value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
                break;
              case 'sms_optin_reviews_registration_date':
                customer.sms_optin_reviews_registration_date = value && value !== '-' && value !== '' ? value : undefined;
                break;
              case 'has_no_show':
                customer.has_no_show = value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
                break;
              case 'is_blacklisted':
                customer.is_blacklisted = value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
                break;
              case 'bookings_number':
                customer.bookings_number = parseInt(value) || 0;
                break;
              case 'created_at':
                customer.created_at = value;
                break;
              case 'updated_at':
                customer.updated_at = value;
                break;
            }
          }
        });
        
        // Create full name from first and last name if no direct name
        if (!customer.name && (customer.first_name || customer.last_name)) {
          customer.name = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
        }
        
        // Accept customer if they have at least some identifying information
        if (customer.name || customer.email || customer.phone) {
          // Ensure we have a name
          if (!customer.name) {
            if (customer.email) {
              customer.name = customer.email.split('@')[0];
            } else if (customer.phone) {
              customer.name = `Gast ${customer.phone}`;
            } else {
              customer.name = `Gast ${i + 1}`;
            }
          }
          
          customers.push(customer);
        }
      }
      
      setParsedData(customers);
      setShowMapping(false);
      
      if (customers.length === 0) {
        toast({
          title: "Geen geldige gegevens",
          description: "Geen geldige gastgegevens gevonden met de huidige mapping.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Verwerkingsfout",
        description: `Er is een fout opgetreden: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (!parsedData.length) return;
    
    setIsUploading(true);
    let successCount = 0;
    let failedCount = 0;
    
    // Process in batches of 100 to avoid hitting limits
    const batchSize = 100;
    const totalBatches = Math.ceil(parsedData.length / batchSize);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, parsedData.length);
      const batch = parsedData.slice(batchStart, batchEnd);
      
      // Process batch with delay between batches
      for (const customer of batch) {
        try {
          await createCustomer.mutateAsync({
            ...customer,
            restaurant_id: restaurantId,
          });
          successCount++;
        } catch (error) {
          console.error('Customer import error:', error);
          failedCount++;
        }
      }
      
      // Small delay between batches to prevent overwhelming the database
      if (batchIndex < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    setUploadResults({ success: successCount, failed: failedCount });
    setIsUploading(false);
    
    if (successCount > 0) {
      toast({
        title: "Import voltooid",
        description: `${successCount} gasten succesvol geïmporteerd.`,
      });
    }
    
    if (failedCount > 0) {
      toast({
        title: "Gedeeltelijke import",
        description: `${failedCount} gasten konden niet worden geïmporteerd.`,
        variant: "destructive",
      });
    }
  };

  const resetModal = () => {
    setCsvFile(null);
    setCsvHeaders([]);
    setHeaderMapping({});
    setRawCsvData([]);
    setParsedData([]);
    setShowMapping(false);
    setUploadResults(null);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <Upload className="h-4 w-4" />
          <span>CSV Importeren</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gasten importeren via CSV</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {!csvFile && (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  CSV-bestand moet kolommen bevatten: naam (verplicht), email, telefoon, allergieën, voorkeuren, notities
                </AlertDescription>
              </Alert>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">CSV-bestand selecteren</h3>
                    <p className="text-muted-foreground mb-4">
                      Upload een CSV-bestand met uw gastenlijst
                    </p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label htmlFor="csv-upload">
                      <Button asChild className="cursor-pointer">
                        <span>Bestand kiezen</span>
                      </Button>
                    </label>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          
          {showMapping && csvHeaders.length > 0 && (
            <div className="space-y-4">
              <Alert>
                <ArrowRight className="h-4 w-4" />
                <AlertDescription>
                  Koppel de CSV kolommen aan de database velden
                </AlertDescription>
              </Alert>
              
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-4">Header Mapping</h4>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {csvHeaders.map((header, index) => (
                      <div key={index} className="flex items-center justify-between gap-4 p-3 border rounded">
                        <div className="flex-1">
                          <span className="font-medium text-sm">{header}</span>
                          {rawCsvData[0] && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Voorbeeld: {rawCsvData[0][index] || 'Leeg'}
                            </div>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <Select
                            value={headerMapping[header] || 'skip'}
                            onValueChange={(value) => 
                              setHeaderMapping(prev => ({ ...prev, [header]: value }))
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecteer veld" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border shadow-md z-50">
                              {databaseFields.map((field) => (
                                <SelectItem key={field.value} value={field.value}>
                                  {field.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between mt-4">
                    <Button variant="outline" onClick={resetModal}>
                      Annuleren
                    </Button>
                    <Button onClick={processWithMapping}>
                      Doorgaan met Mapping
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {csvFile && parsedData.length > 0 && !uploadResults && !showMapping && (
            <div className="space-y-4">
              <Alert>
                <Check className="h-4 w-4" />
                <AlertDescription>
                  {parsedData.length} gasten gevonden in het CSV-bestand
                </AlertDescription>
              </Alert>
              
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Voorbeeld van gevonden gegevens:</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {parsedData.slice(0, 5).map((customer, index) => (
                      <div key={index} className="text-sm bg-muted p-2 rounded">
                        <span className="font-medium">{customer.name}</span>
                        {customer.email && <span className="ml-2 text-muted-foreground">({customer.email})</span>}
                      </div>
                    ))}
                    {parsedData.length > 5 && (
                      <div className="text-sm text-muted-foreground">
                        ... en {parsedData.length - 5} meer
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={resetModal}>
                  Annuleren
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={isUploading}
                  className="flex items-center space-x-2"
                >
                  {isUploading ? (
                    <span>Importeren...</span>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Importeer {parsedData.length} gasten</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {uploadResults && (
            <div className="space-y-4">
              <Alert>
                <Check className="h-4 w-4" />
                <AlertDescription>
                  Import voltooid: {uploadResults.success} succesvol, {uploadResults.failed} mislukt
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-center">
                <Button onClick={resetModal}>
                  Sluiten
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}