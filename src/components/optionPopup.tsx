import { useState } from "react";
import Image from "next/image";
import * as Slider from "@radix-ui/react-slider";
import React from "react";

interface OptionSettingsData {
  start_measure: number;
  end_measure: number;
  start_beat: number;
  end_beat: number;
}

interface SoundOptionsData {
  Measure: [string, number];
  Background_Music: [string, number];
  Countoff: [string, number];
  Instrument: [string, number];
}

type OptionPopupProps = {
  openDialogue: boolean;
  setOpenDialogue: React.Dispatch<React.SetStateAction<boolean>>;
  backgroundVolume: number;
  setBackgroundVolume?: React.Dispatch<React.SetStateAction<number>>;
  metronomeVolume: number;
  setMetronomeVolume?: React.Dispatch<React.SetStateAction<number>>; 
};

export default function OptionPopup({ openDialogue, setOpenDialogue,backgroundVolume,setBackgroundVolume,metronomeVolume,setMetronomeVolume }: OptionPopupProps) {
  const defaultSoundSettings: SoundOptionsData = {
    Measure: ["assets/metro.svg", metronomeVolume ],
    Instrument: ["assets/colored.svg", 100],
    Countoff: ["assets/Vector (2).svg", 100],
    Background_Music: ["assets/Vector (3).svg", backgroundVolume],
  };

  const defaultOptionSettings: OptionSettingsData = {
    start_measure: 1,
    end_measure: 4,
    start_beat: 1,
    end_beat: 4,
  };

  const [optionSettings, setOptionSettings] = useState(defaultOptionSettings);
  const [soundSettings, setSoundSettings] = useState(defaultSoundSettings);

  const updateValue = (field: keyof OptionSettingsData, change: number) => {
    setOptionSettings((prev) => ({
      ...prev,
      [field]: Math.max(0, prev[field] + change),
    }));
  };

  const handleChange = (
    field: keyof SoundOptionsData,
    change: number,
    imageUrl: string
  ) => {
    setSoundSettings((prev) => ({
      ...prev,
      [field]: [imageUrl, change],
    }));
    switch (field) {
    case "Measure":
      setMetronomeVolume?.(change);
      break;
    case "Background_Music":
      setBackgroundVolume?.(change);
      break;
    // case "Countoff":
    //   // if you plan to control count-in volume separately
    //   setCountoffVolume?.(change);
    //   break;
    // case "Accompaniment":
    //   setAccompanimentVolume?.(change);
    //   break;
    default:
      break;
  }
  };

  const resetSettings = () => {
    setOptionSettings(defaultOptionSettings);
  };

  // Pair optionSettings and soundSettings by index
  const pairedSettings = Object.entries(optionSettings).map(
    ([optKey, optValue], index) => {
      const [soundKey, soundData] =
        Object.entries(soundSettings)[index] || [];
      return {
        optKey,
        optValue,
        soundKey,
        soundData,
      };
    }
  );

  return (
<div
    className="fixed inset-0 bg-[#5e5c5c82] flex items-center justify-center p-1 z-55"
    onClick={() => setOpenDialogue(!openDialogue)} // close only when clicking overlay
  >
    <div
      className="bg-gradient-to-r from-[rgba(255,255,255,0.9)] via-[#D8D8D8] to-[#FFFFFF80] max-w-[50%] rounded-2xl p-1 flex"
      onClick={(e) => e.stopPropagation()} // prevent overlay close when clicking inside
    >
        <div className="w-full rounded-2xl p-4 bg-[#D1D1D1]">
          <div className="bg-gradient-to-r from-[#FDFDFD] to-[#E5E5E5] w-full rounded-2xl p-6">
            {/* Grid layout for perfect row alignment */}
            <h2 className="w-full text-center text-black font-bold text-xl mb-6">
              Practice Selection
            </h2>
            <div className="grid grid-cols-2 gap-6">
              {pairedSettings.map(
                ({ optKey, optValue, soundKey, soundData }) => (
                  <React.Fragment key={optKey}>
                    {/* Left cell */}
                    <div className="flex flex-col justify-between bg-gradient-to-r from-[#F2F2F2] to-[#EAEAEA] rounded-2xl p-4">
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="capitalize text-xl text-black max-w-[60%]">
                          {optKey.replace("_", " ")}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            className="p-3 bg-[#F8C8C3] rounded-full text-xl flex items-center justify-center"
                            onClick={() =>
                              updateValue(optKey as keyof OptionSettingsData, -1)
                            }
                          >
                            <Image
                              src="/assets/minus.svg"
                              alt="Minus"
                              width={15}
                              height={15}
                            />
                          </button>
                          <span className="w-8 text-center font-medium text-black">
                            {optValue}
                          </span>
                          <button
                            className="p-3 bg-[#2ECC71] rounded-full text-xl"
                            onClick={() =>
                              updateValue(optKey as keyof OptionSettingsData, 1)
                            }
                          >
                            <Image
                              src="/assets/plus.svg"
                              alt="Plus"
                              width={15}
                              height={15}
                            />
                          </button>
                        </div>
                      </div>
                      {/* Show reset button in last left cell */}
                      {optKey === "end_beat" && (
                        <button
                          onClick={resetSettings}
                          className="mt-4 bg-[#D4AF37] w-full p-4 rounded-2xl flex gap-2 primary-color-text items-center justify-center text-[16px] cursor-pointer"
                        >
                          <Image
                            src="/assets/repeat.svg"
                            width={20}
                            height={20}
                            alt="icon"
                          />
                          Reset Measures
                        </button>
                      )}
                    </div>
                    

                    {/* Right cell */}
                    {soundData && (
                      <div className="bg-gradient-to-r from-[#FFFFFFE5] via-[#D8D8D8] to-[#D8D8D8] rounded-2xl p-4 flex flex-col justify-between">
                        <div className="flex gap-3 items-center mb-3">
                          <Image
                            src={soundData[0]}
                            alt={soundKey}
                            width={25}
                            height={25}
                          />
                          <span className="text-black font-bold">
                            {soundKey}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Image
                            src="assets/volume.svg"
                            alt="volume"
                            width={30}
                            height={30}
                          />
                          <Slider.Root
                            className="relative flex items-center select-none w-[300px] h-4"
                            min={0}
                            max={100}
                            step={1}
                            value={[soundData[1]]}
                            onValueChange={([v]) =>
                              handleChange(
                                soundKey as keyof SoundOptionsData,
                                v,
                                soundData[0]
                              )
                            }
                          >
                            <Slider.Track className="bg-white relative grow rounded-full h-4">
                              <Slider.Range className="absolute bg-[#581845] h-full rounded-full" />
                              {[0, 1, 2, 3].map((pos, i) => (
                                <div
                                  key={i}
                                  className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ml-2 ${
                                    soundData[1] <= (pos / 4) * 100
                                      ? "bg-[#581845]"
                                      : "bg-white"
                                  }`}
                                  style={{
                                    left: `${(pos / 4) * 100}%`,
                                  }}
                                />
                              ))}
                            </Slider.Track>
                            <Slider.Thumb className="block w-6 h-6 bg-[#581845] border-3 border-white rounded-full shadow-md z-99" />
                          </Slider.Root>
                          <span className="text-black font-bold w-[20%] ml-4">
                            {soundData[1]}
                          </span>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
