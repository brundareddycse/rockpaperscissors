import {
  GestureRecognizer,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

let recognizerPromise = null;

export const GESTURE_MAP = {
  Closed_Fist: "rock",
  Open_Palm: "paper",
  Victory: "scissors",
};

export async function loadGestureRecognizer() {
  if (recognizerPromise)
    return recognizerPromise;

  recognizerPromise = (async () => {
    const vision =
      await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
      );

    return GestureRecognizer.createFromOptions(
      vision,
      {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
          delegate: "GPU",
        },

        runningMode: "VIDEO",
        numHands: 1,
      }
    );
  })();

  return recognizerPromise;
}

export function detectGestureFromVideo(
  recognizer,
  videoEl,
  timestamp
) {
  if (
    !recognizer ||
    !videoEl ||
    videoEl.readyState < 2
  ) {
    return null;
  }

  try {
    const result =
      recognizer.recognizeForVideo(
        videoEl,
        timestamp
      );

    if (
      result?.gestures?.length &&
      result.gestures[0].length
    ) {
      const top = result.gestures[0][0];

      const move =
        GESTURE_MAP[top.categoryName] || null;

      return {
        raw: top.categoryName,
        move,
        score: top.score,
      };
    }
  } catch (e) {}

  return null;
}
