import admin from "firebase-admin";
import { env } from "./env.js";

if (!admin.apps.length) {
  if (env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.firebase.projectId,
        clientEmail: env.firebase.clientEmail,
        privateKey: env.firebase.privateKey
      }),
      storageBucket: env.firebase.storageBucket
    });
  } else {
    admin.initializeApp({
      projectId: env.firebase.projectId || "friend-hub-local",
      storageBucket: env.firebase.storageBucket
    });
  }
}

export const firebaseAdmin = admin;
export const db = admin.firestore();
export const auth = admin.auth();
export const messaging = admin.messaging();
export const storageBucket = () => admin.storage().bucket();
export const hasFirestoreCredentials = Boolean(
  process.env.FIRESTORE_ENABLED !== "false" && (process.env.FIRESTORE_EMULATOR_HOST ||
  (env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey)
  )
);
