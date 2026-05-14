import { motion, AnimatePresence } from "framer-motion";

export default function CountdownOverlay({ value }) {
  const isShoot = value === "SHOOT!";

  return (
    <AnimatePresence mode="wait">
      {value !== null && value !== undefined && (
        <motion.div
          key={String(value)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 pointer-events-none flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm"
          data-testid="countdown-overlay"
        >
          <motion.div
            key={String(value) + "-text"}
            initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
            animate={
              isShoot
                ? { scale: [1, 1.1, 1], rotate: [-2, 2, -2, 0], opacity: 1 }
                : { scale: 1, opacity: 1, rotate: 0 }
            }
            exit={{ scale: 1.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 14 }}
            style={{
              WebkitTextStroke: "4px #0F172A",
              textShadow: "10px 10px 0 #0F172A",
            }}
            className="font-display select-none uppercase tracking-tight text-[#FFD700] text-[28vw] md:text-[18vw] leading-none"
            data-testid="countdown-value"
          >
            {value}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
