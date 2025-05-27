using CalculateGrade.Models;
using Microsoft.Extensions.Options;

namespace CalculateGrade.Helper
{
    public interface IAIModelService
    {
        List<AIModel> GetAllModels();
        AIModel GetDefaultModel();
        AIModel GetModelById(string id);
        string GetDefaultModelId();
    }

    public class AIModelService : IAIModelService
    {
        private readonly AIModelsConfiguration _aiModelsConfig;

        public AIModelService(IOptions<AIModelsConfiguration> aiModelsConfig)
        {
            _aiModelsConfig = aiModelsConfig.Value;
        }

        public List<AIModel> GetAllModels()
        {
            return _aiModelsConfig.Models;
        }

        public AIModel GetDefaultModel()
        {
            return _aiModelsConfig.Models.FirstOrDefault(m => m.IsDefault) 
                   ?? _aiModelsConfig.Models.FirstOrDefault();
        }

        public AIModel GetModelById(string id)
        {
            return _aiModelsConfig.Models.FirstOrDefault(m => m.Id == id);
        }

        public string GetDefaultModelId()
        {
            return GetDefaultModel()?.Id;
        }
    }
} 