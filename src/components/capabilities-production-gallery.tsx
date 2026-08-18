"use client";

import Image from "next/image";
import { type ReactNode, useState } from "react";

type ProductionImage = {
  alt: string;
  src: string;
};

type CapabilitiesProductionGalleryProps = {
  defaultImage: ProductionImage;
  heroContent: ReactNode;
  images: ProductionImage[];
  proofContent: ReactNode;
};

export function CapabilitiesProductionGallery({
  defaultImage,
  heroContent,
  images,
  proofContent,
}: CapabilitiesProductionGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(defaultImage);

  return (
    <>
      <section
        aria-labelledby="capabilities-heading"
        className="grid items-center gap-10 border-b border-stone-200 pb-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16 lg:pb-14"
      >
        <div className="max-w-[520px]">{heroContent}</div>
        <figure className="overflow-hidden rounded-md border border-stone-200 bg-stone-100 shadow-sm">
          <Image
            alt={selectedImage.alt}
            className="aspect-[16/10] h-auto w-full object-cover"
            height={350}
            key={selectedImage.src}
            priority
            sizes="(min-width: 1024px) 58vw, 100vw"
            src={selectedImage.src}
            width={640}
          />
        </figure>
      </section>

      <section
        aria-labelledby="factory-proof-heading"
        className="grid gap-8 border-b border-stone-200 py-10 lg:grid-cols-[minmax(240px,0.78fr)_minmax(0,2fr)] lg:items-center lg:gap-12 lg:py-12"
      >
        <div className="max-w-[330px]">{proofContent}</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((image) => {
            const isSelected = image.src === selectedImage.src;

            return (
              <button
                aria-label={`Show ${image.alt}`}
                aria-pressed={isSelected}
                className={`overflow-hidden rounded-md border bg-stone-100 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2 ${
                  isSelected ? "border-stone-950" : "border-stone-200 hover:border-stone-400"
                }`}
                key={image.src}
                onClick={() => setSelectedImage({ ...image })}
                type="button"
              >
                <Image
                  alt=""
                  className="aspect-[4/3] h-auto w-full object-cover transition duration-500 hover:scale-[1.03]"
                  height={350}
                  sizes="(min-width: 1024px) 17vw, (min-width: 640px) 22vw, 44vw"
                  src={image.src}
                  width={640}
                />
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}
