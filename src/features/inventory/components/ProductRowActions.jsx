import {
  Download,
  Image as ImageIcon,
  MoreVertical,
  Pencil,
  Share2,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ProductRowActions({
  product,
  supplierName,
  onEdit,
  onUploadImages,
  onViewImages,
  onShareImages,
  onDownloadImages,
  onDelete,
}) {
  const images = product.images ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Actions for ${product.name}`}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(product)}>
          <Pencil className="mr-2 h-4 w-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onUploadImages(product)}>
          <Upload className="mr-2 h-4 w-4" /> Upload Images
        </DropdownMenuItem>

        {images.length > 0 && (
          <>
            <DropdownMenuItem onClick={() => onViewImages(images)}>
              <ImageIcon className="mr-2 h-4 w-4" /> Show Images
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onShareImages(images, product.name)}>
              <Share2 className="mr-2 h-4 w-4" /> Share Images
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownloadImages(images, product.name, supplierName)}>
              <Download className="mr-2 h-4 w-4" /> Download ZIP
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuItem onClick={() => onDelete(product)}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
