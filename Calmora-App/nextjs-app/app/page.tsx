"use client";
import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";

export default function Home() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Default greeting
  useEffect(() => {
    setMessages([{ role: "ai", text: "Hello! How can I help you today?" }]);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: "user", text: userMessage }, { role: "ai", text: "" }]);
    setInput("");
    setLoading(true);

    try {
      const context = messages.map(m => `${m.role}: ${m.text}`).join("\n");

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, question: userMessage }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let aiMessage = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        aiMessage += decoder.decode(value, { stream: true });

        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "ai", text: aiMessage };
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "ai", text: "⚠️ Error: could not get response." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-pink-200">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 px-4 py-4 bg-white border-b shadow">
        <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">
          🤖
        </div>
        <h1 className="font-bold text-gray-800">CALMORA AI</h1>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-4 py-2 rounded-2xl max-w-[75%] text-sm ${
                m.role === "user"
                  ? "bg-purple-500 text-white rounded-br-none"
                  : "bg-white text-gray-900 shadow-sm border border-gray-200 rounded-bl-none"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-2 rounded-2xl bg-white border border-gray-200 text-gray-500 text-sm">
              Calmora is typing...
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="flex items-center gap-2 p-3 bg-white border-t">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-full"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
