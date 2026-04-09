import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const CONVERSION_RATE = 92.22;

const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function Dashboard({ data }) {
  // Process the data to convert USD to INR in a new array for convenience
  const processedData = useMemo(() => {
    return data.map((row) => ({
      ...row,
      amountINR: parseFloat(row['Amount ($)'] || 0) * CONVERSION_RATE,
    }));
  }, [data]);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Derived calculations for charts
  const { productStats, monthlyStats, countryStats, salesPersonStats } = useMemo(() => {
    const pStats = {};
    const mStats = {};
    const cStats = {};
    const spStats = {};

    processedData.forEach((row) => {
      const product = row['Product'];
      const date = row['Date'];
      const country = row['Country'];
      const salesPerson = row['Sales Person'];
      const amount = row.amountINR;

      if (product) pStats[product] = (pStats[product] || 0) + amount;
      
      if (date) {
        // Assume date is parseable or YYYY-MM-DD
        try {
          const d = new Date(date);
          if (!isNaN(d.getTime())) {
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            mStats[monthKey] = (mStats[monthKey] || 0) + amount;
          }
        } catch(e) {}
      }

      if (country) cStats[country] = (cStats[country] || 0) + amount;
      if (salesPerson) spStats[salesPerson] = (spStats[salesPerson] || 0) + amount;
    });

    return { productStats: pStats, monthlyStats: mStats, countryStats: cStats, salesPersonStats: spStats };
  }, [processedData]);

  // Sorting and selecting top data for charts
  const topProducts = Object.entries(productStats).sort((a, b) => b[1] - a[1]);
  const sortedMonths = Object.entries(monthlyStats).sort((a, b) => a[0].localeCompare(b[0]));
  const topCountries = Object.entries(countryStats).sort((a, b) => b[1] - a[1]);
  const topSalesPersons = Object.entries(salesPersonStats).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Chart configs
  const productChartData = {
    labels: topProducts.map((p) => p[0]),
    datasets: [
      {
        label: 'Revenue (₹)',
        data: topProducts.map((p) => p[1]),
        backgroundColor: '#028090',
      },
    ],
  };

  const productChartOptions = {
    indexAxis: 'y',
    responsive: true,
    plugins: {
      legend: { display: false },
    },
  };

  const monthlyChartData = {
    labels: sortedMonths.map((m) => m[0]),
    datasets: [
      {
        label: 'Sales Trend (₹)',
        data: sortedMonths.map((m) => m[1]),
        borderColor: '#02C39A',
        backgroundColor: 'rgba(2, 195, 154, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const countryChartData = {
    labels: topCountries.map((c) => c[0]),
    datasets: [
      {
        data: topCountries.map((c) => c[1]),
        backgroundColor: [
          '#0A2342',
          '#028090',
          '#02C39A',
          '#F0F7F8',
          '#1E293B',
          '#64748B'
        ],
        borderWidth: 1,
      },
    ],
  };

  const donutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      }
    }
  };

  // Table logic
  const filteredTableData = useMemo(() => {
    return processedData.filter((row) => 
      Object.values(row).some(val => val && val.toString().toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [processedData, searchTerm]);

  const totalPages = Math.ceil(filteredTableData.length / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const currentTableData = filteredTableData.slice(startIdx, startIdx + rowsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="dashboard">
      {/* 1. STAT CARDS ROW */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Total Revenue</div>
          <div className="stat-value">₹54,34,459</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Orders</div>
          <div className="stat-value">333</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Avg Order Value</div>
          <div className="stat-value">₹16,319</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Countries Served</div>
          <div className="stat-value">5</div>
        </div>
      </div>

      <div className="charts-grid">
        {/* 2. HORIZONTAL BAR CHART */}
        <div className="chart-card">
          <div className="chart-header">
            <h2 className="chart-title">Revenue by Product</h2>
          </div>
          <Bar options={productChartOptions} data={productChartData} />
        </div>

        {/* 3. LINE CHART */}
        <div className="chart-card">
          <div className="chart-header">
            <h2 className="chart-title">Monthly Sales Trend</h2>
          </div>
          <Line data={monthlyChartData} />
        </div>

        {/* 4. DONUT CHART */}
        <div className="chart-card">
          <div className="chart-header">
            <h2 className="chart-title">Sales by Country</h2>
          </div>
          <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
            <Doughnut data={countryChartData} options={donutOptions} />
          </div>
        </div>

        {/* 6. TOP SALES PERSONS */}
        <div className="chart-card">
          <div className="chart-header">
            <h2 className="chart-title">Top Sales Persons</h2>
          </div>
          <div className="sales-list">
            {topSalesPersons.length > 0 ? (
              topSalesPersons.map((sp, idx) => (
                <div key={idx} className="sales-person-item">
                  <span className="sales-person-name">{sp[0]}</span>
                  <span className="sales-person-amount">{formatINR(sp[1])}</span>
                </div>
              ))
            ) : (
              <p>No sales data available</p>
            )}
          </div>
        </div>

        {/* 5. DATA TABLE */}
        <div className="chart-card full-width">
          <div className="chart-header">
            <h2 className="chart-title">Raw Orders</h2>
          </div>
          
          <div className="table-controls">
            <input 
              type="text" 
              placeholder="Search orders..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="search-input"
            />
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Sales Person</th>
                  <th>Boxes Shipped</th>
                  <th>Amount (₹)</th>
                  <th>Country</th>
                </tr>
              </thead>
              <tbody>
                {currentTableData.length > 0 ? (
                  currentTableData.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row['Date'] || '-'}</td>
                      <td>{row['Product'] || '-'}</td>
                      <td>{row['Sales Person'] || '-'}</td>
                      <td>{row['Boxes Shipped'] || '-'}</td>
                      <td>{formatINR(row.amountINR)}</td>
                      <td>{row['Country'] || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center' }}>No results found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="page-btn" 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button 
                className="page-btn" 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
