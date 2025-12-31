const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 👇 [디버깅 로그 추가]
console.log("--------------------------------------");
console.log("🔥 Gemini Key Loaded:", process.env.GEMINI_API_KEY ? "YES" : "NO");
console.log("🔥 Key Length:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
console.log("🔥 First 4 chars:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 4) : "NONE");
console.log("--------------------------------------");

// 키가 없으면 바로 에러 처리 (서버 죽음 방지)
if (!process.env.GEMINI_API_KEY) {
    console.error("❌ CRITICAL ERROR: GEMINI_API_KEY is missing in .env");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/generate-cover', async (req, res) => {
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const promptRequest = `
                You are an elite album cover designer.
                Create a potent ENGLISH prompt for an AI image generator based on the playlist title: "${title}".

                Directives:
                - Analyze the title's implied genre and emotion, translating them into visual metaphors, lighting, and color palettes.
                - Style: Cinematic, atmospheric, highly detailed, photographic or textured illustration. Avoid generic "digital art".
                - Composition: Balanced square composition with a strong central focus.
                - Constraint: ABSOLUTELY NO TEXT or letters on the image.
                - Length: Under 50 words, comma-separated keywords.
                - Output: JUST the prompt string.
        `;

        const result = await model.generateContent(promptRequest);
        const generatedPrompt = result.response.text().trim();

        console.log(`🤖 Gemini Prompt: ${generatedPrompt}`);

        // 3. Pollinations AI 이미지 생성 URL 조합
        const randomSeed = Math.floor(Math.random() * 10000);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(generatedPrompt)}?seed=${randomSeed}&width=1024&height=1024&nologo=true&model=flux`;

        res.json({ imageUrl });

    } catch (error) {
        console.error('Gemini Error:', error);
        res.status(500).json({ error: 'Image generation failed' });
    }
});

module.exports = router;