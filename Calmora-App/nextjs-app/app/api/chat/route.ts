import { NextRequest } from "next/server";
import ollama from "ollama";

const template = `
Answer the question below

This is conversation history: {context}

Question: {question}

Answer:
`;

export async function POST(req: NextRequest) {
  const { context, question } = await req.json();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await ollama.chat({
          model: "llama3",
          stream: true,
          messages: [
            { role: "system", content: template },
            { role: "user", content: `Context: ${context}\nQuestion: ${question}` },
          ],
        });

        for await (const part of response) {
          const text = part.message?.content || "";
          if (text) controller.enqueue(new TextEncoder().encode(text));
        }
      } catch (err) {
        controller.enqueue(new TextEncoder().encode("⚠️ Error connecting to AI"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
