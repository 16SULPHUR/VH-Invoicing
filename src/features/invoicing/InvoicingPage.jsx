import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useInvoiceWorkspace } from "./hooks/useInvoiceWorkspace";
import { DesktopInvoicing } from "./components/DesktopInvoicing";
import { MobileInvoicing } from "./components/MobileInvoicing";
import { InvoiceModal } from "./components/InvoiceModal";

export default function InvoicingPage() {
  const isMobile = useIsMobile();
  const workspace = useInvoiceWorkspace({ acceptRemotePrint: !isMobile });
  const [searchParams, setSearchParams] = useSearchParams();
  const { setCustomerName, setCustomerNumber, setNote } = workspace.draft;

  // Other screens hand a customer to the till with /?name=&phone=&note=.
  useEffect(() => {
    const name = searchParams.get("name");
    const phone = searchParams.get("phone");
    const note = searchParams.get("note");
    if (!name && !phone && !note) return;
    if (name) setCustomerName(name);
    if (phone) setCustomerNumber(phone);
    if (note) setNote(note);
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams, setCustomerName, setCustomerNumber, setNote]);
  const Layout = isMobile ? MobileInvoicing : DesktopInvoicing;

  return (
    <div className="h-full min-h-0">
      <Layout workspace={workspace} />

      {workspace.selectedInvoice && (
        <InvoiceModal
          invoice={workspace.selectedInvoice}
          onClose={workspace.closeInvoice}
          onEdit={workspace.editInvoice}
          onDelete={workspace.deleteInvoice}
        />
      )}
    </div>
  );
}
