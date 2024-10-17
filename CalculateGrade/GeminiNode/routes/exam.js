const express = require('express');
const router = express.Router();
const multer = require('multer');
const mammoth = require('mammoth');
const { callModel } = require('../utils/aiUtils');
const { deleteFile } = require('../utils/fileUtils');

const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('examFile'), async (req, res) => {
  try {
    const syllabusContent = req.body.syllabus; // Lấy syllabus từ body
    const model1 = req.body.model1;
    const model2 = req.body.model2;
    var exam = (await mammoth.extractRawText({ path: req.file.path })).value;
    const systemPrompt ='Bạn là một giáo viên dạy lập trình lâu năm có kinh nghiệm, đặc biệt là chuyên gia soạn thảo đề thi cho nhiều môn học lập trình.\n\
                        Vai trò của bạn là dựa vào đề thi mẫu cũng như Syllabus có sẵn, từ đó soạn thảo ra đề thi mới trên thang điểm 10 và có format gần giống như đề thi mẫu và bao hàm hết nội dung của Syllabus.\n\
                        Nhiệm vụ chính là soạn thảo đề thi mới có format gần giống như đề thi mẫu và có nội dung bao hàm hết nhưng nên tập trung chủ yếu vào nội dung chính của Syllabus có sẵn\n\
                        nội dung đề thi có độ khó ở mức khó, các bài trong đề thi chỉ dựa theo thang điểm của đề mẫu chứ không phải sao y theo đề mẫu\n\
                        Hướng dẫn quan trọng\n\
                        Đề thi có câu chữ dễ hiểu và có ví dụ minh họa thì tốt hơn, chấm trên thang điểm 10 và phải bám sát với syllabus\n\
                        một câu hỏi có thể kết hợp nhiều nội dung trong Syllabus để tăng độ khó\n\
                        các câu khó trong bài thi sẽ có điểm số ít hơn những câu dễ \n\
                        Đề thi hoàn toàn bằng tiếng việt\n\
                     '
    const prompt = `## đề thi mẫu:
    ${exam}
    
    ## Syllabus:
    ${syllabusContent}

    ##Tôi đang gặp vấn đề về soạn thảo đề thi. 
    Bạn hãy giúp tôi soạn thảo đề thi mới có format gần giống như đề thi mẫu và có nội dung bao hàm hết nhưng nên tập trung chủ yếu vào nội dung chính của Syllabus có sẵn.
     (nếu tôi đính kèm thiếu đề bài hoặc syllabus không đầy đủ thì hãy phản hồi ngay)`;
    const messages = [
      { role: "system", content: `${systemPrompt}` },
      { role: "user", content: prompt}
    ];
    var resultGoogle = await callModel(model1, systemPrompt, prompt, messages);
    var resultGroq = await callModel(model2, systemPrompt, prompt, messages);
    res.json({ success: true, resultGoogle, resultGroq });

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
