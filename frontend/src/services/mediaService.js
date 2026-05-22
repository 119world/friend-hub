import api from "./api";

const limits = {
  image: 8 * 1024 * 1024,
  video: 30 * 1024 * 1024,
  audio: 12 * 1024 * 1024
};

export function mediaKind(contentType = "") {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("audio/")) return "audio";
  return "file";
}

export function validateMediaFile(file) {
  const kind = mediaKind(file.type);
  if (!limits[kind]) throw new Error("Only image, video, and audio files are supported.");
  if (file.size > limits[kind]) throw new Error(`${kind} file is too large.`);
  return kind;
}

export async function uploadChatAttachment({ chatId, userId, file, onProgress }) {
  const kind = validateMediaFile(file);
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  onProgress?.(45);
  const { data } = await api.post("/media/upload", {
    base64,
    contentType: file.type,
    fileName: file.name,
    purpose: "chat-attachment",
    folder: `chatMedia/${chatId}/${userId}`
  });
  onProgress?.(100);
  const url = data.item?.url;
  if (!url) throw new Error("Upload did not return a URL.");
  return {
    type: kind,
    mediaUrl: url,
    mediaName: file.name,
    mediaContentType: file.type,
    mediaSize: file.size
  };
}
