/*
  # [Operation Name]
  Add staff_id to sales table

  [Description of what this operation does]
  This migration adds a `staff_id` column to the `sales` table and creates a foreign key relationship to the `staff` table. This is essential for tracking which staff member recorded each sale.

  ## Query Description: [This operation will modify the 'sales' table structure. It is a non-destructive change, but it is recommended to back up your data before applying it. This change is required for the sales recording feature to work correctly.]

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Medium"
  - Requires-Backup: true
  - Reversible: true

  ## Structure Details:
  - Table affected: `public.sales`
  - Column added: `staff_id` (UUID)
  - Constraint added: Foreign key from `sales(staff_id)` to `staff(id)`

  ## Security Implications:
  - RLS Status: Unchanged
  - Policy Changes: No
  - Auth Requirements: None for this migration.

  ## Performance Impact:
  - Indexes: A foreign key index will be implicitly created on `staff_id`.
  - Triggers: None
  - Estimated Impact: Low. The operation should be fast on tables with a reasonable number of rows.
*/

ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.sales.staff_id IS 'Foreign key to the staff member who made the sale.';
