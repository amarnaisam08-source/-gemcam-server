import express from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const ai = new GoogleGenAI();

app.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype || "image/jpeg"
      },
    };

    const response = async (prompt) => {
      const result = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [prompt, imagePart],
      });
      return result.text;
    };

    const analysis = await response("Describe what you see in this image in 2 short lines for an OLED display.");
    res.json({ result: analysis });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
