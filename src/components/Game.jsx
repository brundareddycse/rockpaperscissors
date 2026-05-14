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

    setCountdown(null);

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
      setGameState("round_done");
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
    </div>
  );
}
