require('dotenv').config();

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Groq } = require('groq-sdk');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callModel(selectModel, systemPrompt, prompt, messages) {
  let result;
  switch(selectModel) {
    case 'gemini-1.5-flash-002':
    case 'gemini-1.5-pro-002':
      console.log(selectModel);
      const model = genAI.getGenerativeModel({ 
        model: `${selectModel}`,
        systemInstruction: {
          parts: [{ text: `${systemPrompt}` }],
        },
      });
      const geminiResponse = await model.generateContent(prompt);
      result = geminiResponse.response.text();
      break;
    case 'mixtral-8x7b-32768':
    case 'llama3-8b-8192':
    case 'gemma2-9b-it':
    case 'llama-3.2-3b-preview':
      console.log(selectModel);
      const MixtralResponse = await groq.chat.completions.create({
        model: `${selectModel}`, 
        messages: messages,
      });
      result = MixtralResponse.choices[0].message.content;
      break;
  }
  return result;
}

module.exports = { callModel };
