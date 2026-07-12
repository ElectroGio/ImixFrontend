import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

type Msg = { role: "user" | "assistant"; content: string; ts: number };

type ChatResponse = {
  conversationId: string;
  reply: string;
};

export function AiPage() {
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      content: "¡Hola! Soy el copiloto de Imix. Puedo ayudarte con productos, pedidos e inventario. ¿En qué te ayudo hoy?",
      ts: Date.now()
    }
  ]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, sending]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", content: text, ts: Date.now() }]);
    setSending(true);
    try {
      const { data } = await api.post<ChatResponse>("/ai/chat", {
        customerId: "00000000-0000-0000-0000-000000000000",
        channel: "admin-ui",
        conversationId,
        message: text
      });
      setConversationId(data.conversationId);
      setMsgs((m) => [...m, { role: "assistant", content: data.reply, ts: Date.now() }]);
    } catch (e: any) {
      const detail = e?.response?.data?.detail ?? e?.message ?? "Error desconocido";
      setMsgs((m) => [...m, { role: "assistant", content: `⚠️ ${detail}`, ts: Date.now() }]);
    } finally {
      setSending(false);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function newConversation() {
    setConversationId(null);
    setMsgs([{ role: "assistant", content: "Nueva conversación iniciada. ¿En qué te ayudo?", ts: Date.now() }]);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-2xl font-bold">Asistente IA</h2>
        <button
          onClick={newConversation}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100"
        >
          Nueva conversación
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-white rounded-xl shadow p-4 space-y-3"
      >
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-emerald-600 text-white rounded-br-sm"
                  : "bg-slate-100 text-slate-800 rounded-bl-sm"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-500 px-4 py-2 rounded-2xl text-sm">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "120ms" }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "240ms" }} />
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          rows={2}
          placeholder="Escribe un mensaje…  (Enter para enviar, Shift+Enter para nueva línea)"
          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
          disabled={sending}
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
