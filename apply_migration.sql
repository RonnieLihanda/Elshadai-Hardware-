-- Add manual_discount column to sales table
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS manual_discount DECIMAL(10, 2) DEFAULT 0;

-- Add comment
COMMENT ON COLUMN sales.manual_discount IS 'Manual discount amount applied by seller at POS';
