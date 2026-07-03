'use client';

import { ProductGallery, type ProductGalleryImage } from '@/components/product-gallery';
import { ProductVariantPicker } from '@/components/store/product-variant-picker';
import type { MockVariant } from '@/lib/product-variant-mock';
import { useMemo, useState } from 'react';

interface ProductPdpGalleryProps {
  images: ProductGalleryImage[];
  productName: string;
  productId: number;
  imageUrls: string[];
}

export function ProductPdpGallery({
  images,
  productName,
  productId,
  imageUrls,
}: ProductPdpGalleryProps) {
  const [variantImage, setVariantImage] = useState<string | null>(null);

  const galleryImages = useMemo(() => {
    if (variantImage) {
      const exists = images.some((img) => img.url === variantImage);
      if (exists) return images;
      return [{ id: -1, url: variantImage }, ...images];
    }
    return images;
  }, [images, variantImage]);

  function handleVariantSelect(variant: MockVariant | null) {
    setVariantImage(variant?.imageUrl ?? null);
  }

  return (
    <div className="space-y-5">
      <ProductGallery
        key={variantImage ?? 'default'}
        images={galleryImages}
        productName={productName}
      />
      <ProductVariantPicker
        productId={productId}
        productName={productName}
        imageUrls={imageUrls}
        onSelect={handleVariantSelect}
      />
    </div>
  );
}
