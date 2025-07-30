-- Fix function search path security issue
ALTER FUNCTION public.handle_reservation_cancellation() SET search_path = 'public';

-- Add trigger to reservations table for auto-promotion
CREATE TRIGGER reservation_cancellation_trigger
AFTER UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.handle_reservation_cancellation();