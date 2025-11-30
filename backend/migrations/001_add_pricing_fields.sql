-- Migration: Add pricing_type and custom_monthly_rate fields
-- Date: 2025-11-30
-- Description:
--   - Add pricing_type to apartments table (SHARED or FIXED)
--   - Add custom_monthly_rate to apartment_assignments table
--   - Add PricingType enum

-- 1. Create the PricingType enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pricingtype') THEN
        CREATE TYPE pricingtype AS ENUM ('shared', 'fixed');
    END IF;
END $$;

-- 2. Add pricing_type column to apartments table
ALTER TABLE apartments
ADD COLUMN IF NOT EXISTS pricing_type pricingtype NOT NULL DEFAULT 'shared';

-- 3. Add custom_monthly_rate column to apartment_assignments table
ALTER TABLE apartment_assignments
ADD COLUMN IF NOT EXISTS custom_monthly_rate NUMERIC(10, 2);

-- 4. Add comment to explain the fields
COMMENT ON COLUMN apartments.pricing_type IS 'Tipo de cálculo: SHARED (precio dividido entre ocupantes) o FIXED (precio fijo por persona)';
COMMENT ON COLUMN apartment_assignments.custom_monthly_rate IS 'Precio mensual personalizado para este empleado (opcional, sobrescribe el cálculo automático)';

-- 5. Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_apartments_pricing_type ON apartments(pricing_type);
CREATE INDEX IF NOT EXISTS idx_assignments_custom_rate ON apartment_assignments(custom_monthly_rate) WHERE custom_monthly_rate IS NOT NULL;

COMMIT;
