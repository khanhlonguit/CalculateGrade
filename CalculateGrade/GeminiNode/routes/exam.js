const express = require('express');
const router = express.Router();
const multer = require('multer');
const mammoth = require('mammoth');
const { callModel } = require('../utils/aiUtils');
const { deleteFile } = require('../utils/fileUtils');

const upload = multer({ dest: 'uploads/' });

router.post('/arise', upload.single('examFile'), async (req, res) => {
  try {
    const syllabusContent = req.body.syllabus;
    console.log(syllabusContent);
    const model1 = req.body.model1;
    const model2 = req.body.model2;
    var exam = (await mammoth.extractRawText({ path: req.file.path })).value;
    const systemPrompt = 'Bạn là một giáo viên dạy lập trình lâu năm có kinh nghiệm, đặc biệt là chuyên gia soạn thảo đề thi cho nhiều môn học lập trình.\n\
                          Vai trò của bạn là dựa vào đề thi mẫu cũng như Syllabus có sẵn, từ đó soạn thảo ra đề thi mới trên thang điểm 10 và có format gần giống như đề thi mẫu và bao hàm hết nội dung của Syllabus.\n\
                          Nhiệm vụ chính là soạn thảo đề thi mới có format gần giống như đề thi mẫu và có nội dung bao hàm hết nhưng nên tập trung chủ yếu vào nội dung chính của Syllabus có sẵn\n\
                          nội dung đề thi có độ khó ở mức khó, các bài trong đề thi chỉ dựa theo thang điểm của đề mẫu chứ không phải sao y theo đề mẫu\n\
                          Hướng dẫn quan trọng\n\
                          Đề thi có câu chữ dễ hiểu và có ví dụ minh họa thì tốt hơn, chấm trên thang điểm 10 và phải bám sát với syllabus\n\
                          một câu hỏi có thể kết hợp nhiều nội dung trong Syllabus để tăng độ khó\n\
                          các câu khó trong bài thi sẽ có điểm số ít hơn những câu dễ \n\
                          Đề thi hoàn toàn bằng tiếng việt\n';

    const prompt = `Syllabus:\n${syllabusContent}\n\nĐề thi mẫu:\n${exam}`;

    const result = await callModel(model1, systemPrompt, prompt, []);
    
    res.json({ result });
  } catch (error) {
    console.error('Lỗi khi tạo đề thi:', error);
    res.status(500).json({ error: 'Không thể tạo đề thi' });
  } finally {
    if (req.file) {
      await deleteFile(req.file.path);
    }
  }
});

module.exports = router;
