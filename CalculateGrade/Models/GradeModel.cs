using System.ComponentModel.DataAnnotations;

namespace CalculateGrade.Models
{
    public class GradeModel
    {

        public string Evaluation { get; set; }


        public string Requirement { get; set; }


        public IFormFile Submission { get; set; }

        public string SelectedAPI { get; set; }
    }
}
