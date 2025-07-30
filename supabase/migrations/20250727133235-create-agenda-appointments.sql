-- Create agenda_appointments table
CREATE TABLE IF NOT EXISTS agenda_appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed')),
  type TEXT NOT NULL DEFAULT 'reservation' CHECK (type IN ('reservation', 'meeting', 'event', 'maintenance')),
  party_size INTEGER,
  table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  notes TEXT,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agenda_appointments_restaurant_id ON agenda_appointments(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_agenda_appointments_start_time ON agenda_appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_agenda_appointments_end_time ON agenda_appointments(end_time);
CREATE INDEX IF NOT EXISTS idx_agenda_appointments_status ON agenda_appointments(status);
CREATE INDEX IF NOT EXISTS idx_agenda_appointments_type ON agenda_appointments(type);
CREATE INDEX IF NOT EXISTS idx_agenda_appointments_customer_name ON agenda_appointments(customer_name);
CREATE INDEX IF NOT EXISTS idx_agenda_appointments_customer_email ON agenda_appointments(customer_email);

-- Create composite index for date range queries
CREATE INDEX IF NOT EXISTS idx_agenda_appointments_date_range ON agenda_appointments(restaurant_id, start_time, end_time);

-- Enable Row Level Security
ALTER TABLE agenda_appointments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view agenda appointments for their restaurants" ON agenda_appointments
  FOR SELECT USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_staff 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert agenda appointments for their restaurants" ON agenda_appointments
  FOR INSERT WITH CHECK (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_staff 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update agenda appointments for their restaurants" ON agenda_appointments
  FOR UPDATE USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_staff 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete agenda appointments for their restaurants" ON agenda_appointments
  FOR DELETE USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_staff 
      WHERE user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_agenda_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_agenda_appointments_updated_at
  BEFORE UPDATE ON agenda_appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_agenda_appointments_updated_at(); 