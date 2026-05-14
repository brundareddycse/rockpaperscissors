import {
  motion,
  AnimatePresence,
} from "framer-motion";

export default function CountdownOverlay({
  value,
}) {
  const isShoot = value === "SHOOT!";

  return (
    <AnimatePresence mode="wait">
      {value !== null && (
        <motion.div
          key={String(value)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm"
        >
          <motion.div
            initial={{
              scale: 0.4,
              opacity: 0,
            }}
            animate={
              isShoot
                ? {
                    scale: [1, 1.1, 1],
                    opacity: 1,
                  }
                : {
                    scale: 1,
                    opacity: 1,
                  }
            }
            exit={{
              scale: 1.6,
              opacity: 0,
            }}
            className="font-display uppercase text-[#FFD700] text-[28vw]"
          >
            {value}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
