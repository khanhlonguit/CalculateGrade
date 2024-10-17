const express = require('express');
const router = express.Router();
const multer = require('multer');
const mammoth = require('mammoth');
const { extractContent, deleteFile } = require('../utils/fileUtils');
const { callModel } = require('../utils/aiUtils');
const path = require('path');

const upload = multer({ dest: 'uploads/' });

router.post('/', upload.fields([{ name: 'pdfFile' }, { name: 'submission', maxCount: 5 }]), async (req, res) => {
  try {
    var pdfContent = (await mammoth.extractRawText({ path: req.files.pdfFile[0].path })).value;
    const model1 = req.body.model1;
    const model2 = req.body.model2;
    const submissionFiles = req.files['submission'];
    let submissionContent = '';
    if (submissionFiles) {
      for (const file of submissionFiles) {
        // Sử dụng fs.readFile để đọc nội dung file
        const fileData = extractContent(file.path, path.extname(file.originalname).toLowerCase()); 
        submissionContent += fileData + '\n';
      }
    }
    console.log(submissionContent);
    const systemPrompt ='Bạn là một giáo viên dạy lập trình lâu năm có kinh nghiệm, cũng như là chuyên gia chấm bài thi \n\
                Vai trò chính của bạn là dựa vào đề thi cũng như bài giải có sẵn, xem bài giải mẫu đó có giải quyết được đề thi hay không và có lời giải nào hay hơn nữa không\n\
                Nhiệm vụ là xem bài giải có giải quyết được đề thi cũng như đã tối ưu hay chưa và nếu chưa thì đưa ra lời giải khác hay hơn.\n\
                Hướng dẫn quan trọng\n\
                Trình bày ngắn gọn và dễ hiểu, hoàn toàn bằng tiếng Việt'

    const prompt = `## Yêu cầu đề bài:
    ${pdfContent}
    #################################################
    ## Bài làm mẫu:
    ${submissionContent}

    Tôi đang gặp vấn đề về duyệt đề và bài làm mẫu, bạn hãy giúp tôi 
    xem bài giải có sẵn đó giải quyết được bao nhiêu câu trong đề thi, cũng như đã tối ưu hay chưa 
    và nếu chưa thì đưa ra lời giải khác hay hơn. `;

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
    deleteFile(req.files.pdfFile[0].path);
    for(const file of req.files['submission']){
      deleteFile(file.path);
    }
  }
});

module.exports = router;
