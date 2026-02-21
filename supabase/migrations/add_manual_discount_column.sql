-- Add manual_discount column to sales table
-- This column stores any manual discount amount applied to the sale

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS manual_discount DECIMAL(10, 2) DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN sales.manual_discount IS 'Manual discount amount applied by the seller at point of sale';
