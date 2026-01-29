import React, { useEffect } from 'react';

interface StrikeIndicatorProps {
  mistakeCount: number;
  maxMistakes?: number;
}

export default function StrikeIndicator({ mistakeCount, maxMistakes = 3 }: StrikeIndicatorProps) {
  // Add the animation styles to the document head
  useEffect(() => {
    const styleId = 'strike-indicator-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      @keyframes strikeFill {
        0% {
          transform: scale(0.8);
          opacity: 0.5;
        }
        50% {
          transform: scale(1.2);
        }
        100% {
          transform: scale(1.1);
          opacity: 1;
        }
      }
      
      .strike-fill-animation {
        animation: strikeFill 0.4s ease-out;
      }
    `;
    document.head.appendChild(style);
  }, []);

  console.log('StrikeIndicator rendered:', { mistakeCount, maxMistakes });

  return (
    <div style={{
     
      background: 'rgba(0, 0, 0, 0.85)',
      padding: '12px 20px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      zIndex: 10000,
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    }}>
      <span style={{
        color: 'white',
        fontSize: '16px',
        fontWeight: '600',
        letterSpacing: '0.5px'
      }}>
        Strike :
      </span>
      
      <div style={{
        display: 'flex',
        gap: '8px',
      }}>
        {[...Array(maxMistakes)].map((_, index) => (
          <div
            key={index}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: index < mistakeCount ? '#ef4444' : 'white',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: index < mistakeCount 
                ? '0 0 12px rgba(239, 68, 68, 0.6), inset 0 2px 4px rgba(0,0,0,0.2)' 
                : 'inset 0 2px 4px rgba(0,0,0,0.1)',
              transform: index === mistakeCount - 1 ? 'scale(1.1)' : 'scale(1)',
            }}
            className={index === mistakeCount - 1 ? 'strike-fill-animation' : ''}
          />
        ))}
      </div>
    </div>
  );
}