import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  CameraSlash,
  ArrowsClockwise,
  Play,
  Robot,
  HandWaving,
} from "@phosphor-icons/react";

import {
  loadGestureRecognizer,
  detectGestureFromVideo,
} from "../lib/handGesture";

import { createSmartAI, judge } from "../lib/smartAI";
import { sfx } from "../lib/sounds";

import { GestureIcon, gestureLabel } from "./GestureIcon";
import CountdownOverlay from "./CountdownOverlay";
import MatchResultModal from "./MatchResultModal";

const ARCADE_BG =
  "https://static.prod-images.emergentagent.com/jobs/1752c84b-24b9-480f-a948-5f6476a33e45/images/fbb8ea12f538f154f4deb6a1af8bb0ae256523ec299a13cf359d658f6c4807f4.png";

const BEST_OF = 5;
const WIN_THRESHOLD = Math.ceil(BEST_OF / 2);

export default function Game() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognizerRef = useRef(null);
  const lastDetectionRef = useRef(null);
  const rafRef = useRef(null);
  const aiRef = useRef(createSmartAI());

  const [camReady, setCamReady] = useState(false);
  const [camError, setCamError] = useState(null);

  const [modelReady, setModelReady] = useState(false);
  const [modelError, setModelError] = useState(null);

  const [liveGesture, setLiveGesture] = useState(null);

  const [gameState, setGameState] = useState("idle");
  const [countdown, setCountdown] = useState(null);

  const [playerMove, setPlayerMove] = useState(null);
  const [aiMove, setAiMove] = useState(null);

  const [roundResult, setRoundResult] = useState(null);

  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);

  const [matchOpen, setMatchOpen] = useState(false);
  const [matchDidWin, setMatchDidWin] = useState(false);

  useEffect(() => {
    let mounted = true;

    loadGestureRecognizer()
      .then((r) => {
        if (!mounted) return;

        recognizerRef.current = r;
        setModelReady(true);
      })
      .catch((e) => {
        console.error(e);

        if (mounted) {
          setModelError(
            e.message || "Failed to load model"
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const startCamera = useCallback(async () => {
    setCamError(null);

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            facingMode: "user",
          },
          audio: false,
        });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCamReady(true);
    } catch (e) {
      console.error(e);

      setCamError(
        e.name === "NotAllowedError"
          ? "Camera permission denied."
          : e.message || "Could not access camera."
      );
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((t) => t.stop());

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCamReady(false);
    setLiveGesture(null);
  }, []);
    useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  useEffect(() => {
    if (!camReady || !modelReady) return;

    let running = true;

    const tick = () => {
      if (!running) return;

      const recognizer = recognizerRef.current;
      const video = videoRef.current;

      if (
        recognizer &&
        video &&
        video.readyState >= 2
      ) {
        const det = detectGestureFromVideo(
          recognizer,
          video,
          performance.now()
        );

        if (det) {
          lastDetectionRef.current = det;
          setLiveGesture(det.move);
        } else {
          lastDetectionRef.current = null;
          setLiveGesture(null);
        }
      }

      rafRef.current =
        requestAnimationFrame(tick);
    };

    rafRef.current =
      requestAnimationFrame(tick);

    return () => {
      running = false;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [camReady, modelReady]);

  const playRound = useCallback(async () => {
    if (!camReady || !modelReady) return;

    if (
      gameState !== "idle" &&
      gameState !== "round_done"
    ) {
      return;
    }

    setPlayerMove(null);
    setAiMove(null);
    setRoundResult(null);

    setGameState("countdown");

    const seq = [3, 2, 1, "SHOOT!"];

    for (const v of seq) {
      setCountdown(v);

      if (v === "SHOOT!") {
        sfx.shoot();
      } else {
        sfx.tick();
      }

      await new Promise((res) =>
        setTimeout(
          res,
          v === "SHOOT!" ? 450 : 700
        )
      );
    }

   setTimeout(() => {
  setCountdown(null);
}, 50);

    const captured =
      lastDetectionRef.current?.move || null;

    const pMove = captured;

    const aMove = aiRef.current.predict();

    setGameState("reveal");

    setAiMove(aMove);
    setPlayerMove(pMove);

    let result;

    if (!pMove) {
      result = "no_detect";
    } else {
      result = judge(pMove, aMove);
      aiRef.current.record(pMove);
    }

    await new Promise((res) =>
      setTimeout(res, 500)
    );

    setRoundResult(result);

    let newPlayer = playerScore;
    let newAi = aiScore;

    if (result === "win") {
      newPlayer += 1;
      setPlayerScore(newPlayer);
      sfx.win();
    } else if (result === "lose") {
      newAi += 1;
      setAiScore(newAi);
      sfx.lose();
    } else {
      sfx.tie();
    }

    if (
      newPlayer >= WIN_THRESHOLD ||
      newAi >= WIN_THRESHOLD
    ) {
      setGameState("match_done");

      setMatchDidWin(newPlayer > newAi);

      setTimeout(() => {
        setMatchOpen(true);
      }, 700);
    } else {
  setTimeout(() => {
    setGameState("round_done");
  }, 300);
}
  }, [
    camReady,
    modelReady,
    gameState,
    playerScore,
    aiScore,
  ]);

  const resetMatch = useCallback(() => {
    setPlayerScore(0);
    setAiScore(0);

    setPlayerMove(null);
    setAiMove(null);

    setRoundResult(null);

    setMatchOpen(false);

    setGameState("idle");

    aiRef.current.reset();
  }, []);

  const inProgress =
    gameState === "countdown" ||
    gameState === "reveal";
    return (
    <div
      className="min-h-screen w-full flex flex-col items-center p-4 md:p-8 font-body relative"
      style={{
        backgroundColor: "#FDF6E3",
        backgroundImage: `linear-gradient(rgba(253,246,227,0.65), rgba(253,246,227,0.65)), url(${ARCADE_BG})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="w-full max-w-5xl flex items-center justify-between mb-4 mt-1">
        <h1
          className="font-display text-3xl sm:text-5xl tracking-tight uppercase text-[#0F172A]"
          style={{ textShadow: "3px 3px 0 #FFD700" }}
        >
          <span className="text-[#FF2A5F]">
            Rock
          </span>{" "}
          Paper{" "}
          <span className="text-[#00B8D4]">
            Scissors
          </span>
        </h1>

        <div className="hidden sm:flex items-center gap-2 bg-white border-4 border-[#0F172A] rounded-full px-4 py-2 shadow-[4px_4px_0px_#0F172A]">
          <HandWaving
            size={22}
            weight="duotone"
            color="#FF2A5F"
          />

          <span className="font-heading font-bold text-[#0F172A]">
            AI Vision Arcade
          </span>
        </div>
      </div>

      <div className="bg-white border-4 border-[#0F172A] rounded-full px-5 sm:px-6 py-3 flex items-center justify-between w-full max-w-2xl mx-auto shadow-[4px_4px_0px_#0F172A] z-30 relative">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="rounded-full bg-[#00E5FF] border-4 border-[#0F172A] w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center font-heading font-bold text-[#0F172A]">
            YOU
          </div>

          <span className="font-display text-3xl sm:text-4xl text-[#00B8D4]">
            {playerScore}
          </span>
        </div>

        <div className="bg-[#FFD700] border-4 border-[#0F172A] rounded-full px-3 sm:px-5 py-1 font-heading text-xs sm:text-base text-[#0F172A] font-extrabold uppercase tracking-wide">
          Best of {BEST_OF}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-display text-3xl sm:text-4xl text-[#FF2A5F]">
            {aiScore}
          </span>

          <div className="rounded-full bg-[#FF2A5F] border-4 border-[#0F172A] w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center font-heading font-bold text-white">
            AI
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full max-w-5xl mx-auto my-4 md:my-6 flex-grow">

        <motion.div
          className="bg-[#00E5FF] rounded-3xl border-4 border-[#0F172A] p-2 relative overflow-hidden aspect-[4/3] flex flex-col shadow-[8px_8px_0px_#0F172A]"
        >
          <div className="absolute top-2 left-3 z-20 bg-white border-2 border-[#0F172A] rounded-full px-3 py-1 font-heading text-xs sm:text-sm font-bold text-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
  YOU
</div>
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover rounded-2xl"
            style={{ transform: "scaleX(-1)" }}
          />

          {!camReady && (
            <div className="absolute inset-2 flex flex-col items-center justify-center bg-white/85 rounded-2xl text-center p-4 z-10">

              <Camera
                size={60}
                weight="duotone"
                color="#0F172A"
              />

              <p className="font-heading text-base sm:text-lg mt-2 text-[#0F172A] max-w-xs">
                Allow camera access to play.
              </p>

              <button
                onClick={startCamera}
                className="mt-4 bg-[#39FF14] text-[#0F172A] font-heading text-base sm:text-lg px-6 py-3 rounded-xl border-4 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]"
              >
                Enable Camera
              </button>
            </div>
          )}

          {camReady && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-white border-4 border-[#0F172A] rounded-full px-5 py-2 font-heading text-sm sm:text-lg shadow-[3px_3px_0px_#0F172A] flex items-center gap-2">

              {liveGesture ? (
                <>
                  <GestureIcon
                    move={liveGesture}
                    size={22}
                    color="#0F172A"
                  />

                  <span className="text-[#0F172A] font-bold uppercase">
                    {gestureLabel(liveGesture)}
                  </span>
                </>
              ) : (
                <span className="text-[#0F172A]/60 font-bold uppercase">
                  Show your hand
                </span>
              )}
            </div>
          )}
        </motion.div>
                <motion.div
          className="bg-[#FF2A5F] rounded-3xl border-4 border-[#0F172A] p-2 relative overflow-hidden aspect-[4/3] flex items-center justify-center shadow-[8px_8px_0px_#0F172A]"
        >
          <div className="absolute top-2 left-3 z-20 bg-white border-2 border-[#0F172A] rounded-full px-3 py-1 font-heading text-xs sm:text-sm font-bold text-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
            AI
          </div>

          {gameState === "countdown" ||
          gameState === "reveal" ? (
            aiMove &&
            gameState === "reveal" ? (
              <motion.div
                key={aiMove}
                initial={{
                  scale: 0.2,
                  rotate: -30,
                  opacity: 0,
                }}
                animate={{
                  scale: 1,
                  rotate: 0,
                  opacity: 1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 220,
                  damping: 14,
                }}
                className="bg-white border-4 border-[#0F172A] rounded-full w-40 h-40 sm:w-56 sm:h-56 flex items-center justify-center shadow-[6px_6px_0px_#0F172A]"
              >
                <GestureIcon
                  move={aiMove}
                  size={110}
                  color="#0F172A"
                />
              </motion.div>
            ) : (
              <div className="flex flex-col items-center text-white">
                <Robot
                  size={90}
                  weight="duotone"
                  color="#FFFFFF"
                />

                <div className="font-heading text-2xl mt-2 flex gap-1">
                  <motion.span
                    animate={{
                      opacity: [0.2, 1, 0.2],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                    }}
                  >
                    .
                  </motion.span>

                  <motion.span
                    animate={{
                      opacity: [0.2, 1, 0.2],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: 0.2,
                    }}
                  >
                    .
                  </motion.span>

                  <motion.span
                    animate={{
                      opacity: [0.2, 1, 0.2],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: 0.4,
                    }}
                  >
                    .
                  </motion.span>
                </div>
              </div>
            )
          ) : aiMove ? (
            <div className="bg-white border-4 border-[#0F172A] rounded-full w-40 h-40 sm:w-56 sm:h-56 flex items-center justify-center shadow-[6px_6px_0px_#0F172A]">
              <GestureIcon
                move={aiMove}
                size={110}
                color="#0F172A"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center text-white">
              <Robot
                size={90}
                weight="duotone"
                color="#FFFFFF"
              />

              <p className="font-heading text-xl sm:text-2xl mt-2 uppercase tracking-wide">
                Ready when you are
              </p>
            </div>
          )}
        </motion.div>
      </div>

      <div className="min-h-[44px] mb-3">
        <AnimatePresence mode="wait">
          {roundResult && (
            <motion.div
              key={roundResult}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="font-display text-2xl sm:text-4xl uppercase tracking-tight"
              style={{
                color:
                  roundResult === "win"
                    ? "#0AAA1F"
                    : roundResult === "lose"
                    ? "#FF2A5F"
                    : "#0F172A",
                textShadow: "2px 2px 0 #FFD700",
              }}
            >
              {roundResult === "win" &&
                "You took the round!"}

              {roundResult === "lose" &&
                "AI scored that one!"}

              {roundResult === "tie" &&
                "It's a tie!"}

              {roundResult === "no_detect" &&
                "No hand detected"}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-6">
        <button
          onClick={playRound}
         disabled={
  !camReady ||
  !modelReady ||
  gameState === "countdown"
}
          className="bg-[#39FF14] text-[#0F172A] font-heading text-xl sm:text-2xl px-8 sm:px-12 py-4 sm:py-5 rounded-2xl border-4 border-[#0F172A] shadow-[6px_6px_0px_#0F172A] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none hover:bg-[#2DE010] transition-all uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Play size={26} weight="fill" />

          {gameState === "idle" &&
          playerScore === 0 &&
          aiScore === 0
            ? "Start Game"
            : "Play Round"}
        </button>

        <button
          onClick={resetMatch}
          className="bg-white text-[#0F172A] font-heading text-base sm:text-xl px-6 py-4 rounded-2xl border-4 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none hover:bg-gray-100 transition-all uppercase tracking-wide flex items-center gap-2"
        >
          <ArrowsClockwise
            size={22}
            weight="bold"
          />

          Reset
        </button>

        {camReady ? (
          <button
            onClick={stopCamera}
            className="bg-[#0F172A] text-white font-heading text-base px-5 py-4 rounded-2xl border-4 border-[#0F172A] shadow-[4px_4px_0px_#FF2A5F] hover:opacity-90 transition-all uppercase tracking-wide flex items-center gap-2"
          >
            <CameraSlash
              size={20}
              weight="bold"
            />

            Cam Off
          </button>
        ) : null}
      </div>

      <div className="text-center mb-4 max-w-xl mx-auto">
        {!modelReady && !modelError && (
          <p className="font-heading text-[#0F172A]/70 text-sm">
            Loading hand-tracking AI...
          </p>
        )}

        {modelError && (
          <p className="font-heading text-[#FF2A5F] text-sm font-bold">
            Model load error: {modelError}
          </p>
        )}

        {modelReady &&
          camReady &&
          gameState === "idle" && (
            <p className="font-heading text-[#0F172A]/80 text-sm sm:text-base">
              Show <b>fist</b> for Rock,
              <b> open palm</b> for Paper,
              or <b> peace sign</b> for
              Scissors.
            </p>
          )}
      </div>

      <CountdownOverlay
        value={countdown}
      />

      <MatchResultModal
        open={matchOpen}
        didWin={matchDidWin}
        playerScore={playerScore}
        aiScore={aiScore}
        onPlayAgain={resetMatch}
        onClose={() =>
          setMatchOpen(false)
        }
      />
    </div>
  );
}
