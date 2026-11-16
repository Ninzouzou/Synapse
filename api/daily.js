import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `synapse_${today}`;

    try {
        const cachedData = await kv.get(cacheKey);
        if (cachedData) return res.status(200).json(cachedData);

        // Appel à l'API gratuite Gemini (Google AI Studio)
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        const prompt = `[COLLE LE SUPER PROMPT JSON ICI]`;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        const data = await response.json();
        const dailyContent = JSON.parse(data.candidates[0].content.parts[0].text);

        await kv.set(cacheKey, dailyContent, { ex: 86400 });
        return res.status(200).json(dailyContent);
    } catch (error) {
        return res.status(500).json({ error: "Erreur génération" });
    }
}