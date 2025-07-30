-- Add additional customer fields for comprehensive guest management
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS guest_status text,
ADD COLUMN IF NOT EXISTS email_optin_marketing boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS email_optin_registration_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS sms_optin_marketing boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_optin_registration_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS email_optin_reviews boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS email_optin_reviews_registration_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS sms_optin_reviews boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_optin_reviews_registration_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS professional_email text,
ADD COLUMN IF NOT EXISTS professional_phone text,
ADD COLUMN IF NOT EXISTS language text,
ADD COLUMN IF NOT EXISTS has_no_show boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_blacklisted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS allergies_tags text[],
ADD COLUMN IF NOT EXISTS bookings_number integer DEFAULT 0;