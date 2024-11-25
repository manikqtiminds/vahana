// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ImageDisplay from './pages/ImageDisplay';
import ReviewEdit from './pages/ReviewEdit';
import Report from './pages/Report';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/images" />} />
        <Route path="/images" element={<ImageDisplay />} />
        <Route path="/review-edit" element={<ReviewEdit />} />
        <Route path="/report" element={<Report />} />
      </Routes>
    </Router>
  );
}

export default App;
