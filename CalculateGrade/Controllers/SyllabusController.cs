using CalculateGrade.Helper;
using CalculateGrade.Models;
using Microsoft.AspNetCore.Mvc;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace CalculateGrade.Controllers
{
    public class SyllabusController : Controller
    {
        private readonly IAIModelService _aiModelService;

        public SyllabusController(IAIModelService aiModelService)
        {
            _aiModelService = aiModelService;
        }

        public IActionResult Index()
        {
            // Truyền danh sách models qua ViewBag
            ViewBag.Models = _aiModelService.GetAllModels();
            
            return View(new SyllabusModel());
        }

        [HttpPost]
        public async Task<IActionResult> GenerateModel1(IFormCollection form)
        {
            using var client = new HttpClient();
            using var content = new MultipartFormDataContent();

            content.Add(new StreamContent(form.Files[0].OpenReadStream()), "syllabus", form.Files[0].FileName);
            content.Add(new StringContent(form["Model"]), "model");

            var response = await client.PostAsync("http://localhost:3001/summarize", content);

            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadFromJsonAsync<SyllabusResult>();
                return Json(new { resultModel = MarkdownConverter.ConvertToHtml(result.Result)});
            }
            else
            {
                return Json(new { resultModel = "Có lỗi xảy ra" });
            }
        }

        [HttpPost]
        public IActionResult SaveResult(string result)
        {
            TempData["Result"] = result;
            return Ok();
        }
        [HttpPost]
        public IActionResult GetHeading1(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded.");
            }

            string heading1 = "";

            using (WordprocessingDocument wordDocument = WordprocessingDocument.Open(file.OpenReadStream(), false))
            {
                Body body = wordDocument.MainDocumentPart.Document.Body;

                // Lấy heading 1 (giả sử bạn chỉ cần heading đầu tiên)
                Paragraph headingParagraph = body.Descendants<Paragraph>()
                    .FirstOrDefault(p => p.ParagraphProperties != null &&
                                         p.ParagraphProperties.ParagraphStyleId != null &&
                                         p.ParagraphProperties.ParagraphStyleId.Val.Value.StartsWith("Heading1"));

                if (headingParagraph != null)
                {
                    heading1 = headingParagraph.InnerText.Trim();
                }
            }

            return Json(new { heading1 = heading1 });
        }
    }

    public class SyllabusResult
    {
        public string Result { get; set; }
    }
}
