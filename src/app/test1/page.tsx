// 'use client'
// import { useEffect,useRef } from "react";
// import React from 'react';
// import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
// import { Pitch } from "opensheetmusicdisplay";


// export default function Test1Page({xml= "/songs/mxl/Happy_Birthday_To_You_C_Major.musicxml"}: {xml?: string}) {
//     const containerRef = useRef<HTMLDivElement>(null!);
//     const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);

//     function getClefReference(clefType) {
//   // clefType = gm.InitiallyActiveClef.clefType
//   switch (clefType) {

//     case 0: // Treble
//       return { midi: 67, line: 2 }; // G4 on line 2

//     case 1: // Bass
//       return { midi: 53, line: 4 }; // F3 on line 4

//     case 2: // Alto
//       return { midi: 60, line: 3 }; // C4 on line 3

//     case 3: // Tenor
//       return { midi: 60, line: 4 }; // C4 on line 4

//     default:
//       console.warn("Unknown clefType => default to treble");
//       return { midi: 67, line: 2 };
//   }
// }


//     function getFirstAvailableStaff(osmd) {
//        const measures = osmd.GraphicSheet.MeasureList;

//     for (let m = 0; m < measures.length; m++) {
//         for (let s = 0; s < measures[m].length; s++) {

//             const gm = measures[m][s]; // GraphicalMeasure

//             if (gm.staffEntries.length > 0) {
//                 return {
//                     gm,                           // full graphicalMeasure
//                     staff: gm.parentStaff,        // staff object
//                     stave: gm.stave,              // VexFlow stave (x,y)
//                     clef: gm.InitiallyActiveClef, // ✔️ REAL clef info
//                 };
//             }
//         }
//     }

//     console.warn("No staff found");
//     return null;
// }



//     function getStafflineIndexFromMidi(midi, clefType) {
//   const ref = getClefReference(clefType);

//   return ref.line + (midi - ref.midi) / 2;
// }



//     function staffLineIndexToY(stafflineIndex, stave, rules) {
//   const topY = stave.y; // where Line 5 is drawn
//   const lineSpacing = rules.StaffHeight / 10;

//   return topY + (5 - stafflineIndex) * lineSpacing;
// }





//     function drawCircleAt(x, y) {
//         const svg = document.querySelector("#osmd-container svg");
//         if (!svg) return;

//         const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
//         dot.setAttribute("cx", x);
//         dot.setAttribute("cy", y);
//         dot.setAttribute("r", "6");
//         dot.setAttribute("fill", "red");
//         dot.setAttribute("class", "midi-dot");

//         svg.appendChild(dot);

//         // fadeout
//         setTimeout(() => {
//           dot.remove();
//         }, 500);
//     }

//     function drawDotForMidiNote(midi) {
//     const osmd = osmdRef.current;
//     if (!osmd) return;

//     const info = getFirstAvailableStaff(osmd);
//     if (!info) return;

//     const { staff, stave, clef } = info;

//     const stafflineIndex = getStafflineIndexFromMidi(midi, clef);
//     const y = staffLineIndexToY(stafflineIndex, stave, osmd.EngravingRules);

//     const x = stave.x + 40;

//     drawCircleAt(x, y);
// }




//     useEffect(() => {
//         if (!containerRef.current) return;  // <-- IMPORTANT

//         const osmd = new OpenSheetMusicDisplay(containerRef.current, {
//           backend: "svg",
//           drawingParameters: "default",
//           autoResize: true,
//           pageBackgroundColor: "#fff",
//         });

    
//         async function load() {
//           await osmd.load(xml);
//           await osmd.render();    
//           console.log("GraphicSheet:", osmd.GraphicSheet);
//         console.log("MeasureList:", osmd.GraphicSheet.MeasureList);
    
//         }
    
//         load();
//         osmdRef.current = osmd;
        
//         // ⭐ Add window resize listener
//         const onResize = () => {
//           osmd.render();
//           const svg = document.querySelector("#score-container svg");
//             if (svg && !document.getElementById("highlightFilter")) {
//                 const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

//                 defs.innerHTML = `
//                   <filter id="highlightFilter">
//                     <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="red" />
//                   </filter>
//                 `;

//                 svg.prepend(defs);
//             }

//           setTimeout(() => {
//           }, 250);
//         };
//         window.addEventListener("resize", onResize);
//         return () => {
//           window.removeEventListener("resize", onResize);
//         };
//       }, []);
    

//     function findOsmdNotesByMidi(midiNumber) {
//         const osmd = osmdRef.current;
//         if (!osmd || !osmd.GraphicSheet) return [];

//         const matches = [];

//         for (const staff of osmd.GraphicSheet.MeasureList) {
//           for (const measure of staff) {
//             for (const entry of measure.staffEntries) {
//               for (const gve of entry.graphicalVoiceEntries) {
//                 for (const gn of gve.notes) {
//                   if (gn.sourceNote.halfTone === midiNumber) {
//                     matches.push(gn);
//                   }
//                 }
//               }
//             }
//           }
//         }
    
//         return matches;
//     }


//     useEffect(() => {
//         if (navigator.requestMIDIAccess) {
//           navigator.requestMIDIAccess().then(onMIDISuccess);
//         }

//         function onMIDISuccess(midiAccess) {
//           for (let input of midiAccess.inputs.values()) {
//             input.onmidimessage = onMIDIMessage;
//           }
//         }
    
//         function onMIDIMessage(message) {
//           const [command, note, velocity] = message.data;
        
//           if (command === 144 && velocity > 0) {
//             console.log("MIDI Note On:", note);
//             // Note ON
//             highlightOsmdNote(note);
//             drawDotForMidiNote(note);
//           }
//         }
//     }, []);
  

//     function highlightGraphicalNote(graphicalNote) {
//   const group = graphicalNote.getSVGGElement?.();
//   if (!group) return;

//   // Highlight all shapes inside the note group
//   const elements = group.querySelectorAll("*");
//   const pos = graphicalNote.boundingBox.absolutePosition;
//     console.log("OSMD X Y:", pos.x, pos.y);

//   elements.forEach(el => {
//     el.style.fill = "red";
//     el.style.stroke = "red";
//     el.style.filter = "drop-shadow(0px 0px 6px red)";
//     el.style.strokeWidth = "2px";
//   });

//   setTimeout(() => {
//     elements.forEach(el => {
//       el.style.fill = "";
//       el.style.stroke = "";
//       el.style.strokeWidth = "";
//       el.style.filter = "";
//     });
//   }, 500);
// }



//    function highlightOsmdNote(midiNote) {
//   const notes = findOsmdNotesByMidi(midiNote);
//   notes.forEach(n => highlightGraphicalNote(n));
//   console.log("MIDI Note:", midiNote, "Matches:", notes.length);

// }



//      return (
//     <div
//       ref={containerRef}
//       className="bg-white"
//       style={{ width: "100%", minHeight: "100vh" }}
//     />
//   );
// }


export default function Test1Page(){
  return(
    <>
    </>
  )
}


