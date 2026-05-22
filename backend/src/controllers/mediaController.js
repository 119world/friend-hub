import crypto from "crypto";
import { env } from "../config/env.js";
import { db, firebaseAdmin, hasFirestoreCredentials, storageBucket } from "../config/firebaseAdmin.js";
import { hasCloudinaryConfig, uploadToCloudinary } from "../services/cloudinaryService.js";

const allowedTypes = /^(image|video|audio)\//;
const maxBytesByKind = {
  image: 8 * 1024 * 1024,
  video: 30 * 1024 * 1024,
  audio: 12 * 1024 * 1024
};

function cleanFolder(folder = "admin") {
  return String(folder).replace(/[^a-zA-Z0-9/_-]/g, "").replace(/^\/+|\/+$/g, "") || "admin";
}

function extensionFromName(fileName = "") {
  const ext = String(fileName).split(".").pop();
  return ext && ext !== fileName ? ext.toLowerCase().replace(/[^a-z0-9]/g, "") : "bin";
}

export async function uploadMedia(req, res) {
  const { base64, contentType, fileName, folder = "admin/media", purpose = "media" } = req.body || {};
  if (!base64 || !contentType || !allowedTypes.test(contentType)) {
    return res.status(400).json({ message: "Only image, video, and audio uploads are supported." });
  }

  const kind = contentType.split("/")[0];
  const buffer = Buffer.from(String(base64).replace(/^data:[^;]+;base64,/, ""), "base64");
  if (!buffer.length || buffer.length > maxBytesByKind[kind]) {
    return res.status(400).json({ message: `${kind} upload is too large.` });
  }

  const token = crypto.randomUUID();
  const safeFolder = cleanFolder(folder);
  const ext = extensionFromName(fileName);
  const objectPath = `${safeFolder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const cleanBase64 = String(base64).replace(/^data:[^;]+;base64,/, "");

  if (hasCloudinaryConfig()) {
    try {
      const uploaded = await uploadToCloudinary({ base64: cleanBase64, contentType, fileName, folder: safeFolder });
      const item = {
        id: uploaded.storagePath,
        title: fileName || objectPath,
        url: uploaded.url,
        storagePath: uploaded.storagePath,
        provider: uploaded.provider,
        contentType,
        kind,
        purpose,
        active: true,
        bytes: uploaded.bytes || buffer.length
      };
      if (hasFirestoreCredentials) {
        try {
          const doc = await db.collection("mediaAssets").add({
            ...item,
            uploadedBy: req.user?.uid || "admin",
            createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
          });
          item.id = doc.id;
        } catch {
          item.demo = true;
        }
      }
      return res.status(201).json({ item });
    } catch (error) {
      return res.status(502).json({ message: "Cloudinary upload failed. Check CLOUDINARY_* keys.", detail: error.response?.data?.error?.message || error.message });
    }
  }

  if (!env.firebase.storageBucket || !hasFirestoreCredentials) {
    const url = `data:${contentType};base64,${cleanBase64}`;
    return res.status(201).json({
      item: {
        id: `local_${Date.now()}`,
        title: fileName || objectPath,
        url,
        storagePath: objectPath,
        contentType,
        kind,
        purpose,
        active: true,
        demo: true
      }
    });
  }

  const bucket = storageBucket();
  const file = bucket.file(objectPath);

  await file.save(buffer, {
    resumable: false,
    metadata: {
      contentType,
      metadata: {
        firebaseStorageDownloadTokens: token,
        uploadedBy: "admin",
        purpose: String(purpose).slice(0, 64)
      }
    }
  });

  const encodedPath = encodeURIComponent(objectPath);
  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;
  const doc = await db.collection("mediaAssets").add({
    title: fileName || objectPath,
    url,
    storagePath: objectPath,
    contentType,
    kind,
    purpose,
    active: true,
    createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
  });

  res.status(201).json({
    item: {
      id: doc.id,
      title: fileName || objectPath,
      url,
      storagePath: objectPath,
      contentType,
      kind,
      purpose,
      active: true
    }
  });
}
