import { useIsMobile } from "@/hooks/useMediaQuery";
import { useInvoiceWorkspace } from "./hooks/useInvoiceWorkspace";
import { DesktopInvoicing } from "./components/DesktopInvoicing";
import { MobileInvoicing } from "./components/MobileInvoicing";
import { InvoiceModal } from "./components/InvoiceModal";

export default function InvoicingPage() {
  const isMobile = useIsMobile();
  const workspace = useInvoiceWorkspace({ acceptRemotePrint: !isMobile });
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
