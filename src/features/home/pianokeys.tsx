"use client";

const WHITE_KEYS = 22;

// Black key positions relative to white key index (0-based)
// Standard piano pattern: after keys 0,1, 3,4,5, 7,8, 10,11,12, 14,15, 17,18,19, 21 (skip)
const BLACK_KEY_POSITIONS = [0, 1, 3, 4, 5, 7, 8, 10, 11, 12, 14, 15, 17, 18, 19];

export default function PianoKeys() {
  return (
    <section className="bg-[#F5F2ED] px-6 pt-6 pb-0">
      <div className="max-w-5xl mx-auto border border-[#C9A84C]/30 rounded-t-lg overflow-hidden">
        <div className="relative flex" style={{ height: "160px" }}>
          {/* White keys */}
          {Array.from({ length: WHITE_KEYS }).map((_, i) => (
            <div
              key={`white-${i}`}
              className="flex-1 bg-white border-r border-[#D5D0C8] last:border-r-0 rounded-b-sm cursor-pointer hover:bg-[#F0EDE8] active:bg-[#E8E4DF] transition-colors duration-75"
              style={{ height: "100%" }}
            />
          ))}

          {/* Black keys overlay */}
          <div className="absolute inset-0 pointer-events-none flex">
            {Array.from({ length: WHITE_KEYS }).map((_, i) => {
              const hasBlackKey = BLACK_KEY_POSITIONS.includes(i % 7 === 6 ? -1 : i);
              // Use musical pattern per octave: positions 0,1,3,4,5 of 7 have black keys after
              const pattern = [true, true, false, true, true, true, false];
              const posInOctave = i % 7;
              const showBlack = pattern[posInOctave];

              return showBlack ? (
                <div
                  key={`black-${i}`}
                  className="relative pointer-events-auto"
                  style={{ flex: 1 }}
                >
                  <div
                    className="absolute bg-[#888580] rounded-b-sm cursor-pointer hover:bg-[#777470] active:bg-[#666360] transition-colors duration-75 z-10"
                    style={{
                      width: "60%",
                      height: "60%",
                      right: "-30%",
                      top: 0,
                    }}
                  />
                </div>
              ) : (
                <div key={`gap-${i}`} style={{ flex: 1 }} />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
