import { useCallback, useRef, useState } from 'react';

const THRESHOLD = 60;

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const handleTouchStart = useCallback((e) => {
    // Only trigger if at top of scroll
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    if (scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!pulling.current || refreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    if (diff > 0) {
      const distance = Math.min(diff * 0.4, 100);
      setPullDistance(distance);
    } else {
      setPullDistance(0);
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    
    if (pullDistance >= THRESHOLD && onRefresh) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const rotation = refreshing ? 0 : progress * 360;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="ptr-container"
        style={{ 
          height: pullDistance,
          opacity: pullDistance > 5 ? 1 : 0,
        }}
      >
        <svg
          className={`ptr-spinner ${refreshing ? 'spinning' : ''}`}
          width="24"
          height="24"
          viewBox="0 0 24 24"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={refreshing ? '50 12' : `${progress * 50} 100`}
          />
        </svg>
      </div>
      <div style={{ 
        transform: `translateY(${pullDistance > 0 && !refreshing ? pullDistance * 0.3 : 0}px)`,
        transition: pulling.current ? 'none' : 'transform 0.2s ease-out'
      }}>
        {children}
      </div>
    </div>
  );
}
