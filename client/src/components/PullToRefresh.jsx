import { useCallback, useRef, useState } from 'react';

const THRESHOLD = 80;

export default function PullToRefresh({ onRefresh, children }) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    // Only trigger if at top of scroll
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!pulling || refreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    if (diff > 0) {
      // Apply resistance
      const distance = Math.min(diff * 0.5, 120);
      setPullDistance(distance);
    }
  }, [pulling, refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) return;
    setPulling(false);
    
    if (pullDistance >= THRESHOLD && onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
    setPullDistance(0);
  }, [pulling, pullDistance, onRefresh]);

  const showIndicator = pullDistance > 10 || refreshing;
  const ready = pullDistance >= THRESHOLD;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ position: 'relative' }}
    >
      {showIndicator && (
        <div
          className="ptr-indicator"
          style={{
            height: refreshing ? 48 : pullDistance,
            opacity: Math.min(pullDistance / THRESHOLD, 1),
          }}
        >
          <div className={`ptr-spinner ${refreshing ? 'spinning' : ''} ${ready ? 'ready' : ''}`}>
            {refreshing ? '↻' : ready ? '↓' : '↓'}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
