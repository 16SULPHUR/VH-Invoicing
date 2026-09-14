import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { codeGenerator, productService } from "@/services/productService";
import { supplierService } from "@/services/supplierService";
import { mediaService } from "@/services/mediaService";
import { useToast } from "@/hooks/use-toast";

const EMPTY_PRODUCT = {
  name: "",
  cost: "",
  sellingPrice: "",
  quantity: "",
  supplier: "",
  newSupplierName: "",
};

/** Object URLs for the local file previews; revoked whenever the list changes. */
export function useImagePreviews() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

  const addFiles = (fileList) => {
    const added = Array.from(fileList);
    setFiles((previous) => [...previous, ...added]);
    setPreviews((previous) => [...previous, ...added.map((file) => URL.createObjectURL(file))]);
  };

  const discard = (index) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((previous) => previous.filter((_, i) => i !== index));
    setPreviews((previous) => previous.filter((_, i) => i !== index));
  };

  const reset = () => {
    previews.forEach(URL.revokeObjectURL);
    setFiles([]);
    setPreviews([]);
  };

  return { files, previews, addFiles, discard, reset };
}

export function useAddProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [product, setProduct] = useState(EMPTY_PRODUCT);
  const [isAddingNewSupplier, setIsAddingNewSupplier] = useState(false);
  const images = useImagePreviews();

  const setField = (field, value) => setProduct((previous) => ({ ...previous, [field]: value }));

  const submit = useMutation({
    mutationFn: async () => {
      let supplierId = product.supplier;
      let supplierCode;

      if (isAddingNewSupplier) {
        const code = await codeGenerator.nextSupplierCode();
        const [created] = await supplierService.create({
          name: product.newSupplierName,
          code,
        });
        supplierId = created.id;
        supplierCode = created.code;
      } else {
        const suppliers = await supplierService.list();
        supplierCode = suppliers.find((candidate) => candidate.id === supplierId)?.code;
      }

      if (!supplierCode) throw new Error("Pick a supplier before saving");

      const barcode = await codeGenerator.nextBarcode(supplierCode);
      const imageUrls =
        images.files.length > 0 ? await mediaService.uploadImages(images.files) : [];

      return productService.create({
        name: product.name,
        cost: product.cost,
        sellingPrice: product.sellingPrice,
        supplier: supplierId,
        barcode,
        quantity: parseInt(product.quantity, 10),
        images: imageUrls,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all });
      setProduct(EMPTY_PRODUCT);
      setIsAddingNewSupplier(false);
      images.reset();
      toast({ title: "Success", description: "Product added successfully." });
    },
    onError: (error) =>
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to add product: ${error.message}`,
      }),
  });

  return { product, setField, isAddingNewSupplier, setIsAddingNewSupplier, images, submit };
}
