import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini client using the key from your .env.local file
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Define the exact structure so Gemini knows EXACTLY what JSON to return
const invoiceSchema = {
  type: "OBJECT",
  properties: {
    clientName: {
      type: "STRING",
      description: "The name of the client or company being billed.",
    },
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          description: { type: "STRING" },
          quantity: { type: "NUMBER" },
          price: { type: "NUMBER" },
        },
        required: ["description", "quantity", "price"],
      },
    },
    taxRate: {
      type: "NUMBER",
      description: "Tax rate as a decimal (e.g., 0.10 for 10%). Default to 0 if not mentioned.",
    },
    totalAmount: {
      type: "NUMBER",
      description: "The final total amount of the invoice.",
    },
  },
  required: ["clientName", "items", "totalAmount"],
};

export async function POST(req) {
  try {
    // 1. Get the text the user typed in the frontend
    const { prompt } = await req.json();

    if (!prompt) {
      return Response.json({ error: "Please provide invoice details." }, { status: 400 });
    }

    // 2. Send the unstructured prompt to Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert billing assistant. Extract the invoice details from this text: "${prompt}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: invoiceSchema,
      }
    });

    // 3. Parse Gemini's perfect JSON response
    const invoiceData = JSON.parse(response.text);
    
    // 4. Send the data back to the frontend
    return Response.json(invoiceData, { status: 200 });

  } catch (error) {
    console.error("AI Error:", error);
    return Response.json({ error: "Failed to generate invoice" }, { status: 500 });
  }
}