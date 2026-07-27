import { memo, useEffect, useState } from "react";
import { Button, Modal, useOverlayState } from "@heroui/react";
import { DownloadIcon, XIcon } from "lucide-react";
import { withTransform } from "../../lib/imagekit";
import { MessageVideo } from "./MessageVideo";

// Compress + size images for the bubble (q-auto works for images; f-auto picks WebP/AVIF).
const IMAGE_TRANSFORM = "q-auto,w-640,f-auto";

function MessageBubbleComponent({ message, onImageLoad }) {
  const isOwnMessage = message.role === "me";
  const hasImage = Boolean(message.imageUrl);
  const hasVideo = Boolean(message.videoUrl);
  const previewModal = useOverlayState();
  const [previewDimensions, setPreviewDimensions] = useState({ width: 0, height: 0 });
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  const previewImageUrl = hasImage ? withTransform(message.imageUrl, IMAGE_TRANSFORM) : undefined;
  const isPreviewOpen = previewModal.isOpen;

  useEffect(() => {
    if (!isPreviewOpen || typeof window === "undefined") return;

    const updateViewport = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);

    return () => window.removeEventListener("resize", updateViewport);
  }, [isPreviewOpen]);

  const previewStyle =
    previewDimensions.width && previewDimensions.height
      ? {
          maxWidth: `${Math.min(previewDimensions.width, Math.max(320, viewport.width * 0.95))}px`,
          maxHeight: `${Math.min(previewDimensions.height, Math.max(240, viewport.height * 0.85))}px`,
          width: "auto",
          height: "auto",
        }
      : undefined;

  return (
    <>
      <div className={`flex w-full ${isOwnMessage ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[min(90%,28rem)] rounded-2xl px-3 py-2 text-[15px] leading-snug sm:max-w-[min(75%,28rem)] sm:px-3.5 ${
            isOwnMessage
              ? "rounded-br-md bg-accent text-accent-foreground"
              : "rounded-bl-md bg-surface"
          }`}
        >
          {hasImage ? (
            <div className="relative mb-1.5">
              <button
                type="button"
                className="block cursor-zoom-in rounded-lg"
                onClick={() => previewModal.open()}
              >
                <img
                  src={previewImageUrl}
                  alt=""
                  onLoad={onImageLoad}
                  className="max-h-40 max-w-full rounded-lg object-cover sm:max-h-52 sm:rounded-xl"
                />
              </button>
              {!isOwnMessage ? (
                <Button
                  isIconOnly
                  size="sm"
                  variant="solid"
                  color="primary"
                  className="absolute bottom-2 right-2 shadow-lg"
                  onPress={async () => {
                    const filename = `image-${message.id || "download"}`;

                    try {
                      const response = await fetch(message.imageUrl, { mode: "cors" });
                      if (!response.ok) throw new Error("Failed to fetch image");

                      const blob = await response.blob();
                      const objectUrl = window.URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = objectUrl;
                      link.download = filename;
                      link.style.display = "none";
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(objectUrl);
                    } catch {
                      const link = document.createElement("a");
                      link.href = message.imageUrl;
                      link.download = filename;
                      link.style.display = "none";
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                >
                  <DownloadIcon className="size-4" />
                </Button>
              ) : null}
            </div>
          ) : null}
          {hasVideo ? <MessageVideo src={message.videoUrl} /> : null}
          {message.text ? (
            <p className="whitespace-pre-wrap wrap-break-word">{message.text}</p>
          ) : null}
          <p
            className={`mt-1 text-[11px] tabular-nums ${
              isOwnMessage ? "text-accent-foreground/75" : "text-muted"
            }`}
          >
            {message.time}
          </p>
        </div>
      </div>
      {hasImage ? (
        <Modal.Root state={previewModal}>
          <Modal.Backdrop variant="opaque">
            <Modal.Container placement="center" className="w-fit max-w-[95vw] p-2 sm:p-4">
              <Modal.Dialog className="w-fit max-w-[95vw] overflow-hidden rounded-2xl border border-white/10 bg-[#111113] text-foreground shadow-2xl">
                <Modal.Header className="flex items-center justify-end border-b border-white/10 px-3 py-2">
                  <Button
                    isIconOnly
                    variant="light"
                    className="ml-auto text-white"
                    onPress={() => previewModal.close()}
                  >
                    <XIcon className="size-4" />
                  </Button>
                </Modal.Header>
                <Modal.Body className="flex items-center justify-center overflow-hidden bg-black/90 p-2 sm:p-4">
                  <img
                    src={message.imageUrl}
                    alt=""
                    onLoad={(event) => {
                      const { naturalWidth, naturalHeight } = event.currentTarget;
                      setPreviewDimensions({ width: naturalWidth, height: naturalHeight });
                    }}
                    style={previewStyle}
                    className="block h-auto w-auto max-h-[85dvh] max-w-[95vw] rounded-lg object-contain"
                  />
                </Modal.Body>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal.Root>
      ) : null}
    </>
  );
}

export const MessageBubble = memo(MessageBubbleComponent);
