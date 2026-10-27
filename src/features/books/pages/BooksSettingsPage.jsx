import { PageHeader } from "@/components/common/PageHeader";
import { BooksSettingsPanel } from "../components/BooksSettingsPanel";

export default function BooksSettingsPage() {
  return (
    <div className="max-w-2xl space-y-4 p-4 md:p-6">
      <PageHeader title="Books settings" subtitle="Names, categories and rules for the books" />
      <BooksSettingsPanel />
    </div>
  );
}
