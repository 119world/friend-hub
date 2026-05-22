import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { localConversation } from "../utils/sampleData";

const useFirestore = import.meta.env.VITE_USE_FIRESTORE !== "false";

function readLocalChats() {
  return JSON.parse(localStorage.getItem("friendHubLocalChats") || "{}");
}

function writeLocalChats(chats) {
  localStorage.setItem("friendHubLocalChats", JSON.stringify(chats));
}

export async function openChat({ user, target }) {
  if (!useFirestore || user?.isLocal || user?.uid?.startsWith("local_")) {
    const chatId = `local_${target.id}`;
    const chats = readLocalChats();
    chats[chatId] ||= {
      id: chatId,
      userId: user.uid,
      targetId: target.id,
      targetType: target.type,
      targetName: target.name,
      targetPhoto: target.photos?.[0] || "",
      targetOnline: target.online !== false,
      firstReply: target.firstReply || "",
      secondReply: target.secondReply || "",
      freeReplyLimit: Number(target.freeReplyLimit || target.replyLimit || 2),
      replyDelayMs: Number(target.delayMs || 650),
      botRepliesUsed: 0,
      messages: [
        {
          id: "welcome",
          senderType: target.type,
          text: target.welcomeMessage || "Hey! How's your weekend going?",
          time: "12:30 PM"
        }
      ]
    };
    writeLocalChats(chats);
    return chatId;
  }
  const chatId = [user.uid, target.id].sort().join("_");
  try {
    const ref = doc(db, "chats", chatId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        id: chatId,
        userId: user.uid,
        targetId: target.id,
        targetType: target.type,
        targetName: target.name,
        targetPhoto: target.photos?.[0] || "",
        targetOnline: target.online !== false,
        firstReply: target.firstReply || "",
        secondReply: target.secondReply || "",
        freeReplyLimit: Number(target.freeReplyLimit || target.replyLimit || 2),
        replyDelayMs: Number(target.delayMs || 650),
        participants: [user.uid, target.id],
        typing: {},
        botRepliesUsed: 0,
        blocked: false,
        reported: false,
        unreadByUser: 0,
        unreadByTarget: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: target.id,
        senderType: target.type,
        text: target.welcomeMessage || "Hi, welcome to Friend Hub.",
        type: "text",
        readBy: [],
        createdAt: serverTimestamp()
      });
    }
  } catch {
    return openChat({ user: { ...user, isLocal: true }, target });
  }
  return chatId;
}

export function listenMessages(chatId, cb) {
  if (chatId.startsWith("local_")) {
    const chats = readLocalChats();
    cb(chats[chatId]?.messages || localConversation);
    return () => {};
  }
  const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"), limit(80));
  return onSnapshot(q, (snap) => cb(snap.docs.map((item) => ({ id: item.id, ...item.data() }))));
}

export async function sendMessage(chatId, message) {
  if (chatId.startsWith("local_")) {
    const chats = readLocalChats();
    chats[chatId] ||= { id: chatId, messages: [] };
    chats[chatId].messages.push({
      id: `m_${Date.now()}`,
      ...message,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    });
    writeLocalChats(chats);
    return chats[chatId].messages;
  }
  await addDoc(collection(db, "chats", chatId, "messages"), {
    ...message,
    readBy: [message.senderId],
    createdAt: serverTimestamp()
  });
  await updateDoc(doc(db, "chats", chatId), {
    updatedAt: serverTimestamp(),
    lastMessage: message.text || message.mediaName || message.type,
    lastMessageType: message.type || "text"
  });
}

export function getLocalChat(chatId) {
  return readLocalChats()[chatId] || null;
}

export function appendLocalBotReply(chatId, text) {
  const chats = readLocalChats();
  chats[chatId] ||= { id: chatId, messages: [] };
  chats[chatId].messages.push({
    id: `bot_${Date.now()}`,
    senderType: "bot",
    text,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  });
  chats[chatId].botRepliesUsed = Number(chats[chatId].botRepliesUsed || 0) + 1;
  writeLocalChats(chats);
  return chats[chatId];
}

export function listenChatMeta(chatId, cb) {
  if (chatId.startsWith("local_")) return () => {};
  return onSnapshot(doc(db, "chats", chatId), (snap) => {
    if (snap.exists()) cb({ id: snap.id, ...snap.data() });
  }, () => {});
}

export async function setTypingStatus(chatId, userId, typing) {
  if (!chatId || !userId || chatId.startsWith("local_")) return;
  await setDoc(doc(db, "chats", chatId), {
    typing: {
      [userId]: typing ? Date.now() : null
    },
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function markMessagesSeen(chatId, userId, messages = []) {
  if (!chatId || !userId || chatId.startsWith("local_")) return;
  const batch = writeBatch(db);
  let count = 0;
  messages.forEach((message) => {
    if (message.senderId !== userId && !(message.readBy || []).includes(userId) && count < 20) {
      batch.update(doc(db, "chats", chatId, "messages", message.id), {
        readBy: arrayUnion(userId)
      });
      count += 1;
    }
  });
  if (count) await batch.commit();
}
