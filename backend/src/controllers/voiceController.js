import { deductVoiceDiamonds, startVoicePreview } from "../services/voiceBillingService.js";

export async function preview(req, res) {
  res.json(await startVoicePreview(req.user.uid, req.body.targetId));
}

export async function bill(req, res) {
  res.json(await deductVoiceDiamonds(req.user.uid, Number(req.body.seconds || 0), Number(req.body.ratePerMinute || 20)));
}
