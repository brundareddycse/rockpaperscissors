import { motion, AnimatePresence } from "framer-motion";
import { Trophy, X } from "@phosphor-icons/react";

const VICTORY_BG =
  "https://static.prod-images.emergentagent.com/jobs/1752c84b-24b9-480f-a948-5f6476a33e45/images/0b7e69f3043c1f2a1621bb224f64a48fed441ee40978c8c94d3ca81b2e495d16.png";

export default function MatchResultModal({
  open,
  didWin,
  playerScore,
  aiScore,
  onPlayAgain,
  onClose,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          data-testid="match-result-modal"
        >
          <motion.div
            initial={{ scale: 0.7, y: 40, rotate: -2 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className="bg-white w-full max-w-xl rounded-3xl border-4 border-[#0F172A] shadow-[12px_12px_0px_#0F172A] overflow-hidden relative"
          >
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40 pointer-events-none"
              style={{ backgroundImage: `url(${VICTORY_BG})` }}
            />

            <button
              onClick={onClose}
              data-testid="close-modal-button"
              className="absolute top-3 right-3 z-20 bg-white border-4 border-[#0F172A] rounded-full p-2 shadow-[3px_3px_0px_#0F172A] hover:bg-gray-100 transition"
              aria-label="Close"
            >
              <X size={20} weight="bold" color="#0F172A" />
            </button>

            <div className="relative z-10 flex flex-col items-center p-10 sm:p-12 text-center">
              <Trophy
                size={72}
                weight="duotone"
                color={didWin ? "#FFD700" : "#FF2A5F"}
              />

              <h2
                style={{ textShadow: "4px 4px 0 #0F172A" }}
                className="font-display text-5xl sm:text-7xl mt-3 uppercase"
                data-testid="match-result-title"
              >
                <span style={{ color: didWin ? "#39FF14" : "#FF2A5F" }}>
                  {didWin ? "You Win!" : "AI Wins!"}
                </span>
              </h2>

              <p
                className="font-heading text-xl sm:text-2xl mt-4 text-[#0F172A]"
                data-testid="match-result-score"
              >
                Final Score:
                <span className="text-[#00B8D4] font-bold">
                  {" "}
                  {playerScore}
                </span>
                –
                <span className="text-[#FF2A5F] font-bold">
                  {" "}
                  {aiScore}
                </span>
              </p>

              <button
                onClick={onPlayAgain}
                data-testid="play-again-button"
                className="mt-8 bg-[#39FF14] text-[#0F172A] font-heading text-2xl px-10 py-5 rounded-2xl border-4 border-[#0F172A] shadow-[6px_6px_0px_#0F172A] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none hover:bg-[#2DE010] transition-all uppercase tracking-wide"
              >
                Play Again
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
