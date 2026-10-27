import { X } from "lucide-react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-photo-view/dist/react-photo-view.css";

export function ImageGalleryDialog({ images, onClose }) {
  if (!images) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="relative mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-surface border border-border p-4 shadow-lg">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close gallery"
          className="absolute right-2 top-2 rounded-full bg-destructive p-2 transition-colors hover:bg-destructive/90"
        >
          <X className="h-5 w-5 font-bold " />
        </button>

        <PhotoProvider>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {images.map((image) => (
              <PhotoView key={image} src={image}>
                <LazyLoadImage
                  src={image}
                  alt=""
                  width={160}
                  height={128}
                  loading="lazy"
                  className="h-32 w-full cursor-pointer rounded-lg object-cover hover:opacity-80"
                />
              </PhotoView>
            ))}
          </div>
        </PhotoProvider>
      </div>
    </div>
  );
}
