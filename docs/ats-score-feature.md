# ATS Score + Improvement Feedback

## Goal
Allow users to:
1. Check ATS score for any resume (existing, in-progress/new, or uploaded draft).
2. Get actionable improvement feedback and keyword suggestions.

## Backend API
### Endpoint
`POST /api/ai/ats-analyze`

### Auth
Requires JWT token (`Authorization: Bearer <token>`).

### Request body
```json
{
  "resumeId": "optional_mongodb_id",
  "resumeData": "optional_resume_object",
  "targetRole": "optional role hint, e.g. Data Scientist",
  "includeAiFeedback": true
}
```

Rules:
1. At least one of `resumeId` or `resumeData` is required.
2. If `resumeId` is provided, resume ownership is verified using logged-in user.
3. `includeAiFeedback` defaults to `true`.

### Response body (data)
```json
{
  "score": 78,
  "grade": "Good",
  "breakdown": [
    { "id": "contact", "label": "Contact Information", "score": 9, "maxScore": 10, "reason": "..." }
  ],
  "improvements": ["...", "..."],
  "keywordSuggestions": ["...", "..."],
  "rewrittenSummary": "...",
  "model": "gemini-2.5-flash"
}
```

## Scoring logic
Current ATS score is rule-based (deterministic) and normalized to 0-100:
1. Contact Information (10)
2. Professional Summary (15)
3. Work Experience (25)
4. Skills Match (20)
5. Education (10)
6. Projects (10)
7. ATS Readability (10)

## AI improvement feedback
After score calculation, Gemini is used to produce:
1. Improvement bullets
2. Keyword suggestions
3. Rewritten summary draft

If Gemini fails, fallback improvement tips still come from rule-based breakdown.

## Frontend integration points
1. Resume Builder summary section:
   - Button: `Check ATS Score`
   - Shows score, grade, section-wise breakdown, improvements, and keyword suggestions.
2. Upload Import Review modal:
   - Button: `Check ATS Score`
   - Runs ATS on parsed draft before final import.

This supports all three scenarios:
1. Existing saved resumes.
2. New/in-progress resumes.
3. Uploaded parsed resumes.
