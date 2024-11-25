import React, { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useInspectionStore from "../store/inspectionStore";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

export default function ImageDisplay() {
  const {
    images,
    currentImageIndex,
    setCurrentImageIndex,
    fetchImages,
    loading,
    error,
  } = useInspectionStore(); // Removed currentImage from here

  const navigate = useNavigate();
  const referenceNo = "IAR-5614005"; // Replace with dynamic value if needed

  // Fetch images when the component mounts
  useEffect(() => {
    fetchImages(referenceNo);
  }, [fetchImages, referenceNo]);

  const handleThumbnailClick = (index) => {
    setCurrentImageIndex(index); // Update the current image
  };

  const handlePrevious = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handleMainImageClick = () => {
    navigate("/review-edit"); // Navigate to the review & update page
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading images...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const currentImg = images[currentImageIndex]; // Use images array directly

  if (!currentImg || !currentImg.imageDimensions) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No images available for assessment</p>
      </div>
    );
  }

  // Calculate the aspect ratio
  const aspectRatio =
    (currentImg.imageDimensions.height / currentImg.imageDimensions.width) *
    100;

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header with Navigation */}
      <header className="flex justify-between items-center bg-gray-100 p-4 shadow">
        <nav className="space-x-4">
          <span className="text-blue-500 font-bold">Inspected Images</span>
          <Link to="/review-edit" className="text-blue-500 hover:underline">
            Review &amp; Edit
          </Link>
          <Link to="/report" className="text-blue-500 hover:underline">
            Report Page
          </Link>
        </nav>
      </header>
      {/* Thumbnail Navigation */}
      <div className="flex justify-start sm:justify-center space-x-2 overflow-x-auto pb-2 px-2">
        {images.map((image, index) => (
          <div
            key={index}
            className={`relative flex-shrink-0 w-16 sm:w-20 h-16 sm:h-20 cursor-pointer transition-transform hover:scale-105 ${
              index === currentImageIndex ? "ring-2 ring-yellow-400" : ""
            }`}
            onClick={() => handleThumbnailClick(index)}
          >
            <img
              src={image.imageUrl}
              alt={`Thumbnail ${index + 1}`}
              className="w-full h-full object-cover rounded"
            />
          </div>
        ))}
      </div>

      {/* Main Image Display */}
      <div className="relative bg-black rounded-lg shadow-lg overflow-hidden">
        <div
          className="relative w-full cursor-pointer"
          style={{ paddingBottom: `${aspectRatio}%` }}
          onClick={handleMainImageClick}
        >
          <img
            src={currentImg.imageUrl}
            alt={`Vehicle damage ${currentImageIndex + 1}`}
            className="absolute top-0 left-0 w-full h-full object-contain"
          />

          {/* Rectangle Markings */}
          {currentImg.damageInfo?.map((damage, index) => {
            const { x, y, width, height } = damage.coordinates || {};
            if (
              x === undefined ||
              y === undefined ||
              width === undefined ||
              height === undefined
            )
              return null;

            const xPercent = (x / currentImg.imageDimensions.width) * 100;
            const yPercent = (y / currentImg.imageDimensions.height) * 100;
            const widthPercent =
              (width / currentImg.imageDimensions.width) * 100;
            const heightPercent =
              (height / currentImg.imageDimensions.height) * 100;

            return (
              <div
                key={index}
                className="absolute border-2"
                style={{
                  left: `${xPercent}%`,
                  top: `${yPercent}%`,
                  width: `${widthPercent}%`,
                  height: `${heightPercent}%`,
                  borderColor:
                    damage.repairReplace === "Repair" ? "green" : "red",
                  boxSizing: "border-box",
                }}
              >
                <span
                  className="absolute bg-black text-white text-xs px-1 rounded"
                  style={{ top: "-20px", left: "0" }}
                >
                  {damage.repairReplace}
                </span>
              </div>
            );
          })}
        </div>

        {/* Navigation Controls */}
        <div className="absolute inset-y-0 left-0 flex items-center">
          <button
            onClick={handlePrevious}
            disabled={currentImageIndex === 0}
            className="bg-black/50 hover:bg-black/70 text-white p-1 sm:p-2 rounded-r disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center">
          <button
            onClick={handleNext}
            disabled={currentImageIndex === images.length - 1}
            className="bg-black/50 hover:bg-black/70 text-white p-1 sm:p-2 rounded-l disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
