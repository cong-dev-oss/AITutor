namespace AITutor.Application.DTOs;

public record QuestionDto(string Question, string[] Options, int CorrectIndex, string Explanation);
