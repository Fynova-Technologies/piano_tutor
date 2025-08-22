import { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";

type HeartIconProps = {
  isLiked: boolean;
};

export default function PopupHeartIcon({ isLiked }: HeartIconProps) {
  const controls = useAnimation();
  const [displayFilledHeart, setDisplayFilledHeart] = useState(isLiked);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isLiked) {
      // Reset to unfilled first if needed
      setDisplayFilledHeart(false);

      controls.start({
        rotate: [0, 360, 360, 360],
        scale: [1, 1, 0.2, 1],
        transition: {
          duration: 1,
          times: [0, 0.33, 0.66, 1],
          ease: ["easeInOut", "easeIn", "easeOut"],
        },
      });

      // Change image during the scale down phase (e.g., at 350ms)
      timeout = setTimeout(() => {
        setDisplayFilledHeart(true);
      }, 700);
    } else {
      controls.set({ rotate: 0, scale: 1, y: 0 });
      setDisplayFilledHeart(false);
    }

    return () => {
      clearTimeout(timeout); // Clear timeout if component unmounts or re-renders
    };
  }, [controls, isLiked]);

  return (
    <motion.img
      src={displayFilledHeart ? "/hearfilled.png" : "/Heart.svg"}
      alt="Heart Icon"
      className="w-7 h-6 cursor-pointer"
      initial={{ rotate: 0, scale: 1, y: 0 }}
      animate={controls}
    />
  );
}
