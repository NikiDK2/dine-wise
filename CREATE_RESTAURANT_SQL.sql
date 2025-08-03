-- SQL script om een test restaurant aan te maken
-- Voer dit uit in je Supabase SQL editor

-- Eerst een test gebruiker aanmaken (als die nog niet bestaat)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'test@restaurant.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Profiel aanmaken voor de gebruiker
INSERT INTO public.profiles (
  id,
  email,
  full_name
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'test@restaurant.com',
  'Test Restaurant Owner'
) ON CONFLICT (id) DO NOTHING;

-- Restaurant rol toewijzen
INSERT INTO public.user_roles (
  user_id,
  role
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'restaurant_owner'
) ON CONFLICT (user_id, role) DO NOTHING;

-- Test restaurant aanmaken
INSERT INTO public.restaurants (
  id,
  owner_id,
  name,
  description,
  address,
  phone,
  email,
  cuisine_type,
  opening_hours,
  settings
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440000',
  'Test Restaurant',
  'Een test restaurant voor development',
  'Teststraat 123, 1234 AB Amsterdam',
  '+31612345678',
  'info@testrestaurant.com',
  'Nederlands',
  '{
    "monday": {"open": "17:00", "close": "22:00"},
    "tuesday": {"open": "17:00", "close": "22:00"},
    "wednesday": {"open": "17:00", "close": "22:00"},
    "thursday": {"open": "17:00", "close": "22:00"},
    "friday": {"open": "17:00", "close": "23:00"},
    "saturday": {"open": "17:00", "close": "23:00"},
    "sunday": {"open": "17:00", "close": "22:00"}
  }',
  '{
    "max_party_size": 20,
    "min_party_size": 1,
    "max_reservations_per_slot": 10,
    "reservation_duration_minutes": 120,
    "large_group_threshold": 6
  }'
) ON CONFLICT (id) DO NOTHING;

-- Test tafels aanmaken
INSERT INTO public.restaurant_tables (
  restaurant_id,
  table_number,
  capacity,
  position_x,
  position_y,
  status
) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'T1', 2, 100, 100, 'available'),
  ('550e8400-e29b-41d4-a716-446655440000', 'T2', 4, 200, 100, 'available'),
  ('550e8400-e29b-41d4-a716-446655440000', 'T3', 6, 300, 100, 'available'),
  ('550e8400-e29b-41d4-a716-446655440000', 'T4', 8, 400, 100, 'available'),
  ('550e8400-e29b-41d4-a716-446655440000', 'T5', 2, 100, 200, 'available'),
  ('550e8400-e29b-41d4-a716-446655440000', 'T6', 4, 200, 200, 'available'),
  ('550e8400-e29b-41d4-a716-446655440000', 'T7', 6, 300, 200, 'available'),
  ('550e8400-e29b-41d4-a716-446655440000', 'T8', 8, 400, 200, 'available');

-- Controleer of alles is aangemaakt
SELECT 
  r.id as restaurant_id,
  r.name as restaurant_name,
  COUNT(rt.id) as aantal_tafels,
  SUM(rt.capacity) as totale_capaciteit
FROM public.restaurants r
LEFT JOIN public.restaurant_tables rt ON r.id = rt.restaurant_id
WHERE r.id = '550e8400-e29b-41d4-a716-446655440000'
GROUP BY r.id, r.name; 