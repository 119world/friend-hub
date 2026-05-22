import admin from "firebase-admin";
import { env } from "./env.js";

if (!admin.apps.length) {
  if (env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.firebase.projectId,
        clientEmail: env.firebase.clientEmail,
        privateKey: env.firebase.privateKey
      })
    });
  } else {
    admin.initializeApp({ projectId: env.firebase.projectId || "friend-hub-local" });
  }
}

export const firebaseAdmin = admin;
export const db = admin.firestore();
export const auth = admin.auth();
export const messaging = admin.messaging();
