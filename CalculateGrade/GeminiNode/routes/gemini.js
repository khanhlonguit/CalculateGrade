const dotenv = require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

import { GoogleAIFileManager } from "@google/generative-ai/files";

const MODEL_NAME = "gemini-1.5-pro-latest";
const API_KEY = process.env.ApiKey;
const fileManager = new GoogleAIFileManager(API_KEY);


const uploadResult = await fileManager.uploadFile(
  `${mediaPath}/Big_Buck_Bunny.mp4`,
  {
    mimeType: "video/mp4",
    displayName: "Big Buck Bunny",
  },
);

let file = await fileManager.getFile(uploadResult.file.name);
while (file.state === FileState.PROCESSING) {
  process.stdout.write(".");
  // Sleep for 10 seconds
  await new Promise((resolve) => setTimeout(resolve, 10_000));
  // Fetch the file from the API again
  file = await fileManager.getFile(uploadResult.file.name);
}

if (file.state === FileState.FAILED) {
  throw new Error("Video processing failed.");
}

// View the response.
console.log(
  `Uploaded file ${uploadResult.file.displayName} as: ${uploadResult.file.uri}`,
);

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const result = await model.generateContent([
  "Tell me about this video.",
  {
    fileData: {
      fileUri: uploadResult.file.uri,
      mimeType: uploadResult.file.mimeType,
    },
  },
]);
console.log(result.response.text());

module.exports = generateContent;