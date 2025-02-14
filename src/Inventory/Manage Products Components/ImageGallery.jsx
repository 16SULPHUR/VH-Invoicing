import React from "react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { X } from "lucide-react";

const ImageGallery = ({
  selectedImages,
  handleOutsideClick,
  setIsImageDialogOpen,
  isImageDialogOpen
}) => {
  return (
    <div
      className={`${
        isImageDialogOpen ? "flex" : "hidden"
      } fixed inset-0 z-50 items-center justify-center bg-black bg-opacity-75`}
      onClick={handleOutsideClick} // Handle outside click
    >
      <div className="relative bg-slate-800 rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto p-4">
        <button
          onClick={() => setIsImageDialogOpen(false)}
          className="absolute top-2 right-2 p-2 rounded-full bg-red-500 hover:bg-red-700 transition-colors"
        >
          <X className="w-5 h-5 text-white font-bold" />
        </button>
        <PhotoProvider>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-2">
            {selectedImages.map((item, index) => (
              <PhotoView key={item} src={item}>
                <LazyLoadImage
                  src={item}
                  alt=""
                  className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80"
                />
              </PhotoView>
            ))}
          </div>
        </PhotoProvider>
      </div>
    </div>
  );
};

export default ImageGallery;
