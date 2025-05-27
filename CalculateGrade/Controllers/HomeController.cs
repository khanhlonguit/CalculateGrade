using CalculateGrade.Helper;
using CalculateGrade.Models;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Text;

namespace NotebookGrader.Web.Controllers
{
    public class HomeController : Controller
    {
        private readonly IAIModelService _aiModelService;

        public HomeController(IAIModelService aiModelService)
        {
            _aiModelService = aiModelService;
        }

        public IActionResult Index()
        {
            string result = TempData["Result"] as string;
            var model = new EvaluateModel();
            model.Syllabus = result;
            
            // Truyền danh sách models qua ViewBag
            ViewBag.Models = _aiModelService.GetAllModels();
            
            return View(model);
        }

        [HttpPost]
        public async Task<IActionResult> Grade(IFormCollection form)
        {
            if (form.Files == null || form.Files.Count == 0)
            {
                ModelState.AddModelError("", "Please select both PDF and IPYNB files.");
                return Json(new { Feedback = "Có lỗi xảy ra" });
            }

            using (var content = new MultipartFormDataContent())
            {
                content.Add(new StreamContent(form.Files[0].OpenReadStream()), "pdfFile", form.Files[0].FileName);
                for( var i = 1; i < form.Files.Count; i++)
                {
                    content.Add(new StreamContent(form.Files[i].OpenReadStream()), "submission", form.Files[i].FileName);
                }
                content.Add(new StringContent(form["Model1"]), "model1");
                content.Add(new StringContent(form["Model2"]), "model2");
                using (var client = new HttpClient())
                {
                    var response = await client.PostAsync("http://localhost:3001/evaluate", content);
                    if (response.IsSuccessStatusCode)
                    {
                        var result = await response.Content.ReadFromJsonAsync<EvaluationResult>();
                        return Json(new { Evaluation = MarkdownConverter.ConvertToHtml(result.Evaluation ?? ""), 
                                          EvaluationMixtral = MarkdownConverter.ConvertToHtml(result.EvaluationMixtral ?? "") });
                    }
                    else
                    {
                        ModelState.AddModelError("", "Error evaluating work.");
                        return Json(new { Evaluation = "Có lỗi xảy ra",
                                            EvaluationMixtral = "Có lỗi xảy ra"
                                        });
                    }
                }
            }
        }

        [HttpPost]
        public async Task<IActionResult> CheckSyllabus(IFormCollection form)
        {
            using var client = new HttpClient();
            using var content = new MultipartFormDataContent();
            // Tạo object chứa dữ liệu

            content.Add(new StreamContent(form.Files[0].OpenReadStream()), "pdfFile", form.Files[0].FileName);
            content.Add(new StringContent(form["Syllabus"]), "syllabus");
            content.Add(new StringContent(form["Model1"]), "model1");
            content.Add(new StringContent(form["Model2"]), "model2");
            var response = await client.PostAsync("http://localhost:3001/check-relevance", content); // Gọi API kiểm tra

            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadFromJsonAsync<EvaluationResult>();
                return Json(new { SyllabusCheckResult = MarkdownConverter.ConvertToHtml(result.SyllabusCheckResult), 
                                  SyllabusMixtral = MarkdownConverter.ConvertToHtml(result.SyllabusMixtral)});
            }
            else
            {
                // Xử lý lỗi
                return Json(new { SyllabusCheckResult = "Có lỗi xảy ra khi kiểm tra độ khớp." });
            }

            //return View("Index", form); // Trả về view Index với dữ liệu mới
        }
    }
    public class EvaluationResult
    {
        public string SyllabusCheckResult { get; set; }
        public string Evaluation { get; set; }
        public string SyllabusMixtral { get; set; }
        public string EvaluationMixtral { get; set; }
    }
}