const express = require('express');
const router = express.Router();
const multer = require('multer');
const { extractContent, deleteFile } = require('../utils/fileUtils');
const { callModel } = require('../utils/aiUtils');
const path = require('path');
const mammoth = require('mammoth');
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('syllabus'), async (req, res) => {
    try {
                const selectModel = req.body.model; // Lấy model từ body
                var content = (await mammoth.extractRawText({ path: req.file.path })).value;
                const systemPrompt ='Bạn là một giáo viên lập trình lâu năm có kinh nghiệm, cũng như chuyên gia về rút trích tóm tắt các Syllabus của các khóa học.\n\
                                    Vai trò chính của bạn là dựa trên Syllabus của một môn học, hãy tìm các nội dung chính và phụ, tóm tắt theo nội dung chính lẫn phụ của Syllabus.\n\
                                    Nhiệm vụ là tạo ra bản tóm tắt Syllabus xúc tích, ngắn gọn bao gồm nội dung chính, phụ và liệt kê theo dạng bullet, thường dài từ 400 từ trở xuống\n\
                                    Hướng dẫn quan trọng:\n\
                                    Chú ý đến các nội dung chính, bỏ qua các phần đầu như set up môi trường hay các khái niệm chung về lập trình.\n\
                                    Chỉ từ 5-7 nội dung chính.\n\
                                    2-3 nội dung phụ'
                const prompt = `## Đây là nội dung khóa học:
                ${content}
                ## Tôi đang gặp một số khó khăn về vấn đề tóm tắt nội dung khóa học. 
                Bạn hãy giúp tôi tóm tắt nội dung khóa học, nội dung tóm tắt đều bằng tiếng Việt
                (nếu tôi đính kèm thiếu nội dung khóa học hoặc syllabus thì hãy phản hồi ngay)`;
                const messages = [
                  { role: "system", content: `${systemPrompt}` },
                  { role: "user", content: prompt}
                ];
                var result = await callModel(selectModel, systemPrompt, prompt, messages);
                res.json({ success: true, result });
        
            } catch (error) {
                console.log(error);
                res.status(500).json({ success: false, error: error.message });
            }
            finally {
              // ... (Delete uploaded files) ...
                //fs.unlink(req.file.path);
                deleteFile(req.file.path);
            }
});

module.exports = router;
