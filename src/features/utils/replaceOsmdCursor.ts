import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
export default function replaceOsmdCursor(osmd:OpenSheetMusicDisplay) {
    try {
        console.log("🔧 replaceOsmdCursor called");
        const img = osmd.cursor.cursorElement;
        console.log("📍 Cursor element:", img);
        
        if (!img) {
        console.warn("❌ No cursor element found!");
        return;
        }
        
        try {
            img.style.display = "none";
            console.log("✅ Original cursor hidden");
        } catch (e) {
            console.warn("Failed to hide original cursor:", e);
        }
        
        
        // Create new custom cursor
        const custom = document.createElement("div");
        custom.id = "custom-vertical-cursor";
        custom.style.position = "absolute";
        custom.style.background = "rgba(255, 0, 0, 0.2)";
        custom.style.border = "2px solid rgba(255, 0, 0, 0.7)";
        custom.style.borderRadius = "4px";
        custom.style.pointerEvents = "none";
        custom.style.zIndex = "9999";
        
        // img.parentElement?.appendChild(custom);
        const parent = img.parentElement;
        console.log("👪 Parent element:", parent);
        if (parent) {
        parent.appendChild(custom);
        console.log("✅ Custom cursor created and appended");
            } else {
        console.warn("❌ No parent element found!");
            }
        const originalUpdate = osmd.cursor.update?.bind(osmd.cursor);
        if (!originalUpdate) {
        console.warn("❌ No cursor.update method found!");
        return;
            }
        console.log("✅ Overriding cursor.update method");
        osmd.cursor.update = function (...args) {
        originalUpdate(...args);
        
        const el = osmd.cursor.cursorElement;
        if (!el) return;
        try {
        const rect = el.getBoundingClientRect();
        const parentRect = img.parentElement?.getBoundingClientRect();
        if (!parentRect) return;
        // Get the actual staff lines to determine proper height
        const staffLines = img.parentElement?.querySelectorAll('.vf-stave, [class*="StaffLine"]');
        let staffHeight = 100; // Default fallback
        console.log("First staff line rect:", staffLines);

        
        //here is the main fault in the logic that needs to be fixed
        if (staffLines && staffLines.length > 0) {
        // Calculate height to cover all staves
        const firstStaff = staffLines[0].getBoundingClientRect();
        console.log("First staff line rect:", firstStaff);
        const lastStaff = staffLines[staffLines.length - 1].getBoundingClientRect();
        staffHeight = (lastStaff.bottom - firstStaff.top) + 40; // Add padding
                } else {
        // Use a larger multiplier if we can't find staff lines
        staffHeight = rect.height * 3;
                }
        const left = rect.left - parentRect.left+10;
        const top = rect.top - parentRect.top;
        // Wide rectangular cursor covering full staff height
        const cursorWidth = 25;
        const cursorHeight = Math.max(staffHeight, 250); // Ensure minimum height
        custom.style.left = `${Math.round(left - 8)}px`;
        custom.style.top = `${Math.round(top - 30)}px`; // Start higher to cover top of staff
        custom.style.height = `${Math.round(cursorHeight)}px`;
        custom.style.width = `${cursorWidth}px`;
        custom.style.display = 'block'; // Ensure it's visible
              } catch (e) {
        console.warn("error is ", e);
              }
            };
          } catch (e) {
        console.warn("replaceOsmdCursor failed", e);
    }
}