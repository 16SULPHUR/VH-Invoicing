import { useCompanyInfo } from "@/features/settings/useCompanyInfo";

export function CompanyHeader({ className = "" }) {
  const company = useCompanyInfo();
  return (
    <div className={`text-center ${className}`}>
      <p className="font-display text-lg font-extrabold leading-tight">{company.name}</p>
      {company.address && <p className="text-xs text-muted-foreground">{company.address}</p>}
      {company.gstin && <p className="text-xs font-semibold text-muted-foreground">GSTIN {company.gstin}</p>}
    </div>
  );
}
