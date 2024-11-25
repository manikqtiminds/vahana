// src/components/Report.js
import React from 'react';
import useInspectionStore from '../store/inspectionStore';

function Report() {
  const { damageItems } = useInspectionStore();

  const totalCost = damageItems.reduce((sum, item) => sum + item.cost, 0);

  return (
    <div className="container mx-auto">
      {/* Header Section */}
      <div className="header text-center my-4">
        <h1 className="text-3xl font-bold">Damage Report</h1>
        <p>Report No: 123456</p>
        <p>Date: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Repair Details Table */}
      <table className="table-auto w-full my-4">
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantity</th>
            <th>Unit Price ($)</th>
            <th>Total Price ($)</th>
          </tr>
        </thead>
        <tbody>
          {damageItems.map((item, index) => (
            <tr key={index}>
              <td>{item.name}</td>
              <td>1</td>
              <td>{item.cost.toFixed(2)}</td>
              <td>{item.cost.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-right font-bold">
        Total: ${totalCost.toFixed(2)}
      </div>

      {/* Additional Information */}
      <div className="additional-info mt-8">
        <h2 className="text-xl font-bold">Payment Details</h2>
        <p>Method: Placeholder</p>
        <p>Cardholder Name: Placeholder</p>
      </div>

      <div className="notes mt-4">
        <h2 className="text-xl font-bold">Notes</h2>
        <p>Placeholder for additional remarks or disclaimers.</p>
      </div>
    </div>
  );
}

export default Report;
