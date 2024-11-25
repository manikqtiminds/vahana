import React, { useState } from "react";
import AnnotationEditor from "./AnnotationEditor";

export default function AnnotationList({
  damageAnnotations,
  carParts,
  referenceNo,
  imageName,
  fetchDamageAnnotations,
}) {
  const [addingNew, setAddingNew] = useState(false);

  const handleAddAnnotation = async (newAnnotation) => {
    try {
      const response = await fetch("http://localhost:5000/api/damageannotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carPartMasterId: newAnnotation.CarPartMasterID,
          damageTypeId: newAnnotation.DamageTypeID,
          repairReplaceId: newAnnotation.RepairReplaceID,
          actualCostRepair: newAnnotation.ActualCostRepair,
          imageName: imageName,
          referenceNo: referenceNo,
        }),
      });
      if (response.ok) {
        await fetchDamageAnnotations(referenceNo, imageName);
        setAddingNew(false);
      } else {
        throw new Error("Failed to add annotation");
      }
    } catch (error) {
      console.error("Error adding annotation:", error);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Damage Annotations</h3>
      {damageAnnotations.map((annotation) => (
        <AnnotationEditor
          key={annotation.MLCaseImageAssessmentId}
          annotation={annotation}
          carParts={carParts}
          referenceNo={referenceNo}
          imageName={imageName}
          fetchDamageAnnotations={fetchDamageAnnotations}
        />
      ))}

      {addingNew ? (
        <AnnotationEditor
          annotation={{}}
          carParts={carParts}
          referenceNo={referenceNo}
          imageName={imageName}
          fetchDamageAnnotations={fetchDamageAnnotations}
          isNew={true}
          onSave={handleAddAnnotation}
          onCancel={() => setAddingNew(false)}
        />
      ) : (
        <button
          onClick={() => setAddingNew(true)}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Add New Annotation
        </button>
      )}
    </div>
  );
}
