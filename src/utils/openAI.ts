import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from '@google/genai'

const apiKey = (import.meta.env.GEMINI_API_KEY)
const apiBaseUrl = (import.meta.env.API_BASE_URL)?.trim().replace(/\/$/, '')
const modelName = (import.meta.env.GEMINI_MODEL_NAME) || 'gemini-3.6-flash'

const genAI = new GoogleGenAI({
  apiKey,
  httpOptions: apiBaseUrl ? { baseUrl: apiBaseUrl } : undefined,
})

export const startChatAndSendMessageStream = async(history: ChatMessage[], newMessage: string) => {
  const chat = genAI.chats.create({
    model: modelName,
    history: history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.parts.map(part => part.text).join('') }],
    })),
    config: {
      maxOutputTokens: 8000,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    },
  })

  const result = await chat.sendMessageStream({ message: newMessage })

  const encodedStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      for await (const chunk of result) {
        const text = chunk.text ?? ''
        const encoded = encoder.encode(text)
        controller.enqueue(encoded)
      }
      controller.close()
    },
  })

  return encodedStream
}
