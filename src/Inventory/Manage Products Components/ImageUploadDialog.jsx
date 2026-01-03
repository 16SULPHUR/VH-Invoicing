import React, { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LazyLoadImage } from "react-lazy-load-image-component";

const ImageUploadDialog = ({
  isImageUploadDialogOpen,
  setIsImageUploadDialogOpen,
  selectedProduct,
  imagePreviews,
  handleImageChange,
  handleDiscardImage,
  handleImageUpload,
  fileInputRef,
}) => {
  return (
    <Dialog
      open={isImageUploadDialogOpen}
      onOpenChange={setIsImageUploadDialogOpen}
    >
      <DialogContent className="bg-gray-800 text-gray-100">
        <DialogHeader>
          <DialogTitle>Upload Images</DialogTitle>
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
              onChange={handleImageChange}
              className="bg-gray-700 border-gray-600 text-gray-100"
              ref={fileInputRef}
              onClick={(e) => (e.target.value = null)}
            />
            <div className="flex flex-wrap gap-2">
              {imagePreviews.map((preview, index) => (
                <div key={`preview-${index}`} className="relative">
                  <LazyLoadImage
                    src={preview.url}
                    alt={`Preview ${index}`}
                    className="w-24 h-24 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => handleDiscardImage(index)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
          <Button
            onClick={handleImageUpload}
            className="w-full bg-pink-600 hover:bg-pink-600 text-white"
            disabled={imagePreviews.length === 0}
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageUploadDialog;
