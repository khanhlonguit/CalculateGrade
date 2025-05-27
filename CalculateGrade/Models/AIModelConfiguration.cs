namespace CalculateGrade.Models
{
    public class AIModel
    {
        public string Id { get; set; }
        public string DisplayName { get; set; }
        public bool IsDefault { get; set; }
    }

    public class AIModelsConfiguration
    {
        public List<AIModel> Models { get; set; } = new List<AIModel>();
    }
} 