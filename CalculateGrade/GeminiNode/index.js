const express = require("express");
const multer = require('multer');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');
const { GoogleGenerativeAI ,HarmCategory, HarmBlockThreshold   } = require("@google/generative-ai");
const { GoogleAIFileManager, FileState } = require('@google/generative-ai/server'); // Assuming correct path
const mammoth = require('mammoth');
const Fs = require('fs');
const fs = require('node:fs/promises');
const {Groq} = require('groq-sdk');
const app = express();
var cors = require('cors');
app.use(cors());
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

const groq = new Groq({ apiKey: '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' });

// Hàm hỗ trợ trích xuất nội dung từ file .ipynb
// function extractContent(filePath,type) {
//   try {
//     let content = '';
//     if (type === '.ipynb'){
//         const fileContent = JSON.parse(Fs.readFileSync(filePath, 'utf8'));
//         fileContent.cells.forEach(cell => {
//         content += cell.source.join('') + '\n';
//       });
//     }
//     else{
//       content = Fs.readFileSync(filePath, 'utf8');
//     }
    
//     return content;
//   } catch (error) {
//     console.error(`Lỗi khi xử lý file ${filePath}:`);
//     throw error;
//   }
// }

// app.post('/evaluate', upload.fields([{ name: 'pdfFile' }, { name: 'submission', maxCount: 5 }]), async (req, res) => {
//   try {
//     var pdfContent = (await mammoth.extractRawText({ path: req.files.pdfFile[0].path })).value;
//     const model1 = req.body.model1;
//     const model2 = req.body.model2;
//     const submissionFiles = req.files['submission'];
//     let submissionContent = '';
//     if (submissionFiles) {
//       for (const file of submissionFiles) {
//         // Sử dụng fs.readFile để đọc nội dung file
//         const fileData = extractContent(file.path, path.extname(file.originalname).toLowerCase()); 
//         submissionContent += fileData + '\n';
//       }
//     }
//     console.log(submissionContent);
//     const systemPrompt ='Bạn là một giáo viên dạy lập trình lâu năm có kinh nghiệm, cũng như là chuyên gia chấm bài thi \n\
//                 Vai trò chính của bạn là dựa vào đề thi cũng như bài giải có sẵn, xem bài giải mẫu đó có giải quyết được đề thi hay không và có lời giải nào hay hơn nữa không\n\
//                 Nhiệm vụ là xem bài giải có giải quyết được đề thi cũng như đã tối ưu hay chưa và nếu chưa thì đưa ra lời giải khác hay hơn.\n\
//                 Hướng dẫn quan trọng\n\
//                 Trình bày ngắn gọn và dễ hiểu, hoàn toàn bằng tiếng Việt'

//     const prompt = `## Yêu cầu đề bài:
//     ${pdfContent}
//     #################################################
//     ## Bài làm mẫu:
//     ${submissionContent}

//     Tôi đang gặp vấn đề về duyệt đề và bài làm mẫu, bạn hãy giúp tôi 
//     xem bài giải có sẵn đó giải quyết được bao nhiêu câu trong đề thi, cũng như đã tối ưu hay chưa 
//     và nếu chưa thì đưa ra lời giải khác hay hơn. `;

//     const messages = [
//       { role: "system", content: `${systemPrompt}` },
//       { role: "user", content: prompt}
//     ];
//     var evaluation = await callModel(model1, systemPrompt, prompt, messages);
//     var evaluationMixtral = await callModel(model2, systemPrompt, prompt, messages);
//     res.json({ success: true, evaluation,  evaluationMixtral});
//   } catch (error) {
//     // ... (Handle errors) ...
//     console.error(error);
//     res.status(500).json({ error: 'Lỗi trong quá trình chấm điểm.' });
//   } finally {
//     // ... (Delete uploaded files) ...
//     fs.unlink(req.files.pdfFile[0].path);
//     for(const file of req.files['submission']){
//       fs.unlink(file.path);
//     }
//   }
// });// API kiểm tra độ khớp syllabus
// app.post('/check-relevance', upload.single('pdfFile'), async (req, res) => {
//   try {
//       const syllabusContent = req.body.syllabus; // Lấy syllabus từ body
//       console.log(syllabusContent);
//       const model1 = req.body.model1;
//       const model2 = req.body.model2;
//       var pdfContent = (await mammoth.extractRawText({ path: req.file.path })).value;
//       const systemPrompt ='Bạn là một giáo viên dạy lập trình lâu năm có kinh nghiệm, cũng như là chuyên gia về so sánh đề thi với syllabus của khóa học.\n\
//                     Vai trò chính của bạn là dựa vào Syllabus của môn học, hãy so sánh nội dung các câu của đề thi có nằm trong syllabus và đưa ra lý do.\n\
//                     Nhiệm vụ là so sánh giữa các câu trong đề thi và syllabus, đưa ra kết quả tổng quan giữa độ khớp của đề thi so với Syllabus trên thang điểm 10, chỉ rõ những điểm khớp hoặc không khớp của đề thi so với Syllabus.\n\
//                     Hướng dẫn quan trọng:\n\
//                     Nội dung trả lời không quá 300 chữ, và hoàn toàn bằng tiếng Việt'
//       const prompt = `## Yêu cầu đề bài:
//       ${pdfContent}
      
