using Aspose.Words;
using CalculateGrade.Helper;
using CalculateGrade.Models;
using Microsoft.AspNetCore.Mvc;
using NotebookGrader.Web.Controllers;

namespace CalculateGrade.Controllers
{
    public class ExamController : Controller
    {
        private readonly IAIModelService _aiModelService;

        public ExamController(IAIModelService aiModelService)
        {
            _aiModelService = aiModelService;
        }
        
        public IActionResult Index()
        {
            string result = TempData["Result"] as string;
            var model = new ExamModel();
            model.Syllabus = result;
            
            // Truyền danh sách models qua ViewBag
            ViewBag.Models = _aiModelService.GetAllModels();
            
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
            Document document = new Document();
            using (MemoryStream stream = new MemoryStream())
            {
                DocumentBuilder builder = new DocumentBuilder(document);
                builder.InsertHtml(htmlContent);
                document.Save(stream, SaveFormat.Docx);

                // Đặt tên file
                string fileName = "DeThi" + DateTime.Now.ToString("yyyyMMddHHmmss") + ".docx";

                // Trả về file docx dưới dạng stream trong HTTP response
                return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document", fileName);
            }
        }
    }
}
public class Result
{
    public string ResultGoogle { get; set; }
    public string ResultGroq { get; set; }
}
