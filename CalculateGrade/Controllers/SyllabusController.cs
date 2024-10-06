using CalculateGrade.Helper;
using CalculateGrade.Models;
using Microsoft.AspNetCore.Mvc;
using NotebookGrader.Web.Controllers;

namespace CalculateGrade.Controllers
{
    public class SyllabusController : Controller
    {
        public IActionResult Index()
        {
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
    }
    public class SyllabusResult
    {
        public string Result { get; set; }
    }
}
