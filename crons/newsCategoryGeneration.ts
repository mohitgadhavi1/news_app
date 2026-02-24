
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { Category } from './types.js';

dotenv.config();


export const classifyNewsText = async (text: string): Promise<ClassificationResponse> => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Categorize this news item: "${text}"`,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        categoryName: {
                            type: Type.STRING,
                            description: "The name of the category from the provided list.",
                        },
                        confidence: {
                            type: Type.NUMBER,
                            description: "Confidence level of classification (0.0 to 1.0).",
                        },
                        reasoning: {
                            type: Type.STRING,
                            description: "Short explanation for the choice.",
                        },
                    },
                    required: ["categoryName", "confidence", "reasoning"],
                },
            },
        });

        if (!response.text) {
            throw new Error("No response text from AI model.");
        }
        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr) as ClassificationResponse;
    } catch (error) {
        console.error("Classification error:", error);
        throw new Error("Failed to classify news text.");
    }
};


export const CATEGORIES: Category[] = [
    {
        name: "AI & Machine Learning",
        desc: "AI research updates, enterprise AI solutions, generative AI advancements, and AI ethics/policy.",
        icon: "fa-solid fa-brain",
        color: "bg-purple-100 text-purple-700 border-purple-200"
    },
    {
        name: "Startups & Venture Capital",
        desc: "Founding stories, funding rounds, IPOs, and tech ecosystem growth (including Indian startups).",
        icon: "fa-solid fa-rocket",
        color: "bg-emerald-100 text-emerald-700 border-emerald-200"
    },
    {
        name: "Software Engineering & Architecture",
        desc: "Backend architecture, DevOps, cloud engineering, system design, and developer productivity tools.",
        icon: "fa-solid fa-code",
        color: "bg-blue-100 text-blue-700 border-blue-200"
    },
    {
        name: "Cybersecurity & Deep Tech",
        desc: "Security threats, encryption, vulnerability research, and deep technical hardware/software analysis.",
        icon: "fa-solid fa-shield-halved",
        color: "bg-slate-100 text-slate-700 border-slate-200"
    },
    {
        name: "Consumer Technology & Gadgets",
        desc: "Product launches, smartphone reviews, consumer electronics, and latest personal tech trends.",
        icon: "fa-solid fa-laptop",
        color: "bg-amber-100 text-amber-700 border-amber-200"
    },
    {
        name: "Big Tech & Digital Policy",
        desc: "Regulatory updates, antitrust investigations, tech law, and significant moves by major tech giants.",
        icon: "fa-solid fa-building-columns",
        color: "bg-indigo-100 text-indigo-700 border-indigo-200"
    },
    {
        name: "Developer Community & Open Source",
        desc: "Open-source trends, GitHub repository momentum, developer sentiment, and community discussions.",
        icon: "fa-solid fa-users-gear",
        color: "bg-cyan-100 text-cyan-700 border-cyan-200"
    },
    {
        name: "Digital Culture & Society",
        desc: "The intersection of technology and culture, long-form stories, and the ethical impact of tech on society.",
        icon: "fa-solid fa-landmark",
        color: "bg-rose-100 text-rose-700 border-rose-200"
    },
];

export const SYSTEM_INSTRUCTION = `You are a world-class news editor and classifier. 
Your job is to read news snippets and categorize them accurately into ONE of the provided categories.
Definitions:
${CATEGORIES.map(c => `- ${c.name}: ${c.desc}`).join('\n')}

Rules:
1. Choose exactly one category that fits best.
2. Provide a confidence score between 0 and 1.
3. Provide a brief reasoning (max 1 sentence) why you chose this category.
4. If a snippet is vague, choose the most likely category based on keywords.`;

export interface NewsItem {
    id: string;
    text: string;
    categoryName?: string;
    confidence?: number;
    reasoning?: string;
    status: 'idle' | 'processing' | 'completed' | 'error';
}

export interface ClassificationResponse {
    categoryName: string;
    confidence: number;
    reasoning: string;
}

