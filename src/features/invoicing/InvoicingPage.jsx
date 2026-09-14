import { useIsMobile } from "@/hooks/useMediaQuery";
import { useInvoiceWorkspace } from "./hooks/useInvoiceWorkspace";
import { DesktopInvoicing } from "./components/DesktopInvoicing";
import { MobileInvoicing } from "./components/MobileInvoicing";
import { InvoiceModal } from "./components/InvoiceModal";

export default function InvoicingPage() {
  const isMobile = useIsMobile();
  const workspace = useInvoiceWorkspace();

  const Layout = isMobile ? MobileInvoicing : DesktopInvoicing;

  return (
    <div className="flex h-svh w-full font-sans backdrop-blur-sm">
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
