
import { GoogleGenAI, Type } from "@google/genai";
import { MODEL_NAME } from "../constants";
import { AIParseResult } from "../types";

export const parseOrderText = async (text: string): Promise<AIParseResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are a cashier assistant. Extract receipt details from the text below.
    
    1. Extract restaurant details (name, address lines, phone).
    2. Extract the transaction date and convert it to ISO 8601 format. 
       - NOTE: The input date format is likely DD/MM/YYYY (e.g., 04/09/2025 is September 4th).
    3. Extract order items (qty, name, price). 
       - Interpret prices like "44.000" or "15.000" as numbers 44000 and 15000 (dot is a thousand separator).
    4. Extract the total payment amount (Bayar).
    5. Extract the table number (Meja) if present.
    6. Extract the cashier name (Kasir) if present.

    Text to parse: "${text}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful assistant that parses restaurant receipts into structured JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            config: {
              type: Type.OBJECT,
              properties: {
                restaurantName: { type: Type.STRING, nullable: true },
                addressLine1: { type: Type.STRING, nullable: true },
                addressLine2: { type: Type.STRING, nullable: true },
                phone: { type: Type.STRING, nullable: true },
                footer1: { type: Type.STRING, nullable: true },
                footer2: { type: Type.STRING, nullable: true },
                tableNumber: { type: Type.STRING, nullable: true },
                cashierName: { type: Type.STRING, nullable: true },
              },
              nullable: true
            },
            date: { type: Type.STRING, description: "ISO 8601 Date String", nullable: true },
            paymentAmount: { type: Type.NUMBER, nullable: true },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  qty: { type: Type.NUMBER, description: "Quantity" },
                  name: { type: Type.STRING, description: "Item Name" },
                  price: { type: Type.NUMBER, description: "Unit Price" }
                },
                required: ["qty", "name", "price"]
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIParseResult;
    }
    throw new Error("No response text generated");
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    throw error;
  }
};