//       ## Syllabus:
//       ${syllabusContent}

//       ##Tôi đang gặp vấn đề về so sánh giữa nội dung của đề thi với Syllabus. 
//       Bạn hãy giúp tôi đưa ra kết quả so sánh giữa các câu trong đề thi và syllabus,
//        chỉ rõ những điểm khớp hoặc không khớp của đề thì với Syllabus
//        (nếu tôi đính kèm thiếu đề bài hoặc syllabus không đầy đủ thì hãy phản hồi ngay)`;
//       const messages = [
//         { role: "system", content: `${systemPrompt}` },
//         { role: "user", content: prompt}
//       ];
//       var syllabusCheckResult = await callModel(model1, systemPrompt, prompt, messages);
//       var syllabusMixtral = await callModel(model2, systemPrompt, prompt, messages);
//       res.json({ success: true, syllabusCheckResult, syllabusMixtral });

//     } 
//     catch (error) {
//       console.log(error);
//       res.status(500).json({ success: false, error: error.message });
//     }
//     finally {
//       // ... (Delete uploaded files) ...
//       fs.unlink(req.file.path);
//     }
// });
// app.post('/exam-arise', upload.single('examFile'), async (req, res) => {
//   try {
//       const syllabusContent = req.body.syllabus; // Lấy syllabus từ body
//       console.log(syllabusContent);
//       const model1 = req.body.model1;
//       const model2 = req.body.model2;
//       var exam = (await mammoth.extractRawText({ path: req.file.path })).value;
//       const systemPrompt ='Bạn là một giáo viên dạy lập trình lâu năm có kinh nghiệm, đặc biệt là chuyên gia soạn thảo đề thi cho nhiều môn học lập trình.\n\
//                           Vai trò của bạn là dựa vào đề thi mẫu cũng như Syllabus có sẵn, từ đó soạn thảo ra đề thi mới trên thang điểm 10 và có format gần giống như đề thi mẫu và bao hàm hết nội dung của Syllabus.\n\
//                           Nhiệm vụ chính là soạn thảo đề thi mới có format gần giống như đề thi mẫu và có nội dung bao hàm hết nhưng nên tập trung chủ yếu vào nội dung chính của Syllabus có sẵn\n\
//                           nội dung đề thi có độ khó ở mức khó, các bài trong đề thi chỉ dựa theo thang điểm của đề mẫu chứ không phải sao y theo đề mẫu\n\
//                           Hướng dẫn quan trọng\n\
//                           Đề thi có câu chữ dễ hiểu và có ví dụ minh họa thì tốt hơn, chấm trên thang điểm 10 và phải bám sát với syllabus\n\
//                           một câu hỏi có thể kết hợp nhiều nội dung trong Syllabus để tăng độ khó\n\
//                           các câu khó trong bài thi sẽ có điểm số ít hơn những câu dễ \n\
//                           Đề thi hoàn toàn bằng tiếng việt\n\
//                        '
//       const prompt = `## đề thi mẫu:
//       ${exam}
      
//       ## Syllabus:
//       ${syllabusContent}

