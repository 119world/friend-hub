import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ArrowLeft, CheckCheck, Loader2, Mic, MoreVertical, Paperclip, Phone, Send, Smile, Video } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import CallOverlay from "../components/CallOverlay";
import PhoneStatusBar from "../components/PhoneStatusBar";
import { db } from "../firebase/firebase";
import { useAuth } from "../hooks/useAuth";
import { defaultReplyConfig, listenReplyConfig } from "../services/appConfig";
import { appendLocalBotReply, getLocalChat, listenChatMeta, listenMessages, markMessagesSeen, sendMessage, setTypingStatus } from "../services/chatService";
import { uploadChatAttachment, validateMediaFile } from "../services/mediaService";
import { localConversation, sampleProfiles, sampleThreads } from "../utils/sampleData";

export default function ChatRoom() {
  const { chatId } = useParams();
  const location = useLocation();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [locked, setLocked] = useState(false);
  const [meta, setMeta] = useState(null);
  const [uploading, setUploading] = useState(0);
  const [botTyping, setBotTyping] = useState(false);
  const [callMode, setCallMode] = useState(null);
  const [replyConfig, setReplyConfig] = useState(defaultReplyConfig);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  const isLocal = chatId.startsWith("local_");
  const isBot = chat?.targetType === "bot";
  const hasDiamonds = (profile?.diamonds || 0) > 0;
  const freeUserMessages = useMemo(() => messages.filter((message) => message.senderType === "user" || message.senderId === user?.uid).length, [messages, user?.uid]);

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
        targetOnline: sample.online !== false,
        botRepliesUsed: 0
      });
      setMessages(saved?.messages || localConversation);
      return undefined;
    }
    getDoc(doc(db, "chats", chatId)).then((snap) => snap.exists() && setChat({ id: snap.id, ...snap.data() }));
    return listenMessages(chatId, setMessages);
  }, [chatId, isLocal]);

  useEffect(() => {
    if (isLocal) return undefined;
    return listenChatMeta(chatId, setMeta);
  }, [chatId, isLocal]);

  useEffect(() => listenReplyConfig(setReplyConfig), []);

  useEffect(() => {
    if (location.state?.callMode && hasDiamonds) setCallMode(location.state.callMode);
  }, [hasDiamonds, location.state]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    markMessagesSeen(chatId, user?.uid, messages).catch(() => {});
  }, [chatId, messages, user?.uid]);

  const title = useMemo(() => chat?.targetName || "Ananya", [chat]);
  const photo = chat?.targetPhoto || sampleProfiles[1].photos[0];
  const peerTyping = meta?.typing
    ? Object.entries(meta.typing).some(([uid, value]) => uid !== user.uid && value && Date.now() - Number(value) < 6000)
    : false;

  function requireDiamonds(reason = "Recharge diamonds to continue this conversation.", allowOneFreeChat = false) {
    if (hasDiamonds) return false;
    if (allowOneFreeChat && freeUserMessages < 1) return false;
    setLocked(true);
    navigate("/recharge", { state: { reason } });
    return true;
  }

  async function botReply(nextUsed) {
    const replyText = nextUsed === 1
      ? (chat?.firstReply || replyConfig.firstReply)
      : (chat?.secondReply || replyConfig.secondReply || replyConfig.rechargeMessage);
    if (isLocal) {
      const updated = appendLocalBotReply(chatId, replyText);
      setMessages([...updated.messages]);
      setChat((old) => ({ ...old, botRepliesUsed: updated.botRepliesUsed }));
      setBotTyping(false);
      if (updated.botRepliesUsed >= Number(chat?.freeReplyLimit || replyConfig.replyLimit || 2) && !hasDiamonds) setLocked(true);
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
    setChat((old) => ({ ...old, botRepliesUsed: nextUsed }));
    setBotTyping(false);
    if (nextUsed >= Number(chat?.freeReplyLimit || replyConfig.replyLimit || 2) && !hasDiamonds) setLocked(true);
  }

  async function handleSend() {
    if (!text.trim()) return;
    if (requireDiamonds("One free message is unlocked. Recharge diamonds to continue the next chat.", true)) return;
    if (locked && !hasDiamonds) return;
    const current = text.trim();
    setText("");
    await setTypingStatus(chatId, user.uid, false).catch(() => {});
    const result = await sendMessage(chatId, { senderId: user.uid, senderType: "user", text: current, type: "text" });
    if (isLocal && result) setMessages([...result]);
    if (isBot || isLocal) {
      const used = chat?.botRepliesUsed || 0;
      if (used >= Number(chat?.freeReplyLimit || replyConfig.replyLimit || 2) && !hasDiamonds) {
        setLocked(true);
        return;
      }
      setBotTyping(true);
      setTimeout(() => botReply(used + 1), Number(chat?.replyDelayMs || replyConfig.delayMs || 650));
    }
  }

  function handleTextChange(value) {
    setText(value);
    setTypingStatus(chatId, user.uid, Boolean(value.trim())).catch(() => {});
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => {
      setTypingStatus(chatId, user.uid, false).catch(() => {});
    }, 1400);
  }

  async function handleAttach(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || requireDiamonds("Recharge diamonds to send photos, videos, and voice notes.")) return;
    try {
      setUploading(1);
      validateMediaFile(file);
      const payload = isLocal
        ? await localAttachmentPayload(file)
        : await uploadChatAttachment({
            chatId,
            userId: user.uid,
            file,
            onProgress: setUploading
          });
      const result = await sendMessage(chatId, {
        senderId: user.uid,
        senderType: "user",
        text: file.name,
        ...payload
      });
      if (isLocal && result) setMessages([...result]);
    } catch (err) {
      alert(err.message || "Upload failed");
    } finally {
      setUploading(0);
    }
  }

  function localAttachmentPayload(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : file.type.startsWith("audio/") ? "audio" : "file";
        resolve({
          type,
          mediaUrl: reader.result,
          mediaName: file.name,
          mediaContentType: file.type,
          mediaSize: file.size
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function renderMessage(message) {
    if (message.type === "image" && message.mediaUrl) {
      return <img src={message.mediaUrl} alt={message.mediaName || "attachment"} className="max-h-64 rounded-2xl object-cover" />;
    }
    if (message.type === "video" && message.mediaUrl) {
      return <video src={message.mediaUrl} controls className="max-h-72 rounded-2xl" />;
    }
    if (message.type === "audio" && message.mediaUrl) {
      return <audio src={message.mediaUrl} controls className="w-56" />;
    }
    return message.text;
  }

  return (
    <section className="flex min-h-[calc(100vh-72px)] flex-col pb-24">
      <PhoneStatusBar />
      <header className="flex items-center gap-3 border-b border-zinc-100 px-5 pb-5 pt-7">
        <button onClick={() => navigate(-1)} className="text-black"><ArrowLeft size={32} /></button>
        <div className="relative h-16 w-16 shrink-0">
          <img src={photo} alt="" className="h-16 w-16 rounded-full object-cover" />
          <span className="absolute bottom-1 right-0 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-black">{title}</h1>
          <p className="text-sm text-zinc-500">{peerTyping || botTyping ? "typing..." : chat?.targetOnline === false ? "Offline" : "Online"}</p>
        </div>
        <button onClick={() => requireDiamonds("Recharge diamonds to start an audio call.") || setCallMode("audio")} className="grid h-10 w-10 place-items-center rounded-full text-[#f72565] active:bg-zinc-100"><Phone size={23} /></button>
        <button onClick={() => requireDiamonds("Recharge diamonds to start a video call.") || setCallMode("video")} className="grid h-10 w-10 place-items-center rounded-full text-[#f72565] active:bg-zinc-100"><Video size={24} /></button>
        <button className="text-black"><MoreVertical size={31} /></button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-7">
        <p className="mb-7 text-center text-base font-medium text-zinc-500">Today</p>
        <div className="space-y-7">
          {messages.map((message) => {
            const mine = message.senderType === "user" || message.senderId === user.uid;
            return (
              <div key={message.id} className={`flex items-end gap-3 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine && <img src={photo} alt="" className="h-12 w-12 rounded-full object-cover" />}
                <div className={`max-w-[72%] ${mine ? "text-right" : "text-left"}`}>
                  <div className={`rounded-[22px] px-5 py-4 text-lg leading-7 ${mine ? "pink-gradient text-white" : "bg-zinc-100 text-zinc-950"}`}>
                    {renderMessage(message)}
                  </div>
                  <p className={`mt-2 flex items-center gap-1 text-sm font-medium text-zinc-500 ${mine ? "justify-end pr-2" : "pl-2"}`}>
                    <span>{message.time || "12:34 PM"}</span>
                    {mine && <CheckCheck size={16} className={(message.readBy || []).length > 1 ? "text-blue-500" : "text-zinc-400"} />}
                  </p>
                </div>
              </div>
            );
          })}
          {(peerTyping || botTyping) && (
            <div className="flex items-end gap-3">
              <img src={photo} alt="" className="h-12 w-12 rounded-full object-cover" />
              <div className="rounded-[22px] bg-zinc-100 px-5 py-4 text-zinc-500">typing...</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        {locked && (
          <div className="mt-7 rounded-[26px] bg-[#fff0f5] p-5 text-center">
            <p className="font-black text-[#f72565]">Recharge required</p>
            <p className="mt-1 text-sm font-semibold text-zinc-500">{replyConfig.rechargeMessage}</p>
            <button onClick={() => navigate("/recharge")} className="pink-gradient mt-3 rounded-full px-5 py-3 font-black text-white">Recharge Now</button>
          </div>
        )}
      </div>

      <footer className="fixed bottom-[92px] left-1/2 z-20 flex w-full max-w-[430px] -translate-x-1/2 items-center gap-2 bg-white px-5 py-4">
        <input id="chat-attachment" type="file" accept="image/*,video/*,audio/*" onChange={handleAttach} className="hidden" />
        <label htmlFor="chat-attachment" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-600">
          {uploading ? <Loader2 size={22} className="animate-spin" /> : <Paperclip size={22} />}
        </label>
        <label className="flex min-w-0 flex-1 items-center rounded-full bg-zinc-100 px-4 py-3">
          <input
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-zinc-400"
          />
          <Smile className="text-zinc-500" size={24} />
        </label>
        <button onClick={handleSend} className="pink-gradient grid h-14 w-14 shrink-0 place-items-center rounded-full text-white shadow-lg shadow-pink-500/25">
          {text.trim() ? <Send size={25} fill="currentColor" /> : <Mic size={25} />}
        </button>
      </footer>
      <CallOverlay open={Boolean(callMode)} mode={callMode || "audio"} contact={{ name: title, photo }} onClose={() => setCallMode(null)} />
    </section>
  );
}
