-- Create waitlist table
CREATE TABLE public.waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  party_size INTEGER NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TIME NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'contacted', 'confirmed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Restaurant members can manage waitlist" 
ON public.waitlist 
FOR ALL 
USING (restaurant_id IN (SELECT get_user_restaurants(auth.uid())));

-- Add trigger for timestamps
CREATE TRIGGER update_waitlist_updated_at
BEFORE UPDATE ON public.waitlist
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-promote from waitlist when reservation is cancelled
CREATE OR REPLACE FUNCTION public.handle_reservation_cancellation()
RETURNS TRIGGER AS $$
DECLARE
  waitlist_entry RECORD;
BEGIN
  -- Only process if status changed to cancelled
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    -- Find the best waitlist candidate
    SELECT * INTO waitlist_entry
    FROM public.waitlist
    WHERE restaurant_id = NEW.restaurant_id
      AND preferred_date = NEW.reservation_date
      AND preferred_time <= NEW.reservation_time
      AND party_size <= NEW.party_size
      AND status = 'waiting'
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- If we found a candidate, convert them to a reservation
    IF waitlist_entry.id IS NOT NULL THEN
      -- Create new reservation
      INSERT INTO public.reservations (
        restaurant_id,
        customer_name,
        customer_email,
        customer_phone,
        party_size,
        reservation_date,
        reservation_time,
        status,
        notes,
        created_by
      ) VALUES (
        waitlist_entry.restaurant_id,
        waitlist_entry.customer_name,
        waitlist_entry.customer_email,
        waitlist_entry.customer_phone,
        waitlist_entry.party_size,
        waitlist_entry.preferred_date,
        waitlist_entry.preferred_time,
        'confirmed',
        COALESCE(waitlist_entry.notes, '') || ' (Promoted from waitlist)',
        auth.uid()
      );
      
      -- Update waitlist entry status
      UPDATE public.waitlist
      SET status = 'confirmed', updated_at = now()
      WHERE id = waitlist_entry.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;