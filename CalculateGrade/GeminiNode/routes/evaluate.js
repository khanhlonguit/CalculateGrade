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
    const pdfContent = await mammoth.extractRawText({ path: req.files.pdfFile[0].path });
    const submissionFiles = req.files['submission'];
    
    let submissionContents = [];
    for (const file of submissionFiles) {
      const fileExtension = path.extname(file.originalname);
      const content = extractContent(file.path, fileExtension);
      submissionContents.push(content);
    }

    const systemPrompt = 'Bạn là một giáo viên dạy lập trình có kinh nghiệm. Nhiệm vụ của bạn là chấm điểm bài làm của sinh viên dựa trên đề bài và bài làm được cung cấp.';
    const prompt = `Đề bài:\n${pdfContent.value}\n\nBài làm của sinh viên:\n${submissionContents.join('\n\n')}`;

    const result = await callModel('gemini-1.5-pro-002', systemPrompt, prompt, []);
    
    res.json({ result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi trong quá trình chấm điểm.' });
  } finally {
    // Xóa các file đã upload
    await deleteFile(req.files.pdfFile[0].path);
    for (const file of req.files['submission']) {
      await deleteFile(file.path);
    }
  }
});

module.exports = router;
