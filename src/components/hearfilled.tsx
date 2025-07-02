import { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";

type HeartIconProps = {
  isLiked: boolean;
};

export default function HeartIcon({ isLiked }: HeartIconProps) {
  const controls = useAnimation();

  useEffect(() => {
    if (isLiked) {
      controls.start({
        rotate: [0, 360, 360, 360], // Rotate first, then hold
        scale: [1, 1, 0.2, 1], // Hold scale, then scale down, then back to original
        transition: {
          duration: 1, // Total duration
          times: [0, 0.33, 0.66, 1], // Keyframes: 0 (start), 0.33 (end of rotation), 0.66 (scale down), 1 (scale back)
          ease: ["easeInOut", "easeIn", "easeOut"], // Smooth rotation, sharp scale down, smooth scale up
        },
      });
    } else {
      controls.set({ rotate: 0, scale: 1, y: 0 });
    }
  }, [controls, isLiked]);

  return (
    <motion.img
      src={isLiked ? "/hearfilled.png" : "/HeartStart.png"}
      alt="Heart Icon"
      className="w-5 h-5 cursor-pointer"
      initial={{ rotate: 0, scale: 1, y: 0 }}
      animate={controls}
    />
  );
}
