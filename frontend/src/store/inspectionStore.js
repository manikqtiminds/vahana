// inspectionStore.js

import { create } from 'zustand';

const useInspectionStore = create((set, get) => ({
  images: [],
  currentImageIndex: 0,
  currentImage: null,
  damageAnnotations: [],
  loading: false,
  error: null,

  fetchImages: async (referenceNo) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:5000/api/images/${referenceNo}`);
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }
      const images = await response.json();
      if (!Array.isArray(images) || images.length === 0) {
        throw new Error('No images found for this reference');
      }
      const formattedImages = images.map((image) => ({
        imageName: image.imageName,
        imageUrl: image.imageUrl,
        imageDimensions: image.imageDimensions || { width: 1, height: 1 },
        damageInfo: image.damageInfo || [],
      }));
      set({ images: formattedImages, loading: false, currentImageIndex: 0 });

      // Fetch damage annotations for the first image
      await get().fetchDamageAnnotations(referenceNo, formattedImages[0].imageName);
    } catch (error) {
      console.error('Error fetching images:', error);
      set({ error: error.message, loading: false });
    }
  },

  fetchDamageAnnotations: async (referenceNo, imageName) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `http://localhost:5000/api/singleimage/${referenceNo}/${imageName}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch damage annotations');
      }
      const data = await response.json();

      // Get the current image from the images array
      const { images } = get();
      const currentImg = images.find((img) => img.imageName === imageName);

      // Merge data.imageDetails with currentImg to ensure all properties are present
      const updatedCurrentImage = {
        ...currentImg,
        ...data.imageDetails,
      };

      set({
        currentImage: updatedCurrentImage,
        damageAnnotations: data.damageAnnotations,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching damage annotations:', error);
      set({ error: error.message, loading: false });
    }
  },

  setCurrentImageIndex: (index) => {
    set({ currentImageIndex: index });
    const { images, fetchDamageAnnotations } = get();
    const image = images[index];
    if (image) {
      const referenceNo = 'IAR-5614005'; // Replace with dynamic referenceNo if needed
      fetchDamageAnnotations(referenceNo, image.imageName);
    }
  },
}));

export default useInspectionStore;
