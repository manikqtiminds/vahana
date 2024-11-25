import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import useInspectionStore from "../store/inspectionStore";
import AnnotationList from "../components/ReviewEdit/AnnotationList";

export default function ReviewEdit() {
  const {
    images,
    currentImageIndex,
    setCurrentImageIndex,
    fetchImages,
    fetchDamageAnnotations,
    damageAnnotations,
    currentImage,
    loading,
    error,
  } = useInspectionStore();

  const [carParts, setCarParts] = useState([]);
  const referenceNo = "IAR-5614005";

  useEffect(() => {
    fetchCarParts();
    fetchImages(referenceNo);
  }, [fetchImages, referenceNo]);

  useEffect(() => {
    if (images.length > 0) {
      const imageName = images[currentImageIndex]?.imageName;
      fetchDamageAnnotations(referenceNo, imageName);
    }
  }, [fetchDamageAnnotations, referenceNo, images, currentImageIndex]);

  const fetchCarParts = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/carparts"
      );
      if (!response.ok) throw new Error("Failed to fetch car parts");
      const data = await response.json();
      setCarParts(data);
    } catch (error) {
      console.error("Error fetching car parts:", error);
    }
  };

  const handlePrevious = () => {
    if (currentImageIndex > 0) setCurrentImageIndex(currentImageIndex - 1);
  };

  const handleNext = () => {
    if (currentImageIndex < images.length - 1)
      setCurrentImageIndex(currentImageIndex + 1);
  };

  if (loading) return <div>Loading images and damage data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!currentImage || !damageAnnotations)
    return <div>No data available for assessment</div>;

  const currentImg = currentImage; // Alias for clarity

  const handleThumbnailClick = (index) => {
    setCurrentImageIndex(index);
  };

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <header className="flex justify-between items-center bg-gray-100 p-4 shadow">
        <nav className="space-x-4">
          <Link to="/images" className="text-blue-500 hover:underline">
            Inspected Images
          </Link>
          <span className="text-blue-500 font-bold">Review Images</span>
          <Link to="/report" className="text-blue-500 hover:underline">
            Report Page
          </Link>
        </nav>
      </header>

      {/* Report Reference Number and Export Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Damage Assessment Report</h2>
        <p className="text-gray-500">Reference No: {referenceNo}</p>
        <button className="bg-blue-500 text-white px-4 py-2 rounded">
          Export Report
        </button>
        {/* Thumbnail Navigation */}
        {images.map((image, index) => (
          <div
            key={image.imageName}
            className={`relative flex-shrink-0 w-16 sm:w-24 h-16 sm:h-24 cursor-pointer ${
              index === currentImageIndex ? "ring-2 ring-blue-500" : ""
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel */}
        <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Display the current image name */}
          <div className="p-2 bg-gray-100 border-b text-center font-medium">
            <p>Image Name: {currentImg.imageName}</p>
          </div>
          <div className="relative w-full h-[500px]">
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
                />
              );
            })}
          </div>
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

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Display the current image name */}
          <div className="p-2 bg-gray-100 border-b text-center font-medium">
            <p>Image Name: {currentImg.imageName}</p>
          </div>
          <AnnotationList
            damageAnnotations={damageAnnotations}
            carParts={carParts}
            referenceNo={referenceNo}
            imageName={images[currentImageIndex]?.imageName}
            fetchDamageAnnotations={fetchDamageAnnotations}
          />
        </div>
      </div>
    </div>
  );
}
