const fs = require('fs').promises;
const Fs = require('fs');
const path = require('path');

function extractContent(filePath, type) {
  try {
    let content = '';
    if (type === '.ipynb') {
      const fileContent = JSON.parse(Fs.readFileSync(filePath, 'utf8'));
      fileContent.cells.forEach(cell => {
        content += cell.source.join('') + '\n';
      });
    } else {
      content = Fs.readFileSync(filePath, 'utf8');
    }
    
    return content;
  } catch (error) {
    console.error(`Lỗi khi xử lý file ${filePath}:`, error);
    throw error;
  }
}

async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Lỗi khi xóa file ${filePath}:`, error);
  }
}

module.exports = { extractContent, deleteFile };
