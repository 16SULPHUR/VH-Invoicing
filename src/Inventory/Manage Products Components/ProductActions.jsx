import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, Trash2, MoreVertical, ImageIcon, Share2, Download, Upload } from "lucide-react";

const ProductActions = ({ product, handleProductEdit, openImageUploadDialog, handleImageClick, handleShareImages, handleDownloadImages, handleProductDelete, getSupplier }) => {
  const hasImages = product.images && product.images.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleProductEdit(product)}>
          <Pencil className="h-4 w-4 mr-2" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openImageUploadDialog(product)}>
          <Upload className="h-4 w-4 mr-2" /> Upload Images
        </DropdownMenuItem>
        {hasImages && (
          <>
            <DropdownMenuItem onClick={() => handleImageClick(product.images)}>
              <ImageIcon className="h-4 w-4 mr-2" /> Show Images
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShareImages(product.images, product.name)}>
              <Share2 className="h-4 w-4 mr-2" /> Share Images
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                handleDownloadImages(product.images, product.name, getSupplier(product.supplier)?.name)
              }
            >
              <Download className="h-4 w-4 mr-2" /> Download ZIP
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem onClick={() => handleProductDelete(product.id)}>
          <Trash2 className="h-4 w-4 mr-2" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProductActions;