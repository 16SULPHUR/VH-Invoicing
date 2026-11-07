import { Section, StoredBadge, ValueFields } from "../components/fields";

const BILL_PAGE_VALUES = [
  { key: "exchange_days", label: "Exchange window (days)", hint: "Shown on the bill page as “Exchange till …”. Empty hides it.", type: "number", placeholder: "7" },
  { key: "exchange_note", label: "Exchange note", hint: "e.g. With tags and bill, not for sale items", placeholder: "With tags and bill" },
  { key: "google_review_url", label: "Google review link", hint: "A day after a paid bill, the bill page asks for a review.", placeholder: "https://g.page/r/…/review", className: "sm:col-span-2" },
];

export function BillsSection({ shop }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <Section title="Bill page" description="The page customers open from the bill link or QR." aside={<StoredBadge stored={shop.stored} />}>
        <ValueFields fields={BILL_PAGE_VALUES} settings={shop.settings} save={shop.save} idPrefix="bill" />
      </Section>
    </div>
  );
}
