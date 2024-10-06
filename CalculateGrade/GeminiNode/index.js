const express = require("express");
const multer = require('multer');
const { GoogleAuth } = require('google-auth-library');
const { GoogleGenerativeAI ,HarmCategory, HarmBlockThreshold   } = require("@google/generative-ai");
const { GoogleAIFileManager, FileState } = require('@google/generative-ai/server'); // Assuming correct path
const mammoth = require('mammoth');
const Fs = require('fs');
const fs = require('node:fs/promises');
const {OpenAI}  = require ('openai');
const {Groq} = require('groq-sdk');
const app = express();
//const generateContent = require("./routes/gemini.js");
app.use(express.json()); // Add this line to parse JSON in request body
app.use(express.urlencoded({ extended: true })); //
app.get("/",(req,res)=>{
    res.send("Hello world");
});
const upload = multer({ dest: 'uploads/' });
// Replace with the name of your Gemini model
const modelName = 'models/gemini-pro';
// Generation and safety settings (adjust as needed)
const generationConfig = {
  temperature: 0.9,
  topK: 1,
  topP: 1,
  maxOutputTokens: 2048,
};
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE},
   {category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
   {category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];
const genAI = new GoogleGenerativeAI('AIzaSyCYBVJhr3x1oZMOmdcMa_WvDNbst76n5MU');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const openai = new OpenAI({apiKey: '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'});
const groq = new Groq({ apiKey: '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' });
let chatHistory = [];
app.post('/upload', upload.array('bookFile', 5), async (req, res) => {
  const pdfFilePath = req.file.path;
  const prompt = req.body.prompt; 
  console.log(pdfFilePath);
  console.log(prompt);
  try {
    const fileManager = new GoogleAIFileManager('AIzaSyCYBVJhr3x1oZMOmdcMa_WvDNbst76n5MU');

    const uploadResult = await fileManager.uploadFile(
        pdfFilePath,
    {
        mimeType: 'application/pdf',
        displayName: req.file.filename,
    },
    );
    console.log(uploadResult.file.uri);
    const result = await model.generateContentStream([
    prompt,
    {
        fileData: {
        fileUri: uploadResult.file.uri,
        mimeType: uploadResult.file.mimeType,
        },
    },
    ],
    {
      safetySettings: safetySettings,
    });
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // Send chunks of the summary as they become available
    let content = '';
    for await (const chunk of result.stream) {
      if (chunk.text()) {
        content += chunk.candidates[0].content.parts[0].text;
        res.write(chunk.candidates[0].content.parts[0].text);
      }
    }

    // Close the connection when the stream is finished
    res.end();
    chatHistory.push({ role: 'user', parts: [{
      fileData: {
      fileUri: uploadResult.file.uri,
      mimeType: uploadResult.file.mimeType,
      },
      }], 
    });
  chatHistory.push({role: 'user', parts: [{text: prompt}]});
  chatHistory.push({role: 'model', parts: [{text: content}]});
    // res.json({ message: 'PDF processed successfully',  bookSummary});

  } catch (error) {
    console.error('Error processing PDF:', error);
    //res.status(500).json({ error: 'Failed to process PDF' });
  } finally {
    // Delete the uploaded file after processing
    fs.unlink(pdfFilePath);
  }
});

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;
  console.log(userMessage);
  console.log()
  
  try {
    // Start a new chat or continue an existing one
    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: chatHistory, // Pass the chat history as context
    });

    //Add the user's message and get the bot's response
    const { response } = await chat.sendMessage(userMessage);
    console.log(response.candidates[0].content.parts[0]);
    //Update the chat history
    chatHistory.push({ role: 'user', parts: [{text: userMessage}] });
    chatHistory.push({ role: 'model', parts: [{text: response.candidates[0].content.parts[0].text}] });
    
    res.json(response.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error('Error generating chatbot response:', error);
    res.status(500).json({ error: 'Failed to generate chatbot response' });
  }
});
app.listen(3001,()=>{
    console.log("App is running on port 3001");
});
app.post('/api/GPTgrade', upload.single('submission'), async (req, res) => {
  try {
    const { requirement } = req.body;
    const submissionFile = req.file;

    const submissionContent = extractContent(submissionFile.path);

    // Tạo messages cho ChatGPT
    const messages = [
      { role: "system", content: "Bạn là một giáo viên dạy Python đang chấm điểm bài tập. Hãy đưa ra đánh giá chi tiết và công bằng." },
      { role: "user", content: `## Yêu cầu đề bài:\n${requirement}\n## Bài làm của học viên:\n${submissionContent}\n## Đánh giá bài làm (điểm số /10 và nhận xét chi tiết):` }
    ];

    // Gọi OpenAI API để lấy kết quả từ ChatGPT
    const response = await groq.chat.completions.create({
      model: "mixtral-8x7b-32768", 
      messages: messages,
      // (Optional) Thêm các tham số khác nếu cần 
      // Ví dụ: temperature, top_p, max_tokens, ...
    });

    const evaluation = response.choices[0].message.content;
    console.log(evaluation);
    // Xử lý kết quả từ ChatGPT, có thể lưu vào cơ sở dữ liệu
    // ...

    res.json({ success: true, evaluation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi trong quá trình chấm điểm.' });
  }
  finally {
    // Delete the uploaded file after processing
    fs.unlink(req.file.path);
  }
});

// Hàm hỗ trợ trích xuất nội dung từ file .ipynb
function extractContent(filePath) {
  const fileContent = JSON.parse(Fs.readFileSync(filePath, 'utf8'));
  let content = '';
  fileContent.cells.forEach(cell => {
    content += cell.source.join('') + '\n';
  });
  return content;
}

app.post('/evaluate', upload.fields([{ name: 'pdfFile' }, { name: 'submission', maxCount: 5 }]), async (req, res) => {
  try {
    var pdfContent = (await mammoth.extractRawText({ path: req.files.pdfFile[0].path })).value;
    const model1 = req.body.model1;
    const model2 = req.body.model2;
    const submissionFiles = req.files['submission'];
    let submissionContent = '';
    if (submissionFiles) {
      for (const file of submissionFiles) {
        // Sử dụng fs.readFile để đọc nội dung file
        const fileData = extractContent(file.path); 
        submissionContent += fileData + '\n';
      }
    }
    const systemPrompt ='Bạn là một giáo viên Python có kinh nghiệm.'
    const prompt = `## Yêu cầu đề bài:
    ${pdfContent}
    
    ## Bài làm của học viên:
    ${submissionContent}

    ## đề bài có tổng điểm đúng bằng 10 hay không?
    ## Đánh giá bài làm so với yêu cầu đề (điểm số và nhận xét chi tiết):`;
    //console.log(prompt);
    const messages = [
      { role: "system", content: `${systemPrompt}` },
      { role: "user", content: prompt}
    ];
    var evaluation = await callModel(model1, systemPrompt, prompt, messages);
    var evaluationMixtral = await callModel(model2, systemPrompt, prompt, messages);
    res.json({ success: true, evaluation,  evaluationMixtral});
  } catch (error) {
    // ... (Handle errors) ...
    console.error(error);
    res.status(500).json({ error: 'Lỗi trong quá trình chấm điểm.' });
  } finally {
    // ... (Delete uploaded files) ...
    //fs.unlink(req.file.path);
  }
});

// API kiểm tra độ khớp syllabus
app.post('/check-relevance', upload.single('pdfFile'), async (req, res) => {
  try {
      const syllabusContent = req.body.syllabus; // Lấy syllabus từ body
      const model1 = req.body.model1;
      const model2 = req.body.model2;
      var pdfContent = (await mammoth.extractRawText({ path: req.file.path })).value;
      const systemPrompt ='Bạn là một giáo viên Python có kinh nghiệm.'
      const prompt = `## Yêu cầu đề bài:
      ${pdfContent}
      
      ## Syllabus:
      ${syllabusContent}

      ##Đề bài có khớp với syllabus hay không? Trả lời "Có" hoặc "Không" và giải thích lý do.`;
      const messages = [
        { role: "system", content: `${systemPrompt}` },
        { role: "user", content: prompt}
      ];
      var syllabusCheckResult = await callModel(model1, systemPrompt, prompt, messages);
      var syllabusMixtral = await callModel(model2, systemPrompt, prompt, messages);
      res.json({ success: true, syllabusCheckResult, syllabusMixtral });

    } 
    catch (error) {
      console.log(error);
      res.status(500).json({ success: false, error: error.message });
    }
    finally {
      // ... (Delete uploaded files) ...
      fs.unlink(req.file.path);
    }
});

app.post('/summarize', upload.single('syllabus'), async (req, res) => {
  try {
        const selectModel = req.body.model; // Lấy model từ body
        console.log(selectModel);
        var content = (await mammoth.extractRawText({ path: req.file.path })).value;
        const systemPrompt ='Bạn là một chuyên gia soạn thảo văn bản, có khả năng tóm tắt và trích xuất từ khóa trong văn bản'
        const prompt = `## Đây là nội dung khóa học:
        ${content}

        ## Tôi đang gặp một số khó khăn về vấn đề tóm tắt và trích xuất từ khóa từ nội dung khóa học. Bạn hãy giúp tôi tóm tắt và trích xuất từ khóa của nội dung khóa học, nội dung tóm tắt và từ khóa được trích xuất đều bằng tiếng Việt`;
        const messages = [
          { role: "system", content: `${systemPrompt}` },
          { role: "user", content: prompt}
        ];
        var result = await callModel(selectModel, systemPrompt, prompt, messages);
        console.log(result);
        res.json({ success: true, result });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
    }
    finally {
      // ... (Delete uploaded files) ...
        fs.unlink(req.file.path);
    }
});


async function callModel(selectModel, systemPrompt, prompt, messages){
  var result;
        switch(selectModel){
          case 'gemini-1.5-flash':
          case 'gemini-1.5-pro':
            ///Call Google AI studio
            console.log(selectModel);
            const model = genAI.getGenerativeModel({ model: `${selectModel}` , systemInstruction: {
              parts: [
                {text: `${systemPrompt}`},     
              ],
            },});
            const geminiResponse = await model.generateContent(
              prompt);

            result= geminiResponse.response.text();
            break;
          case 'mixtral-8x7b-32768':
          case 'llama3-8b-8192':
          case 'gemma2-9b-it':
            ///
            console.log(selectModel);
            const MixtralResponse = await groq.chat.completions.create({
              model: `${selectModel}`, 
              messages: messages,
              // (Optional) Thêm các tham số khác nếu cần 
              // Ví dụ: temperature, top_p, max_tokens, ...
            });
            result = MixtralResponse.choices[0].message.content;
            break;
        }
      console.log(result);
      return result;
}