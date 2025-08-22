/*
          # Initial Schema Setup
          This script sets up the initial database schema for the Madeh Hardware application. It creates tables for staff, products, and sales, along with necessary data types and security policies.

          ## Query Description: "This operation will create the core tables for your application. It is safe to run on a new project but could conflict with existing tables if you have already created some manually. No data will be lost as it only creates new structures."
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Medium"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Tables Created: staff, products, sales
          - Custom Types Created: staff_role, staff_status
          - Foreign Keys: sales.productId -> products.id, sales.cashierId -> staff.id
          
          ## Security Implications:
          - RLS Status: Enabled on all tables.
          - Policy Changes: Yes, new policies are created to allow access for authenticated users.
          - Auth Requirements: Users must be authenticated to interact with the data.
          
          ## Performance Impact:
          - Indexes: Primary keys are indexed automatically.
          - Triggers: None.
          - Estimated Impact: Low. This is a standard schema setup.
          */

-- Create custom types for staff roles and status
create type public.staff_role as enum ('Owner', 'Manager', 'Cashier');
create type public.staff_status as enum ('Active', 'Inactive');

-- Create the staff table
create table public.staff (
  id uuid not null default gen_random_uuid() primary key,
  name text not null,
  email text not null unique,
  role public.staff_role not null default 'Cashier',
  status public.staff_status not null default 'Active',
  created_at timestamptz not null default now()
);

-- Create the products table
create table public.products (
  id uuid not null default gen_random_uuid() primary key,
  name text not null,
  category text not null,
  quantity integer not null default 0,
  buying_price numeric not null,
  price numeric not null,
  low_stock_threshold integer not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create the sales table
create table public.sales (
  id uuid not null default gen_random_uuid() primary key,
  product_id uuid not null references public.products(id) on delete restrict,
  product_name text not null,
  quantity integer not null,
  unit_price numeric not null,
  total_amount numeric not null,
  cashier_id uuid not null references public.staff(id) on delete restrict,
  cashier_name text not null,
  customer_name text,
  date date not null,
  time time not null,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security for all tables
alter table public.staff enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;

-- Create RLS policies
-- Allow authenticated users to read all data
create policy "Allow authenticated read access" on public.staff for select using (auth.role() = 'authenticated');
create policy "Allow authenticated read access" on public.products for select using (auth.role() = 'authenticated');
create policy "Allow authenticated read access" on public.sales for select using (auth.role() = 'authenticated');

-- Allow authenticated users to insert data
create policy "Allow authenticated insert access" on public.staff for insert with check (auth.role() = 'authenticated');
create policy "Allow authenticated insert access" on public.products for insert with check (auth.role() = 'authenticated');
create policy "Allow authenticated insert access" on public.sales for insert with check (auth.role() = 'authenticated');

-- Allow authenticated users to update data
create policy "Allow authenticated update access" on public.staff for update using (auth.role() = 'authenticated');
create policy "Allow authenticated update access" on public.products for update using (auth.role() = 'authenticated');
create policy "Allow authenticated update access" on public.sales for update using (auth.role() = 'authenticated');

-- Allow authenticated users to delete data
create policy "Allow authenticated delete access" on public.staff for delete using (auth.role() = 'authenticated');
create policy "Allow authenticated delete access" on public.products for delete using (auth.role() = 'authenticated');
create policy "Allow authenticated delete access" on public.sales for delete using (auth.role() = 'authenticated');
