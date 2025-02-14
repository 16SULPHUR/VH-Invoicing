import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ProductActions from "./ProductActions";
import { ImageIcon } from "lucide-react";

const ProductTable = ({
  products,
  showCostColumn,
  getSupplier,
  handleImageClick,
  handleProductEdit,
  openImageUploadDialog,
  handleShareImages,
  handleDownloadImages,
  handleProductDelete,
}) => {
  return (
    <Table className="bg-[#09090b] rounded-md">
      <TableHeader>
        <TableRow>
          <TableHead className="text-sky-400 w-12"></TableHead>
          <TableHead className="text-sky-400">Name</TableHead>
          {showCostColumn && (
            <TableHead className="text-sky-400">Cost</TableHead>
          )}
          <TableHead className="text-sky-400">Selling Price</TableHead>
          <TableHead className="text-sky-400">Barcode</TableHead>
          <TableHead className="text-sky-400">Quantity</TableHead>
          <TableHead className="text-sky-400">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id} className="text-white">
            <TableCell>
              {product.images && product.images.length > 0 && (
                <Avatar
                  className="cursor-pointer"
                  onClick={() => handleImageClick(product.images)}
                >
                  <AvatarImage src={product.images[0]} alt={product.name} />
                  <AvatarFallback>
                    <ImageIcon className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span>{product.name}</span>
                <span style={{ fontSize: "13px" }} className="text-sky-500">
                  {getSupplier(product.supplier)?.name ?? "Loading..."}
                </span>
              </div>
            </TableCell>
            {showCostColumn && <TableCell>₹{product.cost}</TableCell>}
            <TableCell>₹{product.sellingPrice}</TableCell>
            <TableCell>{product.barcode}</TableCell>
            <TableCell>{product.quantity}</TableCell>
            <TableCell>
              <ProductActions
                product={product}
                handleProductDelete={handleProductDelete}
                openImageUploadDialog={openImageUploadDialog}
                handleShareImages={handleShareImages}
                handleDownloadImages={handleDownloadImages}
                handleProductEdit={handleProductEdit}
                handleImageClick={handleImageClick}
                getSupplier={getSupplier}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ProductTable;
