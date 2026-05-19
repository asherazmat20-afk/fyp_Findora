import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../config/api";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "../components/PageTransition";
import UiToast from "../components/UiToast";
import { apiFetch, authHeaders } from "../utils/apiClient";
import { getSession } from "../utils/auth";

const socket = io(`${API_BASE_URL}`);

function Chat() {
  const { userId: otherUserId } = useParams();
  const { userId: myId } = getSession();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [online] = useState(true); 
  const endRef = useRef(null);
  const [toast] = useState("");

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return aTime - bTime;
    });
  }, [messages]);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      const isCurrentThread =
        (data.sender === myId && data.receiver === otherUserId) ||
        (data.sender === otherUserId && data.receiver === myId);

      if (isCurrentThread) {
        setMessages((prev) => [...prev, data]);
      }
    });

    return () => socket.off("receiveMessage");
  }, [myId, otherUserId]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/api/messages/${myId}/${otherUserId}`);
        const data = await res.json();

        if (!res.ok) {
          console.error(data.error || "Failed to fetch messages");
          setMessages([]);
          return;
        }

        setMessages(Array.isArray(data) ? data : data.messages || []);
      } catch (error) {
        console.error(error);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [myId, otherUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [sortedMessages, isTyping]);

  const handleTyping = (value) => {
    setText(value);
    setIsTyping(value.trim().length > 0);
  };

  const quickReplies = ["I think this might be mine", "Can we meet at campus gate?", "Please share more details"];

  const handleSend = async () => {
    if (!text.trim() || sending || !myId || !otherUserId) return;

    const messageData = {
      sender: myId,
      receiver: otherUserId,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      setSending(true);

      setMessages((prev) => [...prev, messageData]);

      socket.emit("sendMessage", messageData);

      const res = await apiFetch(`/api/messages/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(messageData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send");
      }

      setText("");
      setIsTyping(false);
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const getTime = (raw) => {
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <PageTransition> 
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">Secure Chat</h2>
              <p className="text-xs text-slate-500">Discuss item details safely</p>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  online ? "bg-emerald-500" : "bg-slate-400"
                }`}
              />
              <span className="text-slate-600">{online ? "Online" : "Offline"}</span>
            </div>
          </div>

          {/* Quick replies */}
          <div className="px-4 pt-3 flex flex-wrap gap-2 border-b bg-white">
            {quickReplies.map((q) => (
              <button
                key={q}
                onClick={() => handleTyping(q)}
                className="text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="h-[60vh] overflow-y-auto px-4 py-4 bg-[radial-gradient(circle_at_top,_#f8fbff,_#ffffff)]">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 bg-slate-100 rounded-lg w-2/3" />
                ))}
              </div>
            ) : sortedMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No messages yet. Start with a friendly intro.
              </div>
            ) : (
              <AnimatePresence>
                {sortedMessages.map((msg, idx) => {
                  const mine = msg.sender === myId;
                  return (
                    <motion.div
                      key={`${msg._id || idx}-${msg.text}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mb-3 flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-2xl shadow-sm ${
                          mine
                            ? "bg-blue-600 text-white rounded-br-md"
                            : "bg-slate-100 text-slate-800 rounded-bl-md"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            mine ? "text-blue-100" : "text-slate-500"
                          }`}
                        >
                          {getTime(msg.createdAt)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}

            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-slate-400 mt-1"
                >
                  You are typing...
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t bg-white">
            <div className="flex gap-2">
              <input
                value={text}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 border px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Type message..."
              />

              <button
                onClick={handleSend}
                disabled={!text.trim() || sending}
                className={`px-4 rounded-xl text-white ${
                  !text.trim() || sending
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {sending ? "..." : "Send"}
              </button>
            </div>

            <p className="text-[11px] text-slate-400 mt-2">
              Safety tip: Avoid sharing private contact details in chat.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
    <UiToast message={toast} />
    </PageTransition>
  );
}

export default Chat;