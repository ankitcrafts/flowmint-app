import { llmService } from './llmService';

export const getSpendingInsights = async (
  transactions: Array<{ title: string; amount: number; category: string; type: string }>
) => {
  const response = await llmService.getSpendingInsight({ transactions });
  return `${response.personality}: ${response.tip}`;
};

export const getWishTrackerPlan = async (goal: string, amount: number, currentSavings: number) => {
  const plan = await llmService.getWishPlan({
    wishName: goal,
    price: amount,
    currentSavings,
  });
  return [plan.aiTip, plan.speedUpTip, ...plan.savingSteps].join('\n');
};

/*
Legacy direct Gemini implementation retained for reference only. Do not reactivate:
it exposed a VITE_ API key in the frontend and returned fabricated advice on errors.

import { GoogleGenAI, Type } from "@google/genai";

export const getSpendingInsights = async (transactions: any[]) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze these transactions and provide a "Spend Personality" and one "Alpha Tip". Transactions: ${JSON.stringify(transactions)}`,
      config: {
        systemInstruction: "You are FlowMint AI, a witty financial genius for Indian Millennials. You use Gen-Z lingo (no cap, bet, flex) but provide serious financial wisdom. Be brief. Maximum 2 sentences.",
      },
    });
    return response.text || "Your spending is mid. Let's aim for 'Elite' status next month.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Analyzing your flow... Keep building that credit score!";
  }
};

export const getWishTrackerPlan = async (goal: string, amount: number, currentSavings: number) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `I want to buy '${goal}' costing ₹${amount}. I have ₹${currentSavings} saved. Create a 3-step saving plan for an Indian millennial earning ₹60k/month.`,
      config: {
        systemInstruction: "You are the FlowMint AI Wish Specialist. You help users turn dreams into reality with disciplined saving hacks.",
        thinkingConfig: { thinkingBudget: 2000 }
      },
    });
    return response.text || "Step 1: Save 5k/month in a liquid fund. Step 2: Cut Zomato. Step 3: Win.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Start by automating ₹2,000 every week into your goal pot.";
  }
};
*/
