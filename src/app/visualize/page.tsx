/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';

// We'll use JSZip to decompress .mxl files
// Add this to your package.json: npm install jszip
declare const JSZip: any;

export default function MusicXMLVisualizer() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [osmd, setOsmd] = useState<any>(null);
  const [zoom, setZoom] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [jszipLoaded, setJszipLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load JSZip from CDN for .mxl support
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.async = true;
    script.onload = () => {
      console.log('JSZip loaded');
      setJszipLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load JSZip');
    };
    document.head.appendChild(script);

    return () => {
      try {
        document.head.removeChild(script);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        // Script might already be removed
      }
    };
  }, []);

  const handleFileSelect = async (selectedFile: File | null) => {
    if (!selectedFile) return;

    setError('');
    setFile(selectedFile);
    setLoading(true);

    // Use setTimeout to ensure DOM is updated
    setTimeout(async () => {
      try {
        // For all file types, just pass the file directly to OSMD
        await renderMusicXML(selectedFile);
        setLoading(false);
      } catch (err: any) {
        setError(`Error reading file: ${err.message}`);
        console.error(err);
        setLoading(false);
      }
    }, 100);
  };

  const renderMusicXML = async (file: File) => {
    if (!containerRef.current) {
      console.error('Container ref is null');
      setError('Container not ready. Please refresh and try again.');
      setLoading(false);
      return;
    }

    console.log('Container ready, starting render...');
    console.log('File type:', file.name, 'Size:', file.size);

    try {
      // Clear previous content
      containerRef.current.innerHTML = '';

      const newOsmd = new OpenSheetMusicDisplay(containerRef.current, {
        backend: 'svg',
        autoResize: true,
        drawTitle: true,
        drawComposer: true,
        drawLyricist: true,
        drawCredits: true,
        drawPartNames: true,
        drawMetronomeMarks: true,
        drawingParameters: 'default'
      });

      console.log('OSMD instance created, loading file...');
      
      let content: string;
      
      // Handle .mxl (compressed) files
      if (file.name.endsWith('.mxl')) {
        if (!jszipLoaded || typeof JSZip === 'undefined') {
          throw new Error('JSZip library not loaded yet. Please wait a moment and try again.');
        }
        
        console.log('Decompressing .mxl file...');
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        
        // Find the main XML file in the archive
        // Usually it's in META-INF/container.xml which points to the actual file
        // But often it's just named something.xml in the root
        let xmlFile = null;
        
        // Look for container.xml first
        const containerFile = zip.file('META-INF/container.xml');
        if (containerFile) {
          const containerXml = await containerFile.async('string');
          // Parse to find the rootfile path
          const match = containerXml.match(/full-path="([^"]+)"/);
          if (match) {
            xmlFile = zip.file(match[1]);
          }
        }
        
        // If not found, look for any .xml file in root
        if (!xmlFile) {
          const files = Object.keys(zip.files);
          for (const fileName of files) {
            if (fileName.endsWith('.xml') && !fileName.includes('META-INF')) {
              xmlFile = zip.file(fileName);
              break;
            }
          }
        }
        
        if (!xmlFile) {
          throw new Error('Could not find MusicXML content in .mxl archive');
        }
        
        content = await xmlFile.async('string');
        console.log('Decompressed successfully, XML length:', content.length);
      } else {
        // Handle uncompressed .xml and .musicxml files
        content = await file.text();
        console.log('File content length:', content.length);
      }
      
      console.log('First 200 chars:', content.substring(0, 200));
      
      // Check if it's actually XML
      if (!content.trim().startsWith('<?xml') && !content.trim().startsWith('<score-partwise')) {
        throw new Error('File does not appear to be valid MusicXML.');
      }
      
      await newOsmd.load(content);
      
      console.log('File loaded, rendering...');
      newOsmd.zoom = zoom;
      await newOsmd.render();
      
      console.log('Render complete!');
      setOsmd(newOsmd);
      setError('');
    } catch (err: any) {
      setError(`Error rendering MusicXML: ${err.message}`);
      console.error('Full error:', err);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (
      droppedFile.name.endsWith('.xml') || 
      droppedFile.name.endsWith('.musicxml') ||
      droppedFile.name.endsWith('.mxl')
    )) {
      handleFileSelect(droppedFile);
    } else {
      setError('Please upload a valid MusicXML file (.xml, .musicxml, or .mxl)');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleZoomIn = async () => {
    const newZoom = Math.min(zoom + 0.1, 2.0);
    setZoom(newZoom);
    if (osmd && containerRef.current) {
      osmd.zoom = newZoom;
      await osmd.render();
    }
  };

  const handleZoomOut = async () => {
    const newZoom = Math.max(zoom - 0.1, 0.5);
    setZoom(newZoom);
    if (osmd && containerRef.current) {
      osmd.zoom = newZoom;
      await osmd.render();
    }
  };

  const handleReset = async () => {
    setZoom(1.0);
    if (osmd && containerRef.current) {
      osmd.zoom = 1.0;
      await osmd.render();
    }
  };

  const handleClear = () => {
    setFile(null);
    setError('');
    setOsmd(null);
    setZoom(1.0);
    setLoading(false);
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '24px', 
          marginBottom: '20px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 'bold', color: '#1a202c' }}>
            🎵 MusicXML Visualizer
          </h1>
          <p style={{ margin: 0, color: '#718096', fontSize: '14px' }}>
            Upload your MusicXML file (.xml, .musicxml, or .mxl) to visualize the sheet music
          </p>
        </div>

        {/* Upload Area */}
        {!file && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '48px',
              textAlign: 'center',
              border: isDragging ? '3px dashed #667eea' : '3px dashed #e2e8f0',
              backgroundColor: isDragging ? '#f7fafc' : 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📤</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#1a202c' }}>
              {isDragging ? 'Drop your file here' : 'Upload MusicXML File'}
            </h3>
            <p style={{ margin: 0, color: '#718096', fontSize: '14px' }}>
              Drag and drop or click to browse
            </p>
            <p style={{ margin: '8px 0 0 0', color: '#a0aec0', fontSize: '12px' }}>
              Supports .xml, .musicxml, and .mxl files (compressed MusicXML supported!)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xml,.musicxml,.mxl"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#fed7d7',
            border: '1px solid #fc8181',
            borderRadius: '8px',
            padding: '16px',
            marginTop: '20px',
            color: '#c53030'
          }}>
            <strong>Error:</strong> {error}
            {error.includes('not well-formed') && (
              <div style={{ marginTop: '12px', fontSize: '14px', lineHeight: '1.6' }}>
                <strong>💡 Tip:</strong> If youre using MuseScore, export as <strong>uncompressed MusicXML</strong>:
                <ol style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
                  <li>File → Export → MusicXML</li>
                  <li>Choose <strong>MusicXML</strong> or <strong>Uncompressed MusicXML (.musicxml)</strong></li>
                  <li>Do NOT choose Compressed MusicXML (.mxl)</li>
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        {file && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1', minWidth: '200px' }}>
              <span style={{ fontSize: '14px', color: '#4a5568' }}>
                📄 <strong>{file.name}</strong>
              </span>
              <span style={{ 
                background: '#e6fffa', 
                color: '#234e52', 
                padding: '4px 12px', 
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                Zoom: {(zoom * 100).toFixed(0)}%
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={handleZoomOut}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  background: loading ? '#e2e8f0' : '#edf2f7',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#2d3748'
                }}
              >
                🔍− Zoom Out
              </button>
              
              <button
                onClick={handleZoomIn}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  background: loading ? '#e2e8f0' : '#edf2f7',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#2d3748'
                }}
              >
                🔍+ Zoom In
              </button>
              
              <button
                onClick={handleReset}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  background: loading ? '#e2e8f0' : '#edf2f7',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#2d3748'
                }}
              >
                🔄 Reset
              </button>
              
              <button
                onClick={handleClear}
                style={{
                  padding: '8px 16px',
                  background: '#feb2b2',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#742a2a'
                }}
              >
                ❌ Clear
              </button>
            </div>
          </div>
        )}

        {/* Sheet Music Display Container - ALWAYS RENDERED */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          minHeight: '400px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          overflow: 'auto',
          display: file ? 'block' : 'none'
        }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '48px', color: '#4a5568' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <p style={{ margin: 0, fontSize: '16px' }}>
                Rendering sheet music...
              </p>
            </div>
          )}
          <div ref={containerRef} style={{ width: '100%', display: loading ? 'none' : 'block' }} />
        </div>

        {/* Instructions */}
        {!file && !error && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginTop: '20px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#1a202c' }}>
              How to use:
            </h3>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#4a5568', lineHeight: '1.8' }}>
              <li>Click the upload area or drag and drop your MusicXML file</li>
              <li>The sheet music will be rendered automatically using OSMD</li>
              <li>Use zoom controls to adjust the view and inspect details</li>
              <li>Verify that all notes, rests, time signatures, and timing appear correctly</li>
              <li>Check that whole notes show as full whole notes (⚪) not quarter notes (♩)</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}