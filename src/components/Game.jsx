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
