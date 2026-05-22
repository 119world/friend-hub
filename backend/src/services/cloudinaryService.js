import axios from "axios";
import crypto from "crypto";
import { env } from "../config/env.js";

function cleanFolder(folder = "friend-hub/admin") {
  return String(folder)
    .replace(/[^a-zA-Z0-9/_-]/g, "")
    .replace(/^\/+|\/+$/g, "") || "friend-hub/admin";
}

function cleanPublicId(fileName = "media") {
  const base = String(fileName).replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40) || "media";
  return `${Date.now()}-${crypto.randomUUID()}-${base}`;
}

function signParams(params) {
  const source = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(`${source}${env.cloudinary.apiSecret}`).digest("hex");
}

export function hasCloudinaryConfig() {
  return Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);
}

export async function uploadToCloudinary({ base64, contentType, fileName, folder }) {
  if (!hasCloudinaryConfig()) throw new Error("Cloudinary is not configured.");
  const resourceType = contentType.startsWith("image/") ? "image" : "video";
  const cleanBase64 = String(base64).replace(/^data:[^;]+;base64,/, "");
  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    folder: cleanFolder(`friend-hub/${folder || "media"}`),
    public_id: cleanPublicId(fileName),
    timestamp
  };
  const form = new URLSearchParams({
    ...params,
    api_key: env.cloudinary.apiKey,
    signature: signParams(params),
    file: `data:${contentType};base64,${cleanBase64}`
  });
  const { data } = await axios.post(
    `https://api.cloudinary.com/v1_1/${env.cloudinary.cloudName}/${resourceType}/upload`,
    form,
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      maxBodyLength: Infinity,
      timeout: 60000
    }
  );
  return {
    url: data.secure_url,
    storagePath: data.public_id,
    provider: "cloudinary",
    resourceType,
    bytes: data.bytes,
    width: data.width,
    height: data.height,
    format: data.format
  };
}
