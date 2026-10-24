import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useBooksSettings } from "../booksSettings";
import { SelectField } from "./SelectField";

const toLines = (text) => text.split("\n").map((line) => line.trim()).filter(Boolean);

function Section({ title, hint, children }) {
  return (
    <section className="space-y-3 rounded-2xl bg-surface p-4 shadow-[0_1px_0_hsl(var(--border))]">
      <div>
        <h2 className="text-lg font-extrabold">{title}</h2>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Row({ id, label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TextSetting({ id, value, onCommit, type = "text", ...props }) {
  const commit = (raw) => {
    const next = type === "number" ? Math.max(0, Number(raw) || 0) : raw.trim();
    if (next !== value) onCommit(next);
  };
  return (
    <Input
      id={id}
      key={String(value)}
      type={type}
      defaultValue={value}
      onBlur={(event) => commit(event.target.value)}
      onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
      {...props}
    />
  );
}

function Toggle({ id, label, hint, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Label htmlFor={id} className="text-sm font-semibold">
          {label}
        </Label>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/** Books options. Reads and writes the shared shop settings, so any settings page can host it. */
export function BooksSettingsPanel() {
  const { books, update, stored } = useBooksSettings();

  return (
    <div className="space-y-4">
      {stored === "device" && (
        <p className="rounded-2xl bg-marigold/15 px-3.5 py-2.5 text-sm text-warning">
          These settings are kept on this device until docs/schema/sticker_designer.sql is run in Supabase.
        </p>
      )}

      <Section title="Accounts" hint="Names and defaults used across the books">
        <Row id="books-bank" label="Bank account name" hint="Shown on the Bank book, e.g. HDFC current account">
          <TextSetting id="books-bank" value={books.bank_name} onCommit={(value) => update({ bank_name: value || "Bank" })} />
        </Row>
        <SelectField
          label="Expenses are usually paid through"
          htmlFor="books-source"
          value={books.default_source}
          onChange={(value) => update({ default_source: value })}
          options={[
            { value: "Cash", label: "Cash" },
            { value: "Bank", label: "Bank" },
          ]}
        />
        <p className="text-sm">
          Cash and bank balances at the start of the books are set under{" "}
          <Link to="/books/opening" className="font-semibold text-rani underline">
            Opening balances
          </Link>
          .
        </p>
      </Section>

      <Section title="Expense categories" hint="One per line. Pick one when you add an expense; the Expenses book adds them up.">
        <textarea
          id="books-categories"
          key={books.expense_categories.join("|")}
          rows={7}
          defaultValue={books.expense_categories.join("\n")}
          onBlur={(event) => {
            const lines = toLines(event.target.value);
            if (lines.join("|") !== books.expense_categories.join("|")) update({ expense_categories: lines });
          }}
          className="w-full rounded-xl border-[1.5px] border-border bg-surface-elevated px-3 py-2 text-[15px] focus-visible:border-rani/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rani/20"
        />
      </Section>

      <Section title="Billing" hint="How customers are handled when a bill is made">
        <Toggle
          id="books-require-customer"
          label="A saved customer is required on every bill"
          hint="Off lets a bill go through with any typed name"
          checked={books.require_customer}
          onChange={(value) => update({ require_customer: value })}
        />
        <Row id="books-walkin" label="Walk-in customer name" hint="Must match the saved customer for people who give no details. It can't take credit.">
          <TextSetting id="books-walkin" value={books.walk_in_name} onCommit={(value) => update({ walk_in_name: value || "Walk-in" })} />
        </Row>
      </Section>

      <Section title="Home & Shop" hint="The page that tracks where the cash is">
        <div className="grid grid-cols-2 gap-3">
          <Row id="books-home" label="First place">
            <TextSetting id="books-home" value={books.home_label} onCommit={(value) => update({ home_label: value || "Home" })} />
          </Row>
          <Row id="books-shop" label="Second place">
            <TextSetting id="books-shop" value={books.shop_label} onCommit={(value) => update({ shop_label: value || "Shop" })} />
          </Row>
        </div>
        <Toggle
          id="books-author"
          label="Ask who made each entry"
          checked={books.holdings_require_author}
          onChange={(value) => update({ holdings_require_author: value })}
        />
        <Toggle
          id="books-negative"
          label="Allow taking out more than is there"
          hint="Off stops an entry that would take a place below zero"
          checked={books.holdings_allow_negative}
          onChange={(value) => update({ holdings_allow_negative: value })}
        />
        <Row id="books-limit" label="Warn when the second place holds more than ₹" hint="0 turns the warning off">
          <TextSetting id="books-limit" type="number" min="0" value={books.shop_cash_limit} onCommit={(value) => update({ shop_cash_limit: value })} />
        </Row>
      </Section>
    </div>
  );
}
