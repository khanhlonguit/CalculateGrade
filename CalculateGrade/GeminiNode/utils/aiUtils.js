require('dotenv').config();

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Groq } = require('groq-sdk');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callModel(selectModel, systemPrompt, prompt, messages) {
  let result;
  
  // Kiểm tra nếu model có chứa chữ "gemini" (không phân biệt hoa thường)
  if (selectModel.toLowerCase().includes('gemini')) {
    console.log(`Sử dụng GoogleGenerativeAI cho model: ${selectModel}`);
    const model = genAI.getGenerativeModel({ 
      model: `${selectModel}`,
      systemInstruction: {
        parts: [{ text: `${systemPrompt}` }],
      },
    });
    const geminiResponse = await model.generateContent(prompt);
    result = geminiResponse.response.text();
  } else {
    // Tất cả các model khác sẽ sử dụng Groq
    console.log(`Sử dụng Groq cho model: ${selectModel}`);
    const groqResponse = await groq.chat.completions.create({
      model: `${selectModel}`, 
      messages: messages,
    });
    result = groqResponse.choices[0].message.content;
  }
  
  return result;
}

module.exports = { callModel };
