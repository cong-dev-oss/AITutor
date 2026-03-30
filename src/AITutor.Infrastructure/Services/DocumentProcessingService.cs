using AITutor.Application.Interfaces.Services;
using Ubiety.StringReplacer;
using UglyToad.PdfPig;
using UglyToad.PdfPig.Content;
using System.Text.RegularExpressions;

namespace AITutor.Infrastructure.Services;

public class DocumentProcessingService : IDocumentProcessingService
{
    public async Task<IEnumerable<string>> ExtractAndChunkAsync(Stream fileStream, int chunkSize = 800, int overlap = 100)
    {
        var text = ExtractTextFromPdf(fileStream);
        return RecursiveCharacterSplit(text, chunkSize, overlap);
    }

    private string ExtractTextFromPdf(Stream stream)
    {
        using var pdf = PdfDocument.Open(stream);
        var textBuilder = new System.Text.StringBuilder();

        foreach (var page in pdf.GetPages())
        {
            textBuilder.AppendLine(page.Text);
        }

        return textBuilder.ToString();
    }

    private IEnumerable<string> RecursiveCharacterSplit(string text, int limit, int overlap)
    {
        if (string.IsNullOrWhiteSpace(text)) return Enumerable.Empty<string>();

        var chunks = new List<string>();
        // Simple recursive splitting logic
        var separators = new[] { "\n\n", "\n", ". ", " ", "" };
        
        void SplitRecursively(string content)
        {
            if (content.Length <= limit)
            {
                chunks.Add(content.Trim());
                return;
            }

            string bestSeparator = "";
            foreach (var sep in separators)
            {
                if (content.Contains(sep))
                {
                    bestSeparator = sep;
                    break;
                }
            }

            int splitIndex = content.LastIndexOf(bestSeparator, limit, StringComparison.Ordinal);
            if (splitIndex <= 0) splitIndex = limit;

            chunks.Add(content.Substring(0, splitIndex).Trim());
            
            // Move to next part with overlap
            int nextStart = splitIndex - overlap;
            if (nextStart < 0) nextStart = splitIndex;
            
            if (nextStart < content.Length)
            {
                SplitRecursively(content.Substring(nextStart));
            }
        }

        // Using a simpler non-recursive loop to avoid stack overflow for large docs
        int currentPos = 0;
        while (currentPos < text.Length)
        {
            int remaining = text.Length - currentPos;
            int length = Math.Min(limit, remaining);
            
            if (currentPos + length < text.Length)
            {
                // Try to find a good split point (last space, newline, or dot)
                string sub = text.Substring(currentPos, length);
                int lastSpace = sub.LastIndexOfAny(new[] { '\n', ' ', '.' });
                if (lastSpace > limit / 2) // only split if it's reasonably far
                {
                    length = lastSpace + 1;
                }
            }

            chunks.Add(text.Substring(currentPos, length).Trim());
            currentPos += (length - overlap);
            if (currentPos >= text.Length || length <= overlap) break;
        }

        return chunks;
    }
}
