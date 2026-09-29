ALTER TABLE claims ADD COLUMN IF NOT EXISTS company_decision text DEFAULT 'Pending';
