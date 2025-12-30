import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";

export default function replaceOsmdCursor(osmd: OpenSheetMusicDisplay) {
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

    const parent = img.parentElement;
    console.log("👪 Parent element:", parent);
    
    if (parent) {
      parent.appendChild(custom);
      console.log("✅ Custom cursor created and appended");
    } else {
      console.warn("❌ No parent element found!");
      return;
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

        // Get the current iterator position to access measure data
        const iterator = osmd.cursor.iterator;
        if (!iterator) {
          console.warn("No iterator found");
          return;
        }

        // Use type assertion to access private properties
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const iteratorAny = iterator as any;
        const currentMeasure = iteratorAny.currentMeasure || iteratorAny.CurrentMeasure;
        
        if (!currentMeasure) {
          console.warn("No current measure found");
          return;
        }

        let systemTopY = 0;
        let systemBottomY = 100;
        let found = false;
        
        try {
          console.log("📊 Current measure:", currentMeasure);
          
          // Access the parent music system which contains all staves
          const musicSystem = currentMeasure.parentMusicSystem;
          
          if (musicSystem && musicSystem.StaffLines && musicSystem.StaffLines.length > 0) {
            console.log("📝 StaffLines found:", musicSystem.StaffLines.length);
            
            // Use OSMD's internal positioning - it's more reliable
            let minY = Infinity;
            let maxY = -Infinity;
            
            for (const staff of musicSystem.StaffLines) {
              if (staff.PositionAndShape) {
                const staffY = staff.PositionAndShape.RelativePosition.y;
                const staffTop = staffY + staff.PositionAndShape.BorderTop;
                const staffBottom = staffY + staff.PositionAndShape.BorderBottom;
                
                minY = Math.min(minY, staffTop);
                maxY = Math.max(maxY, staffBottom);
                
                console.log(`Staff ${staff.ParentStaff?.Id || 'unknown'}:`, {
                  y: staffY,
                  top: staffTop,
                  bottom: staffBottom
                });
              }
            }
            
            if (minY !== Infinity && maxY !== -Infinity) {
              // Store the height in OSMD units
              const heightInUnits = maxY - minY;
              
              // We'll use this as a height offset from the original cursor position
              systemTopY = minY;
              systemBottomY = maxY;
              found = true;
              
              console.log("📏 System boundaries in units:", {
                staffCount: musicSystem.StaffLines.length,
                minY,
                maxY,
                heightInUnits,
                zoom: osmd.zoom
              });
            }
          }
          
          // Fallback: try using verticalMeasureList
          if (!found && currentMeasure.verticalMeasureList) {
            const verticalMeasureList = currentMeasure.verticalMeasureList;
            
            if (verticalMeasureList.length > 0) {
              console.log("📝 Using vertical measures:", verticalMeasureList.length);
              
              let minY = Infinity;
              let maxY = -Infinity;
              
              for (const vMeasure of verticalMeasureList) {
                if (vMeasure.PositionAndShape) {
                  const y = vMeasure.PositionAndShape.RelativePosition.y;
                  const top = y + vMeasure.PositionAndShape.BorderTop;
                  const bottom = y + vMeasure.PositionAndShape.BorderBottom;
                  
                  minY = Math.min(minY, top);
                  maxY = Math.max(maxY, bottom);
                }
              }
              
              if (minY !== Infinity && maxY !== -Infinity) {
                systemTopY = minY * 10 * osmd.zoom;
                systemBottomY = maxY * 10 * osmd.zoom;
                found = true;
                
                console.log("📏 From verticalMeasureList:", {
                  totalHeight: Math.round(systemBottomY - systemTopY)
                });
              }
            }
          }
          
        } catch (e) {
          console.warn("Error calculating from OSMD structure:", e);
        }

        // Position the cursor
        const left = rect.left - parentRect.left;
        const originalTop = rect.top - parentRect.top;
        
        // Calculate cursor dimensions
        const cursorWidth = 25;
        let cursorTop, cursorHeight;
        
        if (found) {
          // Calculate the system height in pixels
          const heightInUnits = systemBottomY - systemTopY;
          cursorHeight = heightInUnits * 10 * osmd.zoom;
          
          // Simply use the original cursor position and extend downward
          // This keeps the cursor aligned with where OSMD thinks it should be horizontally
          cursorTop = originalTop;
          
          console.log("📍 Simple positioning:", {
            originalTop: Math.round(originalTop),
            systemHeightUnits: heightInUnits,
            cursorHeight: Math.round(cursorHeight),
            zoom: osmd.zoom
          });
          
        } else {
          // Fallback to default sizing
          cursorTop = originalTop;
          cursorHeight = 100;
        }

        custom.style.left = `${Math.round(left - 8)}px`;
        custom.style.top = `${Math.round(cursorTop)}px`;
        custom.style.height = `${Math.round(cursorHeight)}px`;
        custom.style.width = `${cursorWidth}px`;
        custom.style.display = "block";

      } catch (e) {
        console.warn("Error in cursor update:", e);
      }
    };

  } catch (e) {
    console.warn("replaceOsmdCursor failed", e);
  }
}