import { rupees } from "./shopTools";

export const JOB_KINDS = [
  { value: "fall_pico", label: "Fall-pico", days: 2 },
  { value: "blouse", label: "Blouse stitching", days: 7 },
  { value: "alteration", label: "Alteration", days: 3 },
  { value: "other", label: "Other", days: 3 },
];

export const JOB_STATUSES = [
  { value: "received", label: "Received", tone: "neutral" },
  { value: "with_tailor", label: "With tailor", tone: "indigo" },
  { value: "ready", label: "Ready", tone: "leaf" },
  { value: "delivered", label: "Delivered", tone: "neutral" },
];

export const kindLabel = (kind) => JOB_KINDS.find(({ value }) => value === kind)?.label ?? "Job";
export const statusOf = (status) => JOB_STATUSES.find(({ value }) => value === status) ?? JOB_STATUSES[0];

export const jobBalance = (job) => Math.max(0, rupees(job.charge) - rupees(job.advance) - rupees(job.paid));

export const isOpenJob = (job) => job.status !== "delivered";
