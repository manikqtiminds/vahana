import React, { useEffect, useState } from "react";

const damageTypeOptions = [
  { value: "0", label: "Scratch" },
  { value: "1", label: "Dent" },
  { value: "2", label: "Broken" },
  { value: "3", label: "NA" },
];
const repairTypeOptions = [
  { value: "0", label: "Repair" },
  { value: "1", label: "Replace" },
  { value: "2", label: "NA" },
];

export default function AnnotationEditor({
  annotation,
  carParts,
  referenceNo,
  imageName,
  fetchDamageAnnotations,
  isNew = false,
  onSave,
  onCancel,
}) {
  const [editMode, setEditMode] = useState(isNew);
  const [editedAnnotation, setEditedAnnotation] = useState({
    CarPartMasterID: annotation?.CarPartMasterID || "",
    DamageTypeID: annotation?.DamageTypeID || "3",
    RepairReplaceID: annotation?.RepairReplaceID || "2",
    ActualCostRepair: annotation?.ActualCostRepair || "",
  });
  const [costEstimate, setCostEstimate] = useState("N/A");

  // Fetch cost estimate when CarPartMasterID, DamageTypeID, or RepairReplaceID changes
  useEffect(() => {
    const fetchCostEstimate = async () => {
      if (
        editedAnnotation.CarPartMasterID &&
        editedAnnotation.DamageTypeID &&
        editedAnnotation.RepairReplaceID
      ) {
        try {
          const response = await fetch(
            `http://localhost:5000/api/carparts/costofrepair?carPartMasterId=${editedAnnotation.CarPartMasterID}&damageTypeId=${editedAnnotation.DamageTypeID}&repairReplaceId=${editedAnnotation.RepairReplaceID}`
          );
          const data = await response.json();
          setCostEstimate(data?.CostOfRepair || "N/A");
        } catch (error) {
          console.error("Error fetching cost estimate:", error);
          setCostEstimate("N/A");
        }
      }
    };

    fetchCostEstimate();
  }, [
    editedAnnotation.CarPartMasterID,
    editedAnnotation.DamageTypeID,
    editedAnnotation.RepairReplaceID,
  ]);

  const handleSave = async () => {
    try {
      const payload = {
        carPartMasterId: editedAnnotation.CarPartMasterID,
        damageTypeId: editedAnnotation.DamageTypeID,
        repairReplaceId: editedAnnotation.RepairReplaceID,
        actualCostRepair: costEstimate, // Use fetched cost
        imageName: imageName,
        referenceNo: referenceNo,
      };

      let response;

      if (isNew) {
        response = await fetch("http://localhost:5000/api/damageannotations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(
          `http://localhost:5000/api/damageannotations/${annotation.MLCaseImageAssessmentId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      }

      if (response.ok) {
        await fetchDamageAnnotations(referenceNo, imageName);
        setEditMode(false);
        if (isNew) onCancel();
      } else {
        throw new Error("Failed to save annotation");
      }
    } catch (error) {
      console.error("Error saving annotation:", error);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/damageannotations/${annotation.MLCaseImageAssessmentId}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        await fetchDamageAnnotations(referenceNo, imageName);
      } else {
        throw new Error("Failed to delete annotation");
      }
    } catch (error) {
      console.error("Error deleting annotation:", error);
    }
  };

  const handleChange = (field, value) => {
    setEditedAnnotation((prev) => ({ ...prev, [field]: value }));
  };

  const selectedCarPart = carParts.find(
    (part) => part.CarPartMasterID === editedAnnotation.CarPartMasterID
  );

  return (
    <div className="p-4 bg-gray-100 rounded shadow">
      {editMode ? (
        <>
          {/* Part Name Dropdown */}
          <select
            value={editedAnnotation.CarPartMasterID || ""}
            onChange={(e) =>
              handleChange("CarPartMasterID", parseInt(e.target.value))
            }
            className="border rounded p-2"
          >
            <option value="">Select Part Name</option>
            {carParts.map((part) => (
              <option key={part.CarPartMasterID} value={part.CarPartMasterID}>
                {part.CarPartName}
              </option>
            ))}
          </select>
          {/* Damage Type Dropdown */}
          <select
            value={editedAnnotation.DamageTypeID?.toString() || "3"}
            onChange={(e) =>
              handleChange("DamageTypeID", e.target.value)
            }
            className="border rounded p-2"
          >
            {damageTypeOptions.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {/* Repair Type Dropdown */}
          <select
            value={editedAnnotation.RepairReplaceID?.toString() || "2"}
            onChange={(e) =>
              handleChange("RepairReplaceID", e.target.value)
            }
            className="border rounded p-2"
          >
            {repairTypeOptions.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {/* Cost Estimate */}
          <p className="mt-2">Estimated Cost: ₹{costEstimate}</p>
          {/* Save Button */}
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {isNew ? "Add" : "Save"}
          </button>
          {isNew && (
            <button
              onClick={onCancel}
              className="bg-gray-500 text-white px-4 py-2 rounded ml-2"
            >
              Cancel
            </button>
          )}
        </>
      ) : (
        <>
          <div>Part Name: {selectedCarPart?.CarPartName || "N/A"}</div>
          <div>
            Damage Type:{" "}
            {
              damageTypeOptions.find(
                (type) => type.value === annotation.DamageTypeID?.toString()
              )?.label || "NA"
            }
          </div>
          <div>
            Repair Type:{" "}
            {
              repairTypeOptions.find(
                (type) =>
                  type.value === annotation.RepairReplaceID?.toString()
              )?.label || "NA"
            }
          </div>
          <div>Repair Cost: ₹{annotation.ActualCostRepair || costEstimate}</div>
          {/* Edit Button */}
          <button
            onClick={() => setEditMode(true)}
            className="bg-yellow-500 text-white px-4 py-2 rounded"
          >
            Edit
          </button>
          {/* Delete Button */}
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded ml-2"
          >
            Delete
          </button>
        </>
      )}
    </div>
  );
}
