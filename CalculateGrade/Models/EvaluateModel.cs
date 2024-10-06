namespace CalculateGrade.Models
{
    public class EvaluateModel
    {
        public IFormFile RequirementFile { get; set; }
        public List<IFormFile> SubmissionFile { get; set; }
        public string Model { get; set; }
        public string Evaluation { get; set; }
        public string Syllabus { get; set; }
        public string Relevance { get; set; }
    }
}
