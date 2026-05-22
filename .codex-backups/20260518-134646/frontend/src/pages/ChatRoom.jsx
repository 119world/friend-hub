import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ArrowLeft, MoreVertical, Send, Smile } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase/firebase";
import { useAuth } from "../hooks/useAuth";
import { appendLocalBotReply, getLocalChat, listenMessages, sendMessage } from "../services/chatService";
import { localConversation, sampleProfiles, sampleThreads } from "../utils/sampleData";

export default function ChatRoom() {
  const { chatId } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [locked, setLocked] = useState(false);

  const isLocal = chatId.startsWith("local_");
  const isBot = chat?.targetType === "bot";
  const hasDiamonds = (profile?.diamonds || 0) > 0;

  useEffect(() => {
    if (isLocal) {
      const saved = getLocalChat(chatId);
      const profileId = chatId.replace("local_", "");
      const sample = sampleProfiles.find((item) => item.id === profileId) || sampleProfiles[1];
      const thread = sampleThreads.find((item) => item.id === chatId);
      setChat(saved || {
        id: chatId,
        targetId: sample.id,
        targetType: sample.type,
        targetName: thread?.name || sample.name,
        targetPhoto: thread?.photo || sample.photos[0],
        botRepliesUsed: 0
      });
      setMessages(saved?.messages || localConversation);
      return undefined;
    }
    getDoc(doc(db, "chats", chatId)).then((snap) => snap.exists() && setChat({ id: snap.id, ...snap.data() }));
    return listenMessages(chatId, setMessages);
  }, [chatId, isLocal]);

  const title = useMemo(() => chat?.targetName || "Ananya", [chat]);
  const photo = chat?.targetPhoto || sampleProfiles[1].photos[0];

  async function botReply(nextUsed) {
    const replyText = nextUsed === 1 ? "That sounds amazing! I love hiking too. 🥾" : "Definitely! I'd love that. 😊";
    if (isLocal) {
      const updated = appendLocalBotReply(chatId, replyText);
      setMessages([...updated.messages]);
      if (updated.botRepliesUsed >= 2 && !hasDiamonds) setLocked(true);
      return;
    }
    await addDoc(collection(db, "chats", chatId, "messages"), {
      senderId: chat.targetId,
      senderType: "bot",
      text: replyText,
      type: "text",
      readBy: [],
      createdAt: serverTimestamp()
    });
    await updateDoc(doc(db, "chats", chatId), { botRepliesUsed: nextUsed, updatedAt: serverTimestamp() });
    if (nextUsed >= 2 && !hasDiamonds) setLocked(true);
  }

  async function handleSend() {
    if (!text.trim()) return;
    if (locked && !hasDiamonds) return;
    const current = text.trim();
    setText("");
    const result = await sendMessage(chatId, { senderId: user.uid, senderType: "user", text: current, type: "text" });
    if (isLocal && result) setMessages([...result]);
    if (isBot || isLocal) {
      const used = chat?.botRepliesUsed || 0;
      if (used >= 2 && !hasDiamonds) {
        setLocked(true);
        return;
      }
      setTimeout(() => botReply(used + 1), 550);
    }
  }

  return (
    <section className="flex min-h-[calc(100vh-72px)] flex-col pb-24">
      <header className="flex items-center gap-4 border-b border-zinc-100 px-6 pb-5 pt-2">
        <button onClick={() => navigate(-1)} className="text-black"><ArrowLeft size={32} /></button>
        <div className="relative h-16 w-16 shrink-0">
          <img src={photo} className="h-16 w-16 rounded-full object-cover" />
          <span className="absolute bottom-1 right-0 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-black">{title}</h1>
          <p className="text-base text-zinc-500">Online</p>
        </div>
        <button className="text-black"><MoreVertical size={31} /></button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <p className="mb-7 text-center text-base font-medium text-zinc-500">Today</p>
        <div className="space-y-7">
          {messages.map((message) => {
            const mine = message.senderType === "user" || message.senderId === user.uid;
            return (
              <div key={message.id} className={`flex items-end gap-3 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine && <img src={photo} className="h-12 w-12 rounded-full object-cover" />}
                <div className={`max-w-[72%] ${mine ? "text-right" : "text-left"}`}>
                  <div className={`rounded-[22px] px-5 py-4 text-lg leading-7 ${mine ? "pink-gradient text-white" : "bg-zinc-100 text-zinc-950"}`}>
                    {message.text}
                  </div>
                  <p className={`mt-2 text-sm font-medium text-zinc-500 ${mine ? "pr-2" : "pl-2"}`}>{message.time || "12:34 PM"} {mine ? "✓✓" : ""}</p>
                </div>
              </div>
            );
          })}
        </div>
        {locked && (
          <div className="mt-7 rounded-[26px] bg-[#fff0f5] p-5 text-center">
            <p className="font-black text-[#f72565]">Recharge required</p>
            <button onClick={() => navigate("/recharge")} className="pink-gradient mt-3 rounded-full px-5 py-3 font-black text-white">Recharge Now</button>
          </div>
        )}
      </div>

      <footer className="fixed bottom-[88px] left-1/2 z-20 flex w-full max-w-[430px] -translate-x-1/2 items-center gap-3 bg-white px-6 py-4">
        <label className="flex min-w-0 flex-1 items-center rounded-full bg-zinc-100 px-5 py-4">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-zinc-400"
          />
          <Smile className="text-zinc-500" size={27} />
        </label>
        <button onClick={handleSend} className="pink-gradient grid h-16 w-16 place-items-center rounded-full text-white shadow-lg shadow-pink-500/25"><Send size={29} fill="currentColor" /></button>
      </footer>
    </section>
  );
}
