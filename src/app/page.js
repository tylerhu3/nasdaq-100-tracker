'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/components/ThemeProvider';

export default function Home() {
  const [stocks, setStocks] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'stdRange', direction: 'ascending' });
  const { theme, toggleTheme } = useTheme();

  async function fetchData(force = false) {
    setLoading(true);
    try {
      const url = force ? '/api/stocks?force=true' : '/api/stocks';
      console.log(`[Frontend] Fetching stocks from ${url}...`);

      const res = await fetch(url);
      const data = await res.json();

      console.log('[Frontend] API Response:', data);
      console.log(`[Frontend] Received ${data.stocks?.length || 0} stocks. Source: ${data.source}`);

      setStocks(data.stocks);
      setLastUpdated(data.lastUpdated);
    } catch (error) {
      console.error('[Frontend] Failed to fetch stocks:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    const password = window.prompt("Enter password to refresh:");
    if (password === 'tyler') {
      fetchData(true);
    } else {
      alert("Incorrect password");
    }
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedStocks = [...stocks].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // Helper to parse numbers from strings like "$123.45", "+1.2%", "1,234"
    const parseValue = (val) => {
      if (typeof val === 'string') {
        const clean = val.replace(/[$,%]/g, '');
        const num = parseFloat(clean);
        return isNaN(num) ? val.toLowerCase() : num;
      }
      return val;
    };

    if (sortConfig.key === 'stdRange') {
      // Calculation helper
      const getStdRange = (item) => {
        if (item.yearLow && item.yearHigh && item.price) {
          const low = parseFloat(item.yearLow);
          const high = parseFloat(item.yearHigh);
          const price = parseFloat(item.price);
          if (!isNaN(low) && !isNaN(high) && !isNaN(price) && high !== low) {
            return (price - low) / (high - low);
          }
        }
        return -Infinity; // Put undefined at bottom
      };
      aValue = getStdRange(a);
      bValue = getStdRange(b);
    } else {
      aValue = parseValue(aValue);
      bValue = parseValue(bValue);
    }

    if (aValue < bValue) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };



  return (
    <main className="container">
      <div className="header-actions">
        <button className="theme-toggle" onClick={handleRefresh} aria-label="Refresh Data">
          🔄
        </button>
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
      <h1>NASDAQ-100</h1>
      <p className="subtitle">Daily market data from the top 100 non-financial companies</p>

      {lastUpdated && (
        <div className="last-updated" style={{ marginTop: '-2rem', marginBottom: '2rem' }}>
          Data last updated: {new Date(lastUpdated).toLocaleString()}
        </div>
      )}

      <div className="legend-container">
        <span className="legend-label">Year Low</span>
        <div className="legend-bar"></div>
        <span className="legend-label">Year High</span>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th onClick={() => requestSort('symbol')} style={{ cursor: 'pointer' }}>
                Symbol{getSortIndicator('symbol')}
              </th>
              <th onClick={() => requestSort('name')} style={{ cursor: 'pointer' }}>
                Name{getSortIndicator('name')}
              </th>
              <th onClick={() => requestSort('price')} style={{ cursor: 'pointer' }}>
                Price{getSortIndicator('price')}
              </th>
              <th onClick={() => requestSort('targetMeanPrice')} style={{ cursor: 'pointer' }}>
                1Y Target{getSortIndicator('targetMeanPrice')}
              </th>
              <th onClick={() => requestSort('previousClose')} style={{ cursor: 'pointer' }}>
                Prev Close{getSortIndicator('previousClose')}
              </th>
              <th onClick={() => requestSort('marketCap')} style={{ cursor: 'pointer' }}>
                Market Cap{getSortIndicator('marketCap')}
              </th>
              <th onClick={() => requestSort('volume')} style={{ cursor: 'pointer' }}>
                Volume{getSortIndicator('volume')}
              </th>
              <th>Day Range</th>
              <th onClick={() => requestSort('yearRange')} style={{ cursor: 'pointer' }}>
                Year Range{getSortIndicator('yearRange')}
              </th>
              <th onClick={() => requestSort('stdRange')} style={{ cursor: 'pointer' }}>
                Std Range{getSortIndicator('stdRange')}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Skeleton Rows
              Array.from({ length: 15 }).map((_, index) => (
                <tr key={`skeleton-${index}`}>
                  <td><div className="skeleton skeleton-text skeleton-symbol"></div></td>
                  <td><div className="skeleton skeleton-text skeleton-name"></div></td>
                  <td><div className="skeleton skeleton-text"></div></td>
                  <td><div className="skeleton skeleton-text"></div></td>
                  <td><div className="skeleton skeleton-text"></div></td>
                  <td><div className="skeleton skeleton-text"></div></td>
                  <td><div className="skeleton skeleton-text"></div></td>
                  <td><div className="skeleton skeleton-text"></div></td>
                  <td><div className="skeleton skeleton-text"></div></td>
                  <td><div className="skeleton skeleton-text"></div></td>
                </tr>
              ))
            ) : (
              sortedStocks.map((stock) => {

                // Calculate standard range for display and sorting
                let stdRangeVal = '-';
                let stdRangeNum = 0.5; // Default to neutral

                if (stock.yearLow && stock.yearHigh && stock.price) {
                  const low = parseFloat(stock.yearLow);
                  const high = parseFloat(stock.yearHigh);
                  const price = parseFloat(stock.price);
                  if (!isNaN(low) && !isNaN(high) && !isNaN(price) && high !== low) {
                    stdRangeNum = (price - low) / (high - low);
                    // clamp between 0 and 1 just in case
                    stdRangeNum = Math.max(0, Math.min(1, stdRangeNum));
                    stdRangeVal = stdRangeNum.toFixed(2);
                  }
                }

                // Calculate tint
                // > 0.5 -> Green
                // < 0.5 -> Red
                // Intensity increases per each .01 change
                let rowStyle = {};
                const diff = stdRangeNum - 0.5;
                if (Math.abs(diff) >= 0.01) {
                  // Quantize to 0.01 steps
                  const steps = Math.floor(Math.abs(diff) / 0.01);

                  // Each step adds 1% opacity (0.01)
                  // Max diff 0.5 -> 50 steps -> 0.50 opacity
                  const opacity = steps * 0.01;

                  if (diff > 0) {
                    // Green
                    rowStyle.backgroundColor = `rgba(0, 200, 83, ${opacity.toFixed(2)})`;
                  } else {
                    // Red
                    rowStyle.backgroundColor = `rgba(255, 61, 0, ${opacity.toFixed(2)})`;
                  }
                }

                // Helper to format prices
                const formatPrice = (val) => {
                  if (val === null || val === undefined || val === 'N/A') return 'N/A';
                  const num = parseFloat(val);
                  if (isNaN(num)) return val;
                  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                };

                return (
                  <tr key={stock.symbol} style={rowStyle}>
                    <td className="symbol">
                      <a
                        href={`https://www.google.com/search?q=${stock.symbol} stock`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}
                        className="hover:underline"
                      >
                        {stock.symbol}
                      </a>
                    </td>
                    <td className="name" title={stock.name}>{stock.name}</td>
                    <td className="price">{formatPrice(stock.price)}</td>
                    <td className="target-price">
                      {formatPrice(stock.targetMeanPrice)}
                    </td>
                    <td className="prev-close">
                      {formatPrice(stock.previousClose)}
                    </td>
                    <td className="market-cap">{stock.marketCap}</td>
                    <td className="volume">{stock.volume ? stock.volume.toLocaleString() : '-'}</td>
                    <td className="range">
                      {stock.dayLow && stock.dayHigh ? `${formatPrice(stock.dayLow)} - ${formatPrice(stock.dayHigh)}` : '-'}
                    </td>
                    <td className="range">
                      {(() => {
                        if (!stock.yearLow || !stock.yearHigh || !stock.price) return '-';

                        const low = parseFloat(stock.yearLow);
                        const high = parseFloat(stock.yearHigh);
                        const price = parseFloat(stock.price);

                        if (isNaN(low) || isNaN(high) || isNaN(price)) return '-';

                        let percentage = ((price - low) / (high - low)) * 100;
                        percentage = Math.max(0, Math.min(100, percentage));

                        return (
                          <div className="range-bar-container">
                            <span className="range-label">{low.toFixed(2)}</span>
                            <div className="range-track">
                              <div className="range-dot" style={{ left: `${percentage}%` }} title={`Current: ${price}`} />
                            </div>
                            <span className="range-label">{high.toFixed(2)}</span>
                          </div>
                        );
                      })()}
                    </td>
                    <td>{stdRangeVal}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>


    </main>
  );
}
