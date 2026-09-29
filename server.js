import express from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const ai = new GoogleGenAI();

async function askGeminiWithRetry(contents, maxRetries = 4) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Gemini attempt ${attempt}/${maxRetries}`);

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: contents
      });

      return response;

    } catch (error) {
      lastError = error;
      const errorText = String(error);

      console.error(`Gemini attempt ${attempt} failed:`);
      console.error(errorText);

      if (
        errorText.includes("503") ||
        errorText.includes("UNAVAILABLE") ||
        errorText.includes("high demand")
      ) {
        if (attempt < maxRetries) {
          const waitTime = attempt * 5000;
          console.log(`Gemini temporarily unavailable. Waiting ${waitTime / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }

      throw error;
    }
  }

  throw lastError;
}

app.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype || "image/jpeg"
      }
    };

    const prompt = "Describe what you see in this image in 2 short lines for an OLED display.";

    const geminiResponse = await askGeminiWithRetry([prompt, imagePart]);
    const analysis = geminiResponse.text;

    res.json({ result: analysis });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
