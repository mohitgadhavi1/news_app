
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Category } from './types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ERROR_LOG_PATH = path.join(__dirname, 'category-errors.log');

const MONGODB_URI = process.env.MONGODB_URI;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!MONGODB_URI) {
    console.error('❌ Missing MONGODB_URI env variable');
    process.exit(1);
}

function logError(message: string, error: any) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}: ${JSON.stringify(error)}\n`;
    fs.appendFileSync(ERROR_LOG_PATH, logMessage);
    console.error(`❌ ${message}`, error);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export const classifyNewsText = async (text: string): Promise<ClassificationResponse> => {
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
        throw error;
    }
};

export async function processUncategorizedNews() {
    const client = new MongoClient(MONGODB_URI as string);
    try {
        await client.connect();
        const db = client.db('news');
        const collection = db.collection('external_news');

        // RPM = 5, RPD = 20
        // Check daily limit: articles updated today with category
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const processedTodayCount = await collection.countDocuments({
            'category.categoryName': { $exists: true },
            updatedAt: { $gte: todayStart }
        });

        if (processedTodayCount >= 20) {
            console.log('🛑 Daily limit (20) reached for category generation.');
            return;
        }

        const remainingToday = 20 - processedTodayCount;
        const processingLimit = Math.min(5, remainingToday); // RPM limit is 5

        console.log(`🤖 Processing up to ${processingLimit} uncategorized articles (Remaining today: ${remainingToday})...`);

        const uncategorized = await collection.find({
            category: { $exists: false }
        }).limit(processingLimit).toArray();

        for (const article of uncategorized) {
            try {
                const textToClassify = (article.title || '') + ' ' + (article.content || '');
                const result = await classifyNewsText(textToClassify);

                const categoryInfo = CATEGORIES.find(c => c.name === result.categoryName);

                await collection.updateOne(
                    { _id: article._id },
                    {
                        $set: {
                            category: categoryInfo ? {
                                ...categoryInfo,
                                categoryName: result.categoryName,
                                confidence: result.confidence,
                                reasoning: result.reasoning,
                            } : {
                                categoryName: result.categoryName,
                                confidence: result.confidence,
                                reasoning: result.reasoning,
                            },
                            updatedAt: new Date()
                        }
                    }
                );
                console.log(`✅ Categorized: ${article.title?.substring(0, 50)}... -> ${result.categoryName}`);

                // RPM safety: sleep for a bit if we have more to do
                if (uncategorized.indexOf(article) < uncategorized.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 12000)); // 12 seconds * 5 = 60 seconds (1 minute)
                }
            } catch (err) {
                logError(`Failed to categorize article ${article.articleId}`, err);
            }
        }
    } catch (err) {
        logError('Error in processUncategorizedNews', err);
    } finally {
        await client.close();
    }
}

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

export interface ClassificationResponse {
    categoryName: string;
    confidence: number;
    reasoning: string;
}


