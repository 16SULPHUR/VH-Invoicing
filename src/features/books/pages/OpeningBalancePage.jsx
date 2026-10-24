import { PageHeader } from "@/components/common/PageHeader";
import { OpeningBalances } from "../components/OpeningBalances";

export default function OpeningBalancePage() {
  return (
    <div className="max-w-lg space-y-4 p-4 md:p-6">
      <PageHeader title="Opening balances" subtitle="What the shop held when these books begin. Set once." />
      <OpeningBalances />
    </div>
  );
}
