/*
  # Create boats table

  1. New Tables
    - `boats`
      - `id` (uuid, primary key)
      - `name` (text)
      - `owner` (text)
      - `length` (numeric)
      - `stay` (numeric)
      - `arrival_date` (timestamptz)
      - `notes` (text, nullable)
      - `side` (text, check constraint for 'bankside' or 'offside')

  2. Security
    - Enable RLS on `boats` table
    - Add policies for authenticated users to perform CRUD operations
*/

-- Create enum for mooring side
CREATE TYPE mooring_side AS ENUM ('bankside', 'offside');

-- Create boats table
CREATE TABLE IF NOT EXISTS boats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner text NOT NULL,
  length numeric NOT NULL,
  stay numeric NOT NULL,
  arrival_date timestamptz NOT NULL DEFAULT now(),
  notes text,
  side mooring_side NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE boats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users"
  ON boats
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON boats
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
  ON boats
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users"
  ON boats
  FOR DELETE
  TO authenticated
  USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER boats_updated_at
  BEFORE UPDATE ON boats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();