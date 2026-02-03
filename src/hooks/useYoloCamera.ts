import { useState, useRef, useCallback, useEffect } from "react";
import { pipeline, env } from "@huggingface/transformers";
import { useToast } from "@/hooks/use-toast";

// Configure transformers.js
env.allowLocalModels = false;

interface Detection {
  label: string;
  score: number;
  box: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
}

interface UseYoloCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isModelLoading: boolean;
  isStreaming: boolean;
  detections: Detection[];
  modelProgress: number;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  captureImage: () => Promise<string | null>;
}

export const useYoloCamera = (): UseYoloCameraReturn => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);
  const animationRef = useRef<number>(0);

  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [modelProgress, setModelProgress] = useState(0);

  const { toast } = useToast();

  // Load the object detection model
  const loadModel = useCallback(async () => {
    if (detectorRef.current) return;

    setIsModelLoading(true);
    setModelProgress(0);

    try {
      // Using a YOLO-based model for object detection
      // Xenova/yolos-tiny is a YOLO-like model that works well in browser
      detectorRef.current = await pipeline(
        "object-detection",
        "Xenova/yolos-tiny",
        {
          progress_callback: (progress: any) => {
            if (progress.status === "progress") {
              setModelProgress(Math.round(progress.progress));
            }
          },
        }
      );

      toast({
        title: "Modelo carregado!",
        description: "Detecção de objetos pronta.",
      });
    } catch (error) {
      console.error("Error loading model:", error);
      toast({
        title: "Erro ao carregar modelo",
        description: "Não foi possível carregar o modelo de detecção.",
        variant: "destructive",
      });
    } finally {
      setIsModelLoading(false);
      setModelProgress(100);
    }
  }, [toast]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsStreaming(true);

      // Load model if not loaded
      await loadModel();

      // Start detection loop
      detectLoop();
    } catch (error) {
      console.error("Camera error:", error);
      toast({
        title: "Erro na câmera",
        description: "Não foi possível acessar a câmera.",
        variant: "destructive",
      });
    }
  }, [loadModel, toast]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setIsStreaming(false);
    setDetections([]);
  }, []);

  // Detection loop
  const detectLoop = useCallback(async () => {
    if (!videoRef.current || !detectorRef.current || !isStreaming) return;

    const video = videoRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      try {
        // Create a canvas to capture the current frame
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        const ctx = tempCanvas.getContext("2d");

        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const imageData = tempCanvas.toDataURL("image/jpeg", 0.8);

          // Run detection
          const results = await detectorRef.current(imageData, {
            threshold: 0.5,
            percentage: true,
          });

          // Transform results to our format
          const newDetections: Detection[] = results.map((result: any) => ({
            label: result.label,
            score: result.score,
            box: {
              xmin: result.box.xmin * video.videoWidth,
              ymin: result.box.ymin * video.videoHeight,
              xmax: result.box.xmax * video.videoWidth,
              ymax: result.box.ymax * video.videoHeight,
            },
          }));

          setDetections(newDetections);

          // Draw detections on canvas
          drawDetections(newDetections);
        }
      } catch (error) {
        console.error("Detection error:", error);
      }
    }

    // Continue detection loop (throttled to ~5fps for performance)
    animationRef.current = requestAnimationFrame(() => {
      setTimeout(detectLoop, 200);
    });
  }, [isStreaming]);

  // Draw detections on canvas
  const drawDetections = useCallback((dets: Detection[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Match canvas size to video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each detection
    dets.forEach((det) => {
      const { xmin, ymin, xmax, ymax } = det.box;
      const width = xmax - xmin;
      const height = ymax - ymin;

      // Draw bounding box
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 3;
      ctx.strokeRect(xmin, ymin, width, height);

      // Draw label background
      const label = `${det.label} ${(det.score * 100).toFixed(0)}%`;
      ctx.font = "16px sans-serif";
      const textWidth = ctx.measureText(label).width;

      ctx.fillStyle = "#10b981";
      ctx.fillRect(xmin, ymin - 24, textWidth + 10, 24);

      // Draw label text
      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, xmin + 5, ymin - 6);
    });
  }, []);

  // Capture current frame
  const captureImage = useCallback(async (): Promise<string | null> => {
    const video = videoRef.current;
    if (!video) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.9);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Restart detection loop when streaming changes
  useEffect(() => {
    if (isStreaming && detectorRef.current) {
      detectLoop();
    }
  }, [isStreaming, detectLoop]);

  return {
    videoRef,
    canvasRef,
    isModelLoading,
    isStreaming,
    detections,
    modelProgress,
    startCamera,
    stopCamera,
    captureImage,
  };
};
