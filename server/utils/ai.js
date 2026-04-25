const axios = require('axios');
const fs = require('fs');

/**
 * Robust JSON extractor to handle extra text, markdown, or <think> tags
 */
function extractJSON(text) {
  // Remove <think>...</think> blocks (some models emit these)
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  // Remove markdown code fences
  cleaned = cleaned.replace(/```json/gi, '').replace(/```/g, '').trim();
  
  // Find first { and last }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  
  if (start === -1 || end === -1) {
    // Try array
    const arrStart = cleaned.indexOf('[');
    const arrEnd = cleaned.lastIndexOf(']');
    if (arrStart !== -1 && arrEnd !== -1) {
      return JSON.parse(cleaned.slice(arrStart, arrEnd + 1));
    }
    throw new Error('No JSON found in response');
  }
  
  return JSON.parse(cleaned.slice(start, end + 1));
}

/**
 * Reusable AI utility function to generate responses via OpenRouter
 * @param {string} prompt - The prompt to send to the AI
 * @returns {Promise<any>} - The parsed JSON response
 */
const generateAIResponse = async (prompt) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is missing. Please check your .env file.");
    }

    fs.appendFileSync('debug.log', `[AI] Sending request to OpenRouter...\n`);

    const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
      model: "google/gemini-2.0-flash-001",
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }]
    }, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      timeout: 60000 // 60 second timeout
    });

    const rawContent = response.data.choices[0].message.content;
    fs.appendFileSync('debug.log', `[AI] Raw response length: ${rawContent.length}\n`);
    fs.appendFileSync('debug.log', `[AI] Raw first 500 chars: ${rawContent.substring(0, 500)}\n`);
    
    try {
      const parsed = extractJSON(rawContent);
      fs.appendFileSync('debug.log', `[AI] JSON parsed successfully\n`);
      return parsed;
    } catch (e) {
      fs.appendFileSync('debug.log', `[AI] JSON PARSE FAILED: ${e.message}\nRAW: ${rawContent}\n`);
      console.error("JSON PARSE FAILED:", e, "RAW:", rawContent);
      throw new Error("Failed to parse AI JSON response.");
    }
  } catch (error) {
    const errMsg = error.response ? `${error.response.status}: ${JSON.stringify(error.response.data)}` : error.message;
    fs.appendFileSync('debug.log', `[AI] FULL ERROR: ${errMsg}\n`);
    console.error("FULL ERROR:", errMsg);
    throw error;
  }
};

module.exports = { generateAIResponse };