//       ##Tôi đang gặp vấn đề về soạn thảo đề thi. 
//       Bạn hãy giúp tôi soạn thảo đề thi mới có format gần giống như đề thi mẫu và có nội dung bao hàm hết nhưng nên tập trung chủ yếu vào nội dung chính của Syllabus có sẵn.
//        (nếu tôi đính kèm thiếu đề bài hoặc syllabus không đầy đủ thì hãy phản hồi ngay)`;
//       const messages = [
//         { role: "system", content: `${systemPrompt}` },
//         { role: "user", content: prompt}
//       ];
//       var resultGoogle = await callModel(model1, systemPrompt, prompt, messages);
//       var resultGroq = await callModel(model2, systemPrompt, prompt, messages);
//       res.json({ success: true, resultGoogle, resultGroq });

//     } 
//     catch (error) {
//       console.log(error);
//       res.status(500).json({ success: false, error: error.message });
//     }
//     finally {
//       // ... (Delete uploaded files) ...
//       fs.unlink(req.file.path);
//     }
// });
// app.post('/summarize', upload.single('syllabus'), async (req, res) => {
//   try {
//         const selectModel = req.body.model; // Lấy model từ body
//         console.log(selectModel);
//         var content = (await mammoth.extractRawText({ path: req.file.path })).value;
//         const systemPrompt ='Bạn là một giáo viên lập trình lâu năm có kinh nghiệm, cũng như chuyên gia về rút trích tóm tắt các Syllabus của các khóa học.\n\
//                             Vai trò chính của bạn là dựa trên Syllabus của một môn học, hãy tìm các nội dung chính và phụ, tóm tắt theo nội dung chính lẫn phụ của Syllabus.\n\
//                             Nhiệm vụ là tạo ra bản tóm tắt Syllabus xúc tích, ngắn gọn bao gồm nội dung chính, phụ và liệt kê theo dạng bullet, thường dài từ 400 từ trở xuống\n\
//                             Hướng dẫn quan trọng:\n\
//                             Chú ý đến các nội dung chính, bỏ qua các phần đầu như set up môi trường hay các khái niệm chung về lập trình.\n\
//                             Chỉ từ 5-7 nội dung chính.\n\
//                             2-3 nội dung phụ'
//         const prompt = `## Đây là nội dung khóa học:
//         ${content}
//         ## Tôi đang gặp một số khó khăn về vấn đề tóm tắt nội dung khóa học. 
//         Bạn hãy giúp tôi tóm tắt nội dung khóa học, nội dung tóm tắt đều bằng tiếng Việt
//         (nếu tôi đính kèm thiếu nội dung khóa học hoặc syllabus thì hãy phản hồi ngay)`;
//         const messages = [
//           { role: "system", content: `${systemPrompt}` },
//           { role: "user", content: prompt}
//         ];
//         var result = await callModel(selectModel, systemPrompt, prompt, messages);
//         res.json({ success: true, result });

//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ success: false, error: error.message });
//     }
//     finally {
//       // ... (Delete uploaded files) ...
//         fs.unlink(req.file.path);
//     }
// });
// async function callModel(selectModel, systemPrompt, prompt, messages){
//   var result;
//         switch(selectModel){
//           case 'gemini-1.5-flash-002':
//           case 'gemini-1.5-pro-002':
//             ///Call Google AI studio
//             console.log(selectModel);
//             const model = genAI.getGenerativeModel({ model: `${selectModel}` , systemInstruction: {
//               parts: [
//                 {text: `${systemPrompt}`},     
//               ],
//             },});
//             const geminiResponse = await model.generateContent(
//               prompt);

//             result= geminiResponse.response.text();
//             break;
//           case 'mixtral-8x7b-32768':
//           case 'llama3-8b-8192':
//           case 'gemma2-9b-it':
//           case 'llama-3.2-3b-preview':
//             console.log(selectModel);
//             const MixtralResponse = await groq.chat.completions.create({
//               model: `${selectModel}`, 
//               messages: messages,
//               // (Optional) Thêm các tham số khác nếu cần 
//               // Ví dụ: temperature, top_p, max_tokens, ...
//             });
//             result = MixtralResponse.choices[0].message.content;
//             break;
//         }
//       return result;
// }

const evaluateRouter = require('./routes/evaluate');
const checkRelevanceRouter = require('./routes/checkRelevance');
const examAriseRouter = require('./routes/exam');
const summarizeRouter = require('./routes/summarize');

app.use('/evaluate', evaluateRouter);
app.use('/check-relevance', checkRelevanceRouter);
app.use('/exam-arise', examAriseRouter);
app.use('/summarize', summarizeRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


