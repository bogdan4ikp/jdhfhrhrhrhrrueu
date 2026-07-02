import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function* asyncIterableFromReader(reader: ReadableStreamDefaultReader<Uint8Array>) {
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Route
  app.post("/api/chat", async (req, res) => {
    const { prompt, images, language } = req.body;
    
    if (!prompt && (!images || images.length === 0)) {
      return res.status(400).json({ error: "Prompt or image is required" });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const startTime = Date.now();
      const langName = language === 'en' ? 'English' : 
                       language === 'es' ? 'Spanish' : 
                       language === 'fr' ? 'French' : 
                       language === 'de' ? 'German' : 'Russian';

      const messagesData: any[] = [
        {
          role: "system",
          content: `You are Solvexa, a powerful, highly intelligent AI. You MUST ALWAYS output your detailed internal reasoning wrapped in <think> and </think> tags before providing your final answer to the user. Do not use JSON. Your final answer should be well formatted. IMPORTANT: You must think and answer in ${langName}. If the user asks you to write code or run HTML, you should output complete, standalone HTML inside \`\`\`html ... \`\`\` blocks, and the frontend will allow the user to run it.`
        }
      ];

      // Handle image content
      if (images && images.length > 0) {
        // OpenAI format for multimodal
        const contentArr: any[] = [];
        if (prompt) {
           contentArr.push({ type: "text", text: prompt });
        }
        images.forEach((img: string) => {
           contentArr.push({ type: "image_url", image_url: { url: img } });
        });
        messagesData.push({ role: "user", content: contentArr });
      } else {
        messagesData.push({ role: "user", content: prompt });
      }

      let openRouterSuccess = false;
      const openRouterKey = process.env.OPENROUTER_API_KEY;

      if (openRouterKey) {
        try {
          let response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openRouterKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://ai.studio/build",
              "X-Title": "Solvexa App"
            },
            body: JSON.stringify({
              model: "openai/gpt-oss-120b:free",
              messages: messagesData,
              stream: true
            })
          });

          if (!response.ok) {
            console.warn("Primary OpenRouter model failed, trying Llama...");
            response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${openRouterKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://ai.studio/build",
                "X-Title": "Solvexa App"
              },
              body: JSON.stringify({
                model: "meta-llama/llama-3.3-70b-instruct:free",
                messages: messagesData,
                stream: true
              })
            });
          }

          if (!response.ok) {
            console.warn("Secondary OpenRouter model failed, trying Gemini-Lite...");
            response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${openRouterKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://ai.studio/build",
                "X-Title": "Solvexa App"
              },
              body: JSON.stringify({
                model: "google/gemini-2.0-flash-lite-preview-02-05:free",
                messages: messagesData,
                stream: true
              })
            });
          }

          if (response.ok && response.body) {
            openRouterSuccess = true;
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            let buffer = '';
            let isFirstReasoning = true;
            let hasEndedReasoning = false;

            for await (const chunk of asyncIterableFromReader(reader)) {
               buffer += decoder.decode(chunk, { stream: true });
               const lines = buffer.split('\n');
               buffer = lines.pop() || '';
               
               for (const line of lines) {
                 if (line.trim() === '') continue;
                 if (line.trim() === 'data: [DONE]') {
                   if (!isFirstReasoning && !hasEndedReasoning) {
                     res.write(`data: ${JSON.stringify({ text: "\n</think>\n" })}\n\n`);
                     hasEndedReasoning = true;
                   }
                   continue;
                 }
                 if (line.startsWith('data: ')) {
                   try {
                     const data = JSON.parse(line.slice(6));
                     if (data.choices && data.choices.length > 0) {
                       const delta = data.choices[0].delta;
                       if (delta) {
                         let outText = '';
                         if (delta.reasoning) {
                           if (isFirstReasoning) {
                             outText += '<think>\n';
                             isFirstReasoning = false;
                           }
                           outText += delta.reasoning;
                         }
                         if (delta.content !== undefined && delta.content !== null) {
                           if (!isFirstReasoning && !hasEndedReasoning) {
                             outText += '\n</think>\n';
                             hasEndedReasoning = true;
                           }
                           outText += delta.content;
                         }
                         if (outText) {
                           res.write(`data: ${JSON.stringify({ text: outText })}\n\n`);
                         }
                       }
                     }
                   } catch (e) {
                     console.error("Error parsing stream chunk:", line, e);
                   }
                 }
               }
            }
          }
        } catch (orError) {
          console.error("OpenRouter completely failed or threw error:", orError);
        }
      }

      if (!openRouterSuccess) {
        console.log("Using primary Google Gen AI fallback model...");
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error("GEMINI_API_KEY is not configured.");
        }

        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const contents: any[] = [];
        if (images && images.length > 0) {
          images.forEach((img: string) => {
            const match = img.match(/^data:(.*?);base64,(.*)$/);
            if (match) {
              contents.push({
                inlineData: {
                  mimeType: match[1],
                  data: match[2]
                }
              });
            }
          });
        }
        if (prompt) {
          contents.push(prompt);
        }

        const responseStream = await ai.models.generateContentStream({
          model: "gemini-2.5-flash",
          contents: contents,
          config: {
            systemInstruction: `You are Solvexa, a powerful, highly intelligent AI. You MUST ALWAYS output your detailed internal reasoning wrapped in <think> and </think> tags before providing your final answer to the user. Do not use JSON. Your final answer should be well formatted. IMPORTANT: You must think and answer in ${langName}. If the user asks you to write code or run HTML, you should output complete, standalone HTML inside \`\`\`html ... \`\`\` blocks, and the frontend will allow the user to run it.`,
          },
        });

        for await (const chunk of responseStream) {
          if (chunk.text) {
            res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
          }
        }
      }

      const endTime = Date.now();
      const timeTakenMs = endTime - startTime;

      res.write(`data: ${JSON.stringify({ done: true, timeTakenMs })}\n\n`);
      res.end();

    } catch (error: any) {
      console.error("Chat error:", error);
      res.write(`data: ${JSON.stringify({ error: error.message || "An error occurred" })}\n\n`);
      res.end();
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // For Express v4, it is app.get('*', ...)
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
