import { LazyLoadImage } from "react-lazy-load-image-component";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useImageUploadDraft } from "../hooks/useProductImages";

export function ImageUploadDialog({ product, onClose }) {
  const draft = useImageUploadDraft(product);
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      await draft.save();
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={product !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gray-800 text-gray-100">
        <DialogHeader>
          <DialogTitle>Images for {product?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="images" className="text-pink-400">
              Add New Images:
            </Label>
            <Input
              id="images"
              type="file"
              multiple
              accept="image/*"
              onChange={(event) => draft.addFiles(event.target.files)}
              onClick={(event) => {
                // Allows re-picking the same file after a discard.
                event.target.value = null;
              }}
              className="border-gray-600 bg-gray-700 text-gray-100"
            />

            <div className="flex flex-wrap gap-2">
              {draft.previews.map((preview, index) => (
                <div key={preview.url} className="relative">
                  <LazyLoadImage
                    src={preview.url}
                    alt={`Preview ${index + 1}`}
                    className="h-24 w-24 rounded object-cover"
                  />
                  <button
                    type="button"
                    aria-label={`Remove image ${index + 1}`}
                    onClick={() => draft.discard(index)}
                    className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={draft.isSaving}
            className="w-full bg-pink-600 text-white hover:bg-pink-700"
          >
            {draft.isSaving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
