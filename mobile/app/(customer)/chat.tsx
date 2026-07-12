import { useState } from "react";
import { View, Text, TextInput, Pressable, FlatList } from "react-native";
import { api } from "../../lib/api";

type Msg = { role: "user" | "assistant"; content: string };

export default function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [convId, setConvId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const user: Msg = { role: "user", content: input };
    setMsgs((m) => [...m, user]); setInput(""); setSending(true);
    try {
      const { data } = await api.post("/ai/chat", { conversationId: convId, message: user.content });
      setConvId(data.conversationId);
      setMsgs((m) => [...m, { role: "assistant", content: data.reply }]);
    } finally { setSending(false); }
  }

  return (
    <View className="flex-1 bg-white">
      <FlatList className="flex-1 p-3" data={msgs} keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View className={`my-1 p-3 rounded max-w-[80%] ${item.role === "user" ? "self-end bg-imixLeaf-500" : "self-start bg-slate-100"}`}>
            <Text className={item.role === "user" ? "text-white" : "text-slate-900"}>{item.content}</Text>
          </View>
        )} />
      <View className="flex-row p-3 border-t border-slate-100 gap-2">
        <TextInput className="flex-1 border border-slate-200 rounded px-3 py-2"
                   value={input} onChangeText={setInput} placeholder="Pregúntale al asistente Imix…" />
        <Pressable onPress={send} disabled={sending} className="bg-imixLeaf-700 px-4 justify-center rounded">
          <Text className="text-white font-semibold">Enviar</Text>
        </Pressable>
      </View>
    </View>
  );
}
