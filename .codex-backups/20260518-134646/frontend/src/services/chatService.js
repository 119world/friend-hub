import {
  addDoc,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { localConversation } from "../utils/sampleData";

function readLocalChats() {
  return JSON.parse(localStorage.getItem("friendHubLocalChats") || "{}");
}

function writeLocalChats(chats) {
  localStorage.setItem("friendHubLocalChats", JSON.stringify(chats));
}

export async function openChat({ user, target }) {
  if (user?.isLocal || user?.uid?.startsWith("local_")) {
    const chatId = `local_${target.id}`;
    const chats = readLocalChats();
    chats[chatId] ||= {
      id: chatId,
      userId: user.uid,
      targetId: target.id,
      targetType: target.type,
      targetName: target.name,
      targetPhoto: target.photos?.[0] || "",
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
      participants: [user.uid, target.id],
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
  await updateDoc(doc(db, "chats", chatId), { updatedAt: serverTimestamp() });
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
