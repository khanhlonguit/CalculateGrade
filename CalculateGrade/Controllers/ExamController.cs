using Aspose.Words;
using CalculateGrade.Helper;
using CalculateGrade.Models;
using Microsoft.AspNetCore.Mvc;
using NotebookGrader.Web.Controllers;

namespace CalculateGrade.Controllers
{
    public class ExamController : Controller
    {
        public IActionResult Index()
        {
            string result = TempData["Result"] as string;
            var model = new ExamModel();
            model.Syllabus = result;
            return View(model);
        }
        [HttpPost]
        public async Task<IActionResult> ExamArise(IFormCollection form)
        {
            using var client = new HttpClient();
            using var content = new MultipartFormDataContent();
            // Tạo object chứa dữ liệu

            content.Add(new StreamContent(form.Files[0].OpenReadStream()), "examFile", form.Files[0].FileName);
            content.Add(new StringContent(form["Syllabus"]), "syllabus");
            content.Add(new StringContent(form["Model1"]), "model1");
            content.Add(new StringContent(form["Model2"]), "model2");
            var response = await client.PostAsync("http://localhost:3001/exam-arise", content); // Gọi API kiểm tra

            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadFromJsonAsync<Result>();
                return Json(new
                {
                    resultGoogle = MarkdownConverter.ConvertToHtml(result.ResultGoogle),
                    resultGroq = MarkdownConverter.ConvertToHtml(result.ResultGroq)
                });
            }
            else
            {
                // Xử lý lỗi
                return Json(new { resultGoogle = "Có lỗi xảy ra khi phát sinh đề thi" });
            }

            //return View("Index", form); // Trả về view Index với dữ liệu mới
        }

        [HttpPost]
        public IActionResult ConvertToWord(string htmlContent)
        {
            //using (MemoryStream memoryStream = new MemoryStream())
            //{
            //    using (WordprocessingDocument wordDocument = WordprocessingDocument.Create(memoryStream, WordprocessingDocumentType.Document))
            //    {
            //        MainDocumentPart mainPart = wordDocument.AddMainDocumentPart();
            //        mainPart.Document = new Document();
            //        Body body = mainPart.Document.AppendChild(new Body());

            //        // Chèn nội dung HTML vào body
            //        AlternativeFormatImportPart chunk = mainPart.AddAlternativeFormatImportPart(AlternativeFormatImportPartType.Html);
            //        using (StreamWriter sw = new StreamWriter(chunk.GetStream()))
            //        {
            //            sw.Write(htmlContent);
            //        }
            //        AltChunk altChunk = new AltChunk();
            //        altChunk.Id = wordDocument.MainDocumentPart.GetIdOfPart(chunk);
            //        body.AppendChild(altChunk);

            //        //wordDocument.Close();
            //    }
            //    string base64String = Convert.ToBase64String(memoryStream.ToArray());

            //    return Ok(base64String);
            //    //return File(memoryStream.ToArray(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "output.docx");
            //}
            Document document = new Document();
            DocumentBuilder builder = new DocumentBuilder(document);
            builder.InsertHtml(htmlContent);
            document.Save(@"C:\Users\hv\Downloads\html-string-as-word.docx", SaveFormat.Docx);
            return Ok();
        }
    }
}
public class Result
{
    public string ResultGoogle { get; set; }
    public string ResultGroq { get; set; }
}
