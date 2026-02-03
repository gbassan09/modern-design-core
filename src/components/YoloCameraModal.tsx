import { useEffect } from "react";
import { X, Camera, Loader2, ScanLine, Focus } from "lucide-react";
import { useYoloCamera } from "@/hooks/useYoloCamera";

interface YoloCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageBase64: string) => void;
}

const YoloCameraModal = ({ isOpen, onClose, onCapture }: YoloCameraModalProps) => {
  const {
    videoRef,
    canvasRef,
    isModelLoading,
    isStreaming,
    detections,
    modelProgress,
    startCamera,
    stopCamera,
    captureImage,
  } = useYoloCamera();

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isOpen, startCamera, stopCamera]);

  const handleCapture = async () => {
    const image = await captureImage();
    if (image) {
      onCapture(image);
      onClose();
    }
  };

  if (!isOpen) return null;

  // Check if we detected something that looks like a document/receipt
  const hasDocumentDetection = detections.some(
    (d) =>
      d.label.toLowerCase().includes("book") ||
      d.label.toLowerCase().includes("paper") ||
      d.label.toLowerCase().includes("document") ||
      d.label.toLowerCase().includes("card") ||
      d.score > 0.7
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Camera View */}
      <div className="relative w-full max-w-lg aspect-[3/4]">
        {/* Video Element */}
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover rounded-2xl"
          playsInline
          muted
        />

        {/* Detection Overlay Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-cover rounded-2xl pointer-events-none"
        />

        {/* Scanning Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-[80%] h-[60%] border-2 border-dashed border-white/30 rounded-xl">
            {/* Corner Indicators */}
            <div className="absolute -left-1 -top-1 w-8 h-8 border-l-4 border-t-4 border-primary rounded-tl-lg" />
            <div className="absolute -right-1 -top-1 w-8 h-8 border-r-4 border-t-4 border-primary rounded-tr-lg" />
            <div className="absolute -left-1 -bottom-1 w-8 h-8 border-l-4 border-b-4 border-primary rounded-bl-lg" />
            <div className="absolute -right-1 -bottom-1 w-8 h-8 border-r-4 border-b-4 border-primary rounded-br-lg" />

            {/* Scanning Line Animation */}
            {isStreaming && !isModelLoading && (
              <div className="absolute inset-x-4 top-4 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
            )}
          </div>
        </div>

        {/* Loading Overlay */}
        {isModelLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-2xl">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-white font-medium mb-2">Carregando modelo de IA...</p>
            <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${modelProgress}%` }}
              />
            </div>
            <p className="text-white/60 text-sm mt-2">{modelProgress}%</p>
          </div>
        )}

        {/* Detection Status */}
        {isStreaming && !isModelLoading && (
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-black/50 rounded-full px-3 py-1.5">
              <div
                className={`w-2 h-2 rounded-full ${
                  detections.length > 0 ? "bg-success animate-pulse" : "bg-warning"
                }`}
              />
              <span className="text-white text-sm">
                {detections.length > 0
                  ? `${detections.length} objeto(s) detectado(s)`
                  : "Procurando objetos..."}
              </span>
            </div>

            {hasDocumentDetection && (
              <div className="flex items-center gap-1 bg-success/20 border border-success rounded-full px-3 py-1.5">
                <Focus className="h-4 w-4 text-success" />
                <span className="text-success text-sm font-medium">Pronto!</span>
              </div>
            )}
          </div>
        )}

        {/* Detection List */}
        {detections.length > 0 && (
          <div className="absolute bottom-24 left-4 right-4 space-y-1">
            {detections.slice(0, 3).map((det, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-black/50 rounded-lg px-3 py-2"
              >
                <span className="text-white text-sm">{det.label}</span>
                <span className="text-success text-sm font-medium">
                  {(det.score * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Capture Button */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <button
          onClick={handleCapture}
          disabled={isModelLoading || !isStreaming}
          className={`flex items-center justify-center w-20 h-20 rounded-full transition-all ${
            hasDocumentDetection
              ? "bg-success hover:bg-success/80 ring-4 ring-success/30"
              : "bg-white/20 hover:bg-white/30"
          } disabled:opacity-50`}
        >
          <Camera className="h-8 w-8 text-white" />
        </button>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-32 left-0 right-0 text-center px-4">
        <p className="text-white/60 text-sm">
          Posicione a nota fiscal dentro da área marcada
        </p>
      </div>
    </div>
  );
};

export default YoloCameraModal;
