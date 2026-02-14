
import { GoogleGenAI, Type } from "@google/genai";

// Always use the API key directly from process.env.API_KEY as per guidelines
// Creating a new instance right before each call as per updated guidelines

export const getSpendingInsights = async (transactions: any[]) => {
  // Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze these transactions and provide a "Spend Personality" and one "Alpha Tip". Transactions: ${JSON.stringify(transactions)}`,
      config: {
        systemInstruction: "You are FlowMint AI, a witty financial genius for Indian Millennials. You use Gen-Z lingo (no cap, bet, flex) but provide serious financial wisdom. Be brief. Maximum 2 sentences.",
      },
    });
    // Access response.text property directly as per guidelines
    return response.text || "Your spending is mid. Let's aim for 'Elite' status next month.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Analyzing your flow... Keep building that credit score!";
  }
};

export const getWishTrackerPlan = async (goal: string, amount: number, currentSavings: number) => {
  // Create a new GoogleGenAI instance right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `I want to buy '${goal}' costing ₹${amount}. I have ₹${currentSavings} saved. Create a 3-step saving plan for an Indian millennial earning ₹60k/month.`,
      config: {
        systemInstruction: "You are the FlowMint AI Wish Specialist. You help users turn dreams into reality with disciplined saving hacks.",
        thinkingConfig: { thinkingBudget: 2000 }
      },
    });
    // Access response.text property directly as per guidelines
    return response.text || "Step 1: Save 5k/month in a liquid fund. Step 2: Cut Zomato. Step 3: Win.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Start by automating ₹2,000 every week into your goal pot.";
  }
};
