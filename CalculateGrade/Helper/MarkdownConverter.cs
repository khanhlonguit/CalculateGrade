using Markdig;

namespace CalculateGrade.Helper
{
    public class MarkdownConverter
    {
        public static string ConvertToHtml(string markdown)
        {
            return Markdown.ToHtml(markdown);
        }
    }
}
