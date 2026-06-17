import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

// FIX IS HERE: We added ": Request" so TypeScript knows what "req" is!
export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return Response.json({ error: "Please provide invoice details." }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert billing assistant. Extract the invoice details from this text: "${prompt}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: invoiceSchema,
      }
    });

    const invoiceData = JSON.parse(response.text);
    
    return Response.json(invoiceData, { status: 200 });

  } catch (error) {
    console.error("AI Error:", error);
    return Response.json({ error: "Failed to generate invoice" }, { status: 500 });
  }
}