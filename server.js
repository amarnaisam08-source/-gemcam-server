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

      // Temporary server overload / unavailable error
      if (
        errorText.includes("503") ||
        errorText.includes("UNAVAILABLE") ||
        errorText.includes("high demand")
      ) {
        if (attempt < maxRetries) {
          const waitTime = attempt * 5000;

          console.log(
            `Gemini temporarily unavailable. Waiting ${waitTime / 1000} seconds...`
          );

          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }

      throw error;
    }
  }

  throw lastError;
}
