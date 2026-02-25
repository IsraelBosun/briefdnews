import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

export async function processArticle(title, content) {
  const prompt = `
You are a news editor for Lumi, an app that makes news easy and engaging.
Given the article below, return a JSON object with these exact fields:

{
  "summary": "2 sentences max. Plain language. What happened and why it matters.",
  "simplifiedBody": "A 60-second read version. 150-200 words. Conversational tone. No jargon. Use short paragraphs.",
  "deepDive": "100-150 words of background context. Why does this situation exist? What history led to this?",
  "whyItMatters": "One sentence. Complete this: 'This matters because...'",
  "rabbitHole": "Ask one thought-provoking follow-up question, then answer it in 80 words.",
  "topicTags": ["array", "of", "relevant", "topic", "slugs", "from: nigeria, africa, world, politics, business, technology, startups, finance, sports, entertainment, culture, health, science, environment, education, crime"],
  "entities": ["array", "of", "people", "organisations", "and", "places", "mentioned"],
  "weightScore": 0.0
}

weightScore rules: 0.9-1.0 = breaking/major national or global story. 0.6-0.8 = significant story. 0.3-0.5 = general interest. 0.1-0.2 = minor/niche.

Article Title: ${title}
Article Content: ${content.slice(0, 3000)}

Return ONLY the JSON object. No markdown, no explanation.
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error(`Gemini processing failed for "${title}":`, error);
    throw error;
  }
}

export async function rewriteInTone(content, tone) {
  const toneInstructions = {
    FORMAL: "Rewrite this in a formal, professional journalistic tone.",
    CONVERSATIONAL: "Rewrite this in a clear, conversational tone suitable for a general audience.",
    LIKE_A_FRIEND: "Rewrite this as if you're a knowledgeable friend texting another friend about what happened. Casual, warm, no jargon. Use contractions.",
  };

  const prompt = `${toneInstructions[tone]}
Keep all facts intact. Do not add or remove information.
Article: ${content}`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error(`Gemini tone rewrite failed:`, error);
    throw error;
  }
}

export async function generateWhyItMattersForUser(articleSummary, userTopics) {
  const prompt = `
Given this news summary and the user's interest topics, write ONE sentence explaining
why this story is personally relevant to someone interested in: ${userTopics.join(", ")}.
Start with "For you, this matters because..."

Summary: ${articleSummary}
Return only the sentence.
`;
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error(`Gemini why-it-matters generation failed:`, error);
    throw error;
  }
}
