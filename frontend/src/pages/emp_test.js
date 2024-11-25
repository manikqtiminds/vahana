// src/components/ReviewEdit.js

import React, { useEffect, useState } from 'react';
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import useInspectionStore from '../store/inspectionStore';
import { useNavigate } from 'react-router-dom';

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

  const [filter, setFilter] = useState('All');
  const navigate = useNavigate();
  const referenceNo = 'IAR-5614004'; // Replace with dynamic value if needed

  // Fetch images when the component mounts
  useEffect(() => {
    fetchImages(referenceNo);
  }, [fetchImages, referenceNo]);

  // Fetch damage annotations for the current image when `currentImageIndex` changes
  useEffect(() => {
    if (images.length > 0) {
      const imageName = images[currentImageIndex]?.imageName;
      fetchDamageAnnotations(referenceNo, imageName);
    }
  }, [fetchDamageAnnotations, referenceNo, images, currentImageIndex]);

  const handleThumbnailClick = (index) => {
    setCurrentImageIndex(index);
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

  const handleDeleteDamage = async (damageId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/deleteDamage/${damageId}`,
        { method: 'DELETE' }
      );
      if (response.ok) {
        fetchDamageAnnotations(referenceNo, images[currentImageIndex]?.imageName);
      } else {
        throw new Error('Failed to delete damage');
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading images and damage data...</p>
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

  if (!currentImage || !damageAnnotations) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          No images or damage data available for assessment
        </p>
      </div>
    );
  }

  const currentImg = currentImage; // Use currentImage with merged data

  if (!currentImg.imageDimensions) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          Image dimensions not available
        </p>
      </div>
    );
  }

  // Calculate the total costs
  const totalCost = damageAnnotations.reduce(
    (sum, item) => sum + (item.ActualCostRepair || 0),
    0
  );

  const overallTotalCost = images.reduce(
    (sum, image) =>
      sum +
      (image.damageInfo?.reduce(
        (innerSum, damage) => innerSum + (damage.ActualCostRepair || 0),
        0
      ) || 0),
    0
  );

  const filteredAnnotations = damageAnnotations.filter(
    (item) => filter === 'All' || item.RepairReplace === filter
  );

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header with Export Button */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Damage Assessment Report
          </h2>
          <p className="text-sm text-gray-500">Reference No: {referenceNo}</p>
        </div>
        <button
          onClick={() => navigate('/report')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Export Report
        </button>
      </div>

      {/* Cost Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg shadow-sm">
          <p className="text-white text-sm">Overall Total Cost</p>
          <p className="text-white text-2xl font-bold">${overallTotalCost}</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg shadow-sm">
          <p className="text-white text-sm">Current Image Cost</p>
          <p className="text-white text-2xl font-bold">${totalCost}</p>
        </div>
      </div>

      {/* Thumbnail Navigation */}
      <div className="flex justify-start sm:justify-center space-x-2 overflow-x-auto pb-2">
        {images.map((image, index) => (
          <div
            key={image.imageName}
            className={`relative flex-shrink-0 w-16 sm:w-24 h-16 sm:h-24 cursor-pointer ${
              index === currentImageIndex ? 'ring-2 ring-blue-500' : ''
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

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Panel */}
        <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="relative w-full h-[500px]">
            <img
              src={currentImg.imageUrl}
              alt={`Vehicle damage ${currentImageIndex + 1}`}
              className="absolute top-0 left-0 w-full h-full object-contain"
            />
            {/* Rectangle Markings from currentImage.damageInfo */}
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
                      damage.repairReplace === 'Repair' ? 'green' : 'red',
                    boxSizing: 'border-box',
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
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6">
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
            {['All', 'Repair', 'Replace'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-md ${
                  filter === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Damage Annotations List */}
          <div className="space-y-3 sm:space-y-4 max-h-[500px] overflow-y-auto">
            {filteredAnnotations.map((damage) => (
              <div
                key={damage.MLCaseImageAssessmentId}
                className="bg-white border rounded-lg p-4 hover:border-blue-500 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {damage.CarPartName}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {damage.DamageType}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        handleDeleteDamage(damage.MLCaseImageAssessmentId)
                      }
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-700">
                  Repair/Replace: {damage.RepairReplace}
                </p>
                <p className="text-sm text-gray-700">
                  Estimated Cost: ${damage.ActualCostRepair || 0}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
