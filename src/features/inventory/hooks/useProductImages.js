import { useCallback, useEffect, useState } from "react";
import JSZip from "jszip";
import { mediaService } from "@/services/mediaService";
import { useToast } from "@/hooks/use-toast";
import { useUpdateProductImages } from "./useInventory";

function sanitizeFileName(name) {
  return String(name)
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
}

/** Manages the add/remove preview list for one product's image upload dialog. */
export function useImageUploadDraft(product) {
  const [previews, setPreviews] = useState([]);
  const updateImages = useUpdateProductImages();

  useEffect(() => {
    if (!product) return undefined;

    setPreviews((product.images ?? []).map((url) => ({ url, isNew: false })));
    return () => {
      setPreviews((current) => {
        current.forEach((preview) => preview.isNew && URL.revokeObjectURL(preview.url));
        return [];
      });
    };
  }, [product]);

  const addFiles = (fileList) => {
    const files = Array.from(fileList);
    setPreviews((previous) => [
      ...previous,
      ...files.map((file) => ({ url: URL.createObjectURL(file), isNew: true, file })),
    ]);
  };

  const discard = (index) => {
    setPreviews((previous) => {
      const preview = previous[index];
      if (preview?.isNew) URL.revokeObjectURL(preview.url);
      return previous.filter((_, i) => i !== index);
    });
  };

  const save = async () => {
    const newFiles = previews.filter((preview) => preview.isNew).map((preview) => preview.file);
    const keptUrls = previews.filter((preview) => !preview.isNew).map((preview) => preview.url);

    const uploadedUrls = newFiles.length > 0 ? await mediaService.uploadImages(newFiles) : [];
    return updateImages.mutateAsync({ id: product.id, images: [...keptUrls, ...uploadedUrls] });
  };

  return { previews, addFiles, discard, save, isSaving: updateImages.isPending };
}

export function useImageActions() {
  const { toast } = useToast();

  const shareImages = useCallback(
    async (images, productName) => {
      try {
        if (!navigator.share) throw new Error("Web Share API not supported");

        if (navigator.canShare) {
          const files = await Promise.all(
            images.map(async (url, index) => {
              const blob = await (await fetch(url)).blob();
              const extension = blob.type.split("/")[1] || "jpg";
              return new File(
                [blob],
                `${sanitizeFileName(productName)}-${index + 1}.${extension}`,
                {
                  type: blob.type,
                }
              );
            })
          );

          const shareData = {
            files,
            title: `${productName} Images`,
            text: `Images of ${productName}`,
          };
          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return;
          }
        }

        await navigator.share({
          title: `${productName} Images`,
          text: `Check out these images of ${productName}`,
          url: images[0],
        });
      } catch (error) {
        if (error.name === "AbortError") return;

        // Sharing is unavailable often enough that a clipboard fallback is worth it.
        try {
          await navigator.clipboard.writeText(images.join("\n"));
          toast({ title: "Links copied", description: "Image links are on your clipboard." });
        } catch {
          toast({
            variant: "destructive",
            title: "Sharing failed",
            description: "Could not share images. Please copy the links manually.",
          });
        }
      }
    },
    [toast]
  );

  const downloadImages = useCallback(
    async (images, productName, supplierName) => {
      const folderName = `${sanitizeFileName(productName)}_${sanitizeFileName(
        supplierName || "unknown"
      )}`;

      try {
        toast({ title: "Preparing download", description: "Creating a ZIP of the images…" });

        const zip = new JSZip();
        const folder = zip.folder(folderName);

        await Promise.all(
          images.map(async (url, index) => {
            const response = await fetch(url);
            const blob = await response.blob();
            const extension = response.headers.get("content-type")?.split("/")[1] ?? "jpg";
            folder.file(`${sanitizeFileName(productName)}_${index + 1}.${extension}`, blob);
          })
        );

        const blobUrl = URL.createObjectURL(await zip.generateAsync({ type: "blob" }));
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `${folderName}.zip`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(blobUrl);

        toast({ title: "Download complete", description: "Images downloaded successfully." });
      } catch (error) {
        console.error("Error creating zip file:", error);
        toast({
          variant: "destructive",
          title: "Download failed",
          description: `Could not create the ZIP: ${error.message}`,
        });
      }
    },
    [toast]
  );

  return { shareImages, downloadImages };
}
