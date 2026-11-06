---
name: quizhub-mcq-expert
description: >
  Expert knowledge on how to write high-quality MCQ questions for QuizHub.
  Use this skill when creating, reviewing, or validating quiz questions.
  Covers question structure, distractor writing, difficulty calibration, and quality rules.
---

# QuizHub MCQ Expert Skill

## What Makes a Good MCQ

A great MCQ has:
1. **Clear stem** — one complete question, no trick wording
2. **One correct answer** — unambiguously right
3. **3 plausible distractors** — wrong but believable (not obviously silly)
4. **Consistent length** — all 4 options roughly same length
5. **No "all of the above" / "none of the above"** — QuizHub rejects these

## Difficulty Guidelines

| Level | What it tests | Example |
|---|---|---|
| EASY | Definition or basic recall | "What annotation marks a Spring Bean?" |
| MEDIUM | Understands HOW it works | "What happens when two @Bean methods have same return type?" |
| HARD | Applies knowledge in edge case | "Which scope causes issues in a multithreaded singleton?" |

## QuizHub MCQ JSON format (for createMcq tool)

```json
{
  "questionStem": "Which annotation is used to inject dependencies in Spring?",
  "optionA": "@Inject",
  "optionB": "@Autowired",
  "optionC": "@Component",
  "optionD": "@Bean",
  "correctOption": "B",
  "explanation": "@Autowired is Spring's primary annotation for dependency injection.",
  "difficultyLevel": "EASY",
  "techStackId": 2,
  "topicId": 5,
  "status": "DRAFT"
}
```

## Duplicate Check Rules

Before creating any question, always call `checkDuplicate` with the question stem.
- Similarity > 85% → **Block** — too similar, don't create
- Similarity 60–85% → **Warn** — ask user to confirm
- Similarity < 60% → **Safe** — proceed to create

## Common Mistakes to Avoid

- ❌ "Which of the following is NOT..." — negatives confuse test takers
- ❌ Giving away the answer in the stem ("The @Transactional annotation, which manages transactions, does what?")
- ❌ One distractor that is obviously wrong ("What does Spring Boot do? — A) Makes coffee")
- ❌ Grammar mismatch between stem and options
- ✅ Always test ONE concept per question
- ✅ Put the correct answer in random positions (A/B/C/D evenly)
