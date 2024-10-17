const express = require('express');
const router = express.Router();
const multer = require('multer');
const { extractContent, deleteFile } = require('../utils/fileUtils');
const { callModel } = require('../utils/aiUtils');
const mammoth = require('mammoth');
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('pdfFile'), async (req, res) => {
    try {
        const syllabusContent = req.body.syllabus; // Lấy syllabus từ body
        console.log(syllabusContent);
        const model1 = req.body.model1;
        const model2 = req.body.model2;
        var pdfContent = (await mammoth.extractRawText({ path: req.file.path })).value;
        const systemPrompt ='Bạn là một giáo viên dạy lập trình lâu năm có kinh nghiệm, cũng như là chuyên gia về so sánh đề thi với syllabus của khóa học.\n\
                      Vai trò chính của bạn là dựa vào Syllabus của môn học, hãy so sánh nội dung các câu của đề thi có nằm trong syllabus và đưa ra lý do.\n\
                      Nhiệm vụ là so sánh giữa các câu trong đề thi và syllabus, đưa ra kết quả tổng quan giữa độ khớp của đề thi so với Syllabus trên thang điểm 10, chỉ rõ những điểm khớp hoặc không khớp của đề thi so với Syllabus.\n\
                      Hướng dẫn quan trọng:\n\
                      Nội dung trả lời không quá 300 chữ, và hoàn toàn bằng tiếng Việt'
        const prompt = `## Yêu cầu đề bài:
        ${pdfContent}
        
        ## Syllabus:
        ${syllabusContent}
  
        ##Tôi đang gặp vấn đề về so sánh giữa nội dung của đề thi với Syllabus. 
        Bạn hãy giúp tôi đưa ra kết quả so sánh giữa các câu trong đề thi và syllabus,
         chỉ rõ những điểm khớp hoặc không khớp của đề thì với Syllabus
         (nếu tôi đính kèm thiếu đề bài hoặc syllabus không đầy đủ thì hãy phản hồi ngay)`;
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
        deleteFile(req.file.path);
      }
});

module.exports = router;
