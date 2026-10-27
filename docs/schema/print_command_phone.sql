-- Lets the phone's Print button send the customer's phone with the bill.
-- Phone-printed bills go on credit, and credit bills need a phone number.
alter table public.print_command add column if not exists customer_phone text;
