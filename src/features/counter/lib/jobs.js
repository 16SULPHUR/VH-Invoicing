import { DEFAULT_JOB_KINDS, SHOP_DEFAULTS } from "@/features/settings/useShopSettings";
import { shopSettingsService } from "@/services/shopSettingsService";
import { rupees } from "./shopTools";

export const JOB_KINDS = DEFAULT_JOB_KINDS;

export function getJobKinds() {
  const saved = shopSettingsService.readLocal().job_kinds;
  return Array.isArray(saved) && saved.length > 0 ? saved : SHOP_DEFAULTS.job_kinds;
}

export const JOB_STATUSES = [
  { value: "received", label: "Received", tone: "neutral" },
  { value: "with_tailor", label: "With tailor", tone: "indigo" },
  { value: "ready", label: "Ready", tone: "leaf" },
  { value: "delivered", label: "Delivered", tone: "neutral" },
];

export const kindLabel = (kind) => getJobKinds().find(({ value }) => value === kind)?.label ?? DEFAULT_JOB_KINDS.find(({ value }) => value === kind)?.label ?? "Job";
export const statusOf = (status) => JOB_STATUSES.find(({ value }) => value === status) ?? JOB_STATUSES[0];

export const jobBalance = (job) => Math.max(0, rupees(job.charge) - rupees(job.advance) - rupees(job.paid));

export const isOpenJob = (job) => job.status !== "delivered";
