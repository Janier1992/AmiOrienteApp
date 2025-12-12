
import React, { useRef, useState, useEffect, useMemo } from 'react';

/**
 * VirtualList - Optimized rendering for large lists.
 * Renders only items currently in viewport.
 */
const VirtualList = ({ 
  items, 
  height = '100%', 
  itemHeight = 50, 
  renderItem,
  className 
}) => {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    
    // Initial measure
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  // Calculate visible range
  const { startIndex, endIndex, totalHeight, offsetY } = useMemo(() => {
    const totalHeight = items.length * itemHeight;
    const startIndex = Math.floor(scrollTop / itemHeight);
    // Render a few extra items for smoothness (buffer)
    const visibleItemCount = Math.ceil(containerHeight / itemHeight);
    const buffer = 5; 
    const endIndex = Math.min(
      items.length - 1,
      startIndex + visibleItemCount + buffer
    );
    
    // Determine actual start with buffer
    const renderStart = Math.max(0, startIndex - buffer);
    const offsetY = renderStart * itemHeight;

    return { 
      startIndex: renderStart, 
      endIndex, 
      totalHeight, 
      offsetY 
    };
  }, [scrollTop, containerHeight, items.length, itemHeight]);

  const visibleItems = items.slice(startIndex, endIndex + 1);

  return (
    <div 
      ref={containerRef}
      className={`overflow-y-auto relative ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VirtualList;
