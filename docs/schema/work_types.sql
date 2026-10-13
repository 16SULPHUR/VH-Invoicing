-- Lets the Counter take work types made on the Shop screen. Without it only the four built-in kinds save.
-- Back up first: create schema if not exists backup_20261013; create table backup_20261013.service_jobs as table public.service_jobs;
alter table public.service_jobs drop constraint if exists service_jobs_kind_check;
