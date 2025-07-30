import { useState, useRef, useEffect } from 'react';
import { useSearchCustomers } from '@/hooks/useCustomers';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Search, User } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface CustomerSearchProps {
  restaurantId: string;
  onCustomerSelect: (customer: Customer) => void;
  placeholder?: string;
  label?: string;
}

export function CustomerSearch({ 
  restaurantId, 
  onCustomerSelect, 
  placeholder = "Zoek klant op naam...",
  label = "Zoek Klant"
}: CustomerSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: customers = [], isLoading } = useSearchCustomers(restaurantId, searchTerm);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    setSelectedCustomer(null);
    setIsOpen(value.length >= 2);
  };

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSearchTerm(customer.name);
    setIsOpen(false);
    onCustomerSelect(customer);
  };

  const handleInputFocus = () => {
    if (searchTerm.length >= 2) {
      setIsOpen(true);
    }
  };

  return (
    <div className="space-y-2 relative">
      <Label>{label}</Label>
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={searchTerm}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className="pl-9"
          />
        </div>

        {isOpen && (
          <div 
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 z-50 bg-popover border border-border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto"
          >
            {isLoading ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                Zoeken...
              </div>
            ) : customers.length > 0 ? (
              <div className="py-1">
                {customers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => handleCustomerClick(customer)}
                    className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{customer.name}</div>
                        {customer.email && (
                          <div className="text-xs text-muted-foreground truncate">
                            {customer.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchTerm.length >= 2 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                Geen klanten gevonden
              </div>
            ) : null}
          </div>
        )}
      </div>
      
      {selectedCustomer && (
        <div className="text-xs text-muted-foreground">
          Geselecteerd: {selectedCustomer.name}
          {selectedCustomer.email && ` (${selectedCustomer.email})`}
        </div>
      )}
    </div>
  );
}