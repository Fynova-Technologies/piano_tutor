'use client'
import { useEffect, useRef, useState } from 'react';


function OSMDBeatCursor() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const containerRef = useRef(null);
  const osmdRef = useRef(null);
  const animationRef = useRef(null);
  const startTimeRef = useRef(0);

  // This is the KEY function - creates beat positions manually
  function createBeatPositions(osmd, beatsPerMeasure = 4) {
    const positions = [];
    
    if (!osmd?.GraphicSheet?.MeasureList) return positions;
    
    const measureList = osmd.GraphicSheet.MeasureList;
    
    // Iterate through each measure
    for (let measureIndex = 0; measureIndex < measureList.length; measureIndex++) {
      const system = measureList[measureIndex];
      if (!Array.isArray(system) || system.length === 0) continue;
      
      const firstStaff = system[0];
      if (!firstStaff) continue;
      
      // Get measure boundaries
      const measureStart = firstStaff.PositionAndShape?.RelativePosition?.x || 0;
      const measureWidth = firstStaff.PositionAndShape?.Size?.width || 100;
      const measureY = firstStaff.PositionAndShape?.RelativePosition?.y || 0;
      
      // Create positions for each beat in this measure
      for (let beat = 0; beat < beatsPerMeasure; beat++) {
        positions.push({
          measureIndex,
          beat,
          x: measureStart + (measureWidth / beatsPerMeasure) * beat,
          y: measureY,
          absoluteBeat: measureIndex * beatsPerMeasure + beat
        });
      }
    }
    
    return positions;
  }

  // Draw custom cursor at specific position
  function drawCustomCursor(osmd, position) {
    if (!osmd?.drawer?.backend?.getSvgElement) return;
    
    const svg = osmd.drawer.backend.getSvgElement();
    
    // Remove old cursor
    const oldCursor = svg.querySelector('.custom-beat-cursor');
    if (oldCursor) oldCursor.remove();
    
    // Create new cursor line
    const cursor = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    cursor.setAttribute('class', 'custom-beat-cursor');
    cursor.setAttribute('x1', position.x.toString());
    cursor.setAttribute('y1', (position.y - 40).toString());
    cursor.setAttribute('x2', position.x.toString());
    cursor.setAttribute('y2', (position.y + 40).toString());
    cursor.setAttribute('stroke', '#FF0000');
    cursor.setAttribute('stroke-width', '3');
    cursor.setAttribute('opacity', '0.8');
    
    svg.appendChild(cursor);
  }

  // Animate cursor through beat positions
  function animateBeatCursor(osmd, tempo = 120) {
    const beatDuration = 60 / tempo; // seconds per beat
    const positions = createBeatPositions(osmd, 4);
    
    if (positions.length === 0) return;
    
    startTimeRef.current = performance.now() / 1000;
    
    function animate() {
      const currentTime = performance.now() / 1000;
      const elapsed = currentTime - startTimeRef.current;
      const beatIndex = Math.floor(elapsed / beatDuration);
      
      if (beatIndex < positions.length) {
        const position = positions[beatIndex];
        drawCustomCursor(osmd, position);
        setCurrentBeat(beatIndex);
        
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // End of score
        setIsPlaying(false);
      }
    }
    
    animate();
  }

  function handlePlayPause() {
    if (!osmdRef.current) return;
    
    if (isPlaying) {
      // Stop
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setIsPlaying(false);
    } else {
      // Start
      setIsPlaying(true);
      animateBeatCursor(osmdRef.current, 120);
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ 
        background: '#f0f8ff', 
        border: '2px solid #4a90e2',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: '0 0 15px 0', color: '#2c5aa0' }}>
          OSMD Beat-Synced Cursor Solution
        </h2>
        
        <div style={{ marginBottom: '15px' }}>
          <strong>The Problem:</strong> OSMD's built-in cursor only moves to positions where notes exist. 
          With a whole note in 4/4, it jumps the entire measure.
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <strong>The Solution:</strong> Create a custom visual cursor that moves through beat positions 
          calculated manually, independent of note events.
        </div>

        <div style={{ 
          background: '#fff', 
          padding: '15px', 
          borderRadius: '6px',
          marginBottom: '15px'
        }}>
          <strong>Key Implementation Steps:</strong>
          <ol style={{ marginBottom: 0, paddingLeft: '20px' }}>
            <li>Calculate beat positions by dividing each measure width by beats per measure</li>
            <li>Create custom cursor (SVG line) at calculated positions</li>
            <li>Animate cursor using requestAnimationFrame with tempo timing</li>
            <li>Hide OSMD's built-in cursor: <code>osmd.cursor.hide()</code></li>
          </ol>
        </div>

        <div style={{ 
          background: '#fffacd', 
          padding: '12px', 
          borderRadius: '6px',
          fontSize: '14px'
        }}>
          <strong>💡 Pro Tip:</strong> For note detection, still use OSMD's cursor iterator at each beat 
          to check which notes should be at that position based on timestamp.
        </div>
      </div>

      <div style={{ 
        background: '#ffffff',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>Implementation Code for Your Project:</h3>
        
        <pre style={{ 
          background: '#2d2d2d',
          color: '#f8f8f2',
          padding: '15px',
          borderRadius: '6px',
          overflow: 'auto',
          fontSize: '13px',
          lineHeight: '1.5'
        }}>
{`// 1. Create beat positions calculator
function createBeatPositions(osmd, beatsPerMeasure = 4) {
  const positions = [];
  const measureList = osmd.GraphicSheet.MeasureList;
  
  for (let i = 0; i < measureList.length; i++) {
    const measure = measureList[i][0]; // First staff
    const startX = measure.PositionAndShape.RelativePosition.x;
    const width = measure.PositionAndShape.Size.width;
    const y = measure.PositionAndShape.RelativePosition.y;
    
    for (let beat = 0; beat < beatsPerMeasure; beat++) {
      positions.push({
        x: startX + (width / beatsPerMeasure) * beat,
        y: y,
        measureIndex: i,
        beat: beat
      });
    }
  }
  return positions;
}

// 2. Draw custom cursor
function drawCustomCursor(osmd, position) {
  const svg = osmd.drawer.backend.getSvgElement();
  
  // Remove old cursor
  const old = svg.querySelector('.custom-beat-cursor');
  if (old) old.remove();
  
  // Draw new cursor line
  const line = document.createElementNS(
    'http://www.w3.org/2000/svg', 
    'line'
  );
  line.setAttribute('class', 'custom-beat-cursor');
  line.setAttribute('x1', position.x);
  line.setAttribute('y1', position.y - 40);
  line.setAttribute('x2', position.x);
  line.setAttribute('y2', position.y + 40);
  line.setAttribute('stroke', '#FF0000');
  line.setAttribute('stroke-width', '3');
  svg.appendChild(line);
}

// 3. Animate with timing
function startBeatAnimation(osmd, tempo = 120) {
  const positions = createBeatPositions(osmd, 4);
  const beatDuration = 60 / tempo; // seconds
  const startTime = performance.now() / 1000;
  
  function animate() {
    const elapsed = (performance.now() / 1000) - startTime;
    const beatIndex = Math.floor(elapsed / beatDuration);
    
    if (beatIndex < positions.length) {
      drawCustomCursor(osmd, positions[beatIndex]);
      requestAnimationFrame(animate);
    }
  }
  
  animate();
}

// 4. In your component setup:
useEffect(() => {
  // ... after OSMD loads and renders ...
  osmd.cursor.hide(); // Hide built-in cursor
  // Now use custom cursor with startBeatAnimation
}, []);`}
        </pre>

        <div style={{ 
          marginTop: '20px',
          padding: '15px',
          background: '#e8f5e9',
          borderLeft: '4px solid #4caf50',
          borderRadius: '4px'
        }}>
          <strong>✅ Result:</strong> Cursor will move smoothly every beat (every quarter note in 4/4), 
          regardless of note duration. A whole note will have the cursor pass through it 4 times.
        </div>

        <div style={{ 
          marginTop: '15px',
          padding: '15px',
          background: '#fff3e0',
          borderLeft: '4px solid #ff9800',
          borderRadius: '4px'
        }}>
          <strong>⚠️ Important:</strong> For scoring, at each beat check which notes should be playing 
          using OSMD's iterator timestamp comparison:
          <pre style={{ 
            marginTop: '10px',
            marginBottom: '0',
            background: '#f5f5f5',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
{`// At each beat, find expected notes
const beatTime = beatIndex * beatDuration;
const expectedNotes = findNotesAtTime(osmd, beatTime);`}
          </pre>
        </div>
      </div>

      <div style={{ 
        marginTop: '30px',
        textAlign: 'center',
        padding: '20px',
        background: '#f9f9f9',
        borderRadius: '8px'
      }}>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
          This solution gives you full control over cursor movement timing,
          <br/>independent of OSMD's note-based cursor system.
        </div>
        <div style={{ fontSize: '12px', color: '#999' }}>
          The cursor will move predictably every beat, making it perfect for teaching piano!
        </div>
      </div>
    </div>
  );
}

export default OSMDBeatCursor;