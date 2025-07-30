-- Add additional columns to customers table for CSV import
ALTER TABLE public.customers 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT,
ADD COLUMN address TEXT,
ADD COLUMN city TEXT,
ADD COLUMN zip TEXT,
ADD COLUMN country TEXT,
ADD COLUMN birthdate DATE,
ADD COLUMN company TEXT;