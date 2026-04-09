import React, { useState } from 'react';
import Papa from 'papaparse';
import { UploadCloud, Activity } from 'lucide-react';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [csvData, setCsvData] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      parseFile(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        parseFile(file);
      } else {
        alert("Please upload a valid CSV file.");
      }
    }
  };

  const parseFile = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        setCsvData(results.data);
      },
      error: function (error) {
        console.error("Error parsing CSV:", error);
        alert("Error parsing CSV.");
      }
    });
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <Activity className="navbar-icon" size={28} />
          <span className="navbar-logo">PharmaSea</span>
        </div>
        <div className="navbar-subtitle">
          Big Data Analytics Dashboard
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        {!csvData ? (
          <div 
            className={`upload-container ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <UploadCloud className="upload-icon" />
            <h2 className="upload-title">Upload your pharmacy CSV</h2>
            <p className="upload-desc">Drag and drop your OTC sales data here, or click to browse. Ensure your CSV has the necessary columns to render the metrics.</p>
            
            <label className="upload-button">
              Browse Files
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileUpload} 
                style={{ display: 'none' }} 
              />
            </label>
          </div>
        ) : (
          <Dashboard data={csvData} />
        )}
      </main>
    </div>
  );
}

export default App;
