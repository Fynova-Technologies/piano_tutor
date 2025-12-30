/* eslint-disable @typescript-eslint/no-explicit-any */
import handleFileUpload from "../utils/fileupload";
import React from "react";


type RenderOpenMusicSheetProps = {
    showUploadPanel: boolean;
    setShowUploadPanel: React.Dispatch<React.SetStateAction<boolean>>;
    uploadError: string | null;
    setUploadError: React.Dispatch<React.SetStateAction<string | null>>;
    uploadLoading: boolean;
    setUploadLoading: React.Dispatch<React.SetStateAction<boolean>>;
    uploadedMusicXML: string | null;
    setUploadedMusicXML: React.Dispatch<React.SetStateAction<string | null>>;
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
    osmdRef: React.MutableRefObject<any>;
    playModeRef: React.MutableRefObject<boolean>;
    totalStepsRef: React.MutableRefObject<number>;
    correctStepsRef: React.MutableRefObject<number>;
    scoredStepsRef: React.MutableRefObject<Set<number>>;
    currentCursorStepRef: React.MutableRefObject<number>;
    currentStepNotesRef: React.MutableRefObject<number[]>;
    setPlayIndex: (index: number) => void;
    playIndex: number;
    totalSteps: number;
    midiOutputs: WebMidi.MIDIOutput[];
    midiInRef: React.RefObject<MIDIInput | null>;
    setCountdown: (countdown: number | null) => void;
    setHighScore: React.Dispatch<React.SetStateAction<number | null>>;
    setLastScore:  React.Dispatch<React.SetStateAction<number | null>>;
    score: number;
    highScore: number;
    lastScore: number | null,
    setCurrentStepNotes: (notes: number[]) => void,
    setScore: (score: number | null) => void,
    playbackMidiGuard: React.MutableRefObject<number>,
    onProgressClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, osmdRef: React.MutableRefObject<any>, setPlayIndex: (n: number) => void) => void,
    containerRef: React.RefObject<HTMLDivElement | null>,
    countdown: number | null,
    progressPercent: number
    ;
};
export default function RenderOpenMusicSheet(props: RenderOpenMusicSheetProps) {
    const {
        showUploadPanel,
        setShowUploadPanel,
        uploadError,
        setUploadError,
        uploadLoading,
        setUploadLoading,
        uploadedMusicXML,
        setUploadedMusicXML,

    } = props;
    return(
        <>
            <div style={{ padding: 16 }}>
      {/* ========== NEW: Upload Panel ========== */}
      {showUploadPanel && (
        <div className="upload-panel">
          <h2 style={{ marginTop: 0 }}>Upload Sheet Music Image</h2>
          <p style={{ color: '#666', marginBottom: 16 }}>
            Convert your sheet music image to MusicXML and play it
          </p>
          
          <label className="upload-btn">
            {uploadLoading ? '⏳ Converting...' : '📁 Choose Image (PNG/JPG/PDF)'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,application/pdf"
              onChange={e => handleFileUpload(e, setUploadError, setUploadLoading, setUploadedMusicXML, setShowUploadPanel)}
              disabled={uploadLoading}
              style={{ display: 'none' }}
            />
          </label>

          {uploadError && (
            <div className="error-box">
              <strong>❌ Error:</strong> {uploadError}
            </div>
          )}

          {uploadedMusicXML && (
            <div className="success-box">
              <strong>✅ Success!</strong> Sheet music loaded and ready to play
            </div>
          )}

          <div style={{ marginTop: 16, fontSize: 13, color: '#666' }}>
            <strong>Or continue with default song</strong>
            <button
              onClick={() => setShowUploadPanel(false)}
              style={{
                display: 'block',
                margin: '8px auto 0',
                padding: '8px 16px',
                background: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Use Default Song
            </button>
          </div>
        </div>
      )}

      {!showUploadPanel && (
        <div style={{ marginBottom: 12, display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#666' }}>
            {uploadedMusicXML ? '📄 Uploaded Sheet' : '📄 Default Song'}
          </span>
          <button
            onClick={() => {
              setShowUploadPanel(true);
              setUploadError(null);
            }}
            style={{
              padding: '4px 8px',
              background: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            🔄 Upload New
          </button>
        </div>
      )}
    </div>
 
        </>
    )
}
