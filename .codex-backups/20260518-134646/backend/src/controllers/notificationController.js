import { messaging } from "../config/firebaseAdmin.js";

export async function sendNotification(req, res) {
  const { token, title, body } = req.body;
  const id = await messaging.send({ token, notification: { title, body } });
  res.json({ id });
}
