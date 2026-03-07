import ApiError from "../utils/ApiError.js";
import { sendSuccess } from "../utils/sendResponse.js";
import AtsHistory from "../models/AtsHistory.js";
import Resume from "../models/resume.js";

const buildPrompt = (summary) => {
  return [
    "You are an expert resume writer.",
    "Improve the following professional summary for a resume.",
    "Requirements:",
    "1) Keep it truthful and realistic.",
    "2) Keep it concise (less than 300 words).",
    "3) Use strong professional language.",
    "4) Keep plain text output only (no markdown, no bullets).",
    "",
    "Original summary:",
    summary,
  ].join("\n");
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const ROLE_KEYWORDS = {
  frontend: ["react", "javascript", "typescript", "css", "html", "next.js"],
  backend: ["node", "express", "api", "mongodb", "sql", "auth"],
  data: ["python", "sql", "machine learning", "pandas", "tensorflow", "statistics"],
  devops: ["docker", "kubernetes", "aws", "ci/cd", "terraform", "linux"],
};

const countActionVerbs = (text) => {
  const actionVerbs = [
    "built",
    "led",
    "designed",
    "developed",
    "implemented",
    "improved",
    "optimized",
    "launched",
    "increased",
    "reduced",
    "automated",
    "delivered",
    "scaled",
    "managed",
  ];

  const content = String(text || "").toLowerCase();
  return actionVerbs.reduce((count, verb) => count + (content.includes(verb) ? 1 : 0), 0);
};

const countNumericMentions = (text) => {
  const matches = String(text || "").match(/\b\d+([.,]\d+)?%?\b/g);
  return matches ? matches.length : 0;
};

const scoreContactSection = (resumeData) => {
  const info = resumeData?.personal_info || {};
  const requiredFields = ["full_name", "email", "phone"];
  const optionalFields = ["location", "linkedin", "website"];
  const requiredCount = requiredFields.filter((key) => String(info[key] || "").trim()).length;
  const optionalCount = optionalFields.filter((key) => String(info[key] || "").trim()).length;
  const score = clamp(requiredCount * 2 + optionalCount, 0, 10);

  return {
    id: "contact",
    label: "Contact Information",
    score,
    maxScore: 10,
    reason:
      score >= 8
        ? "Contact section is strong and ATS friendly."
        : "Add complete contact details (name, email, phone, location, LinkedIn).",
  };
};

const scoreSummarySection = (resumeData) => {
  const summary = String(resumeData?.professional_summary || "").trim();
  const wordCount = summary ? summary.split(/\s+/).filter(Boolean).length : 0;
  const actionVerbCount = countActionVerbs(summary);
  const numericMentions = countNumericMentions(summary);
  let score = 0;

  if (wordCount >= 40 && wordCount <= 120) score += 8;
  else if (wordCount >= 20) score += 5;

  score += clamp(actionVerbCount, 0, 4);
  score += clamp(numericMentions, 0, 3);
  score = clamp(score, 0, 15);

  return {
    id: "summary",
    label: "Professional Summary",
    score,
    maxScore: 15,
    reason:
      score >= 11
        ? "Summary is concise and impact-oriented."
        : "Use 3-5 lines with action verbs and at least 1-2 measurable outcomes.",
  };
};

const scoreExperienceSection = (resumeData) => {
  if (resumeData?.is_fresher) {
    return {
      id: "experience",
      label: "Work Experience",
      score: 20,
      maxScore: 25,
      reason: "Fresher mode enabled. Focus on projects, internships, and skills impact.",
    };
  }

  const items = Array.isArray(resumeData?.experience) ? resumeData.experience : [];
  const nonEmptyItems = items.filter(
    (item) => String(item?.company || "").trim() || String(item?.position || "").trim()
  );
  const descriptions = nonEmptyItems.map((item) => String(item?.description || "").trim());
  const textBlob = descriptions.join(" ");
  const numericMentions = countNumericMentions(textBlob);
  const actionVerbCount = countActionVerbs(textBlob);
  const detailedDescriptions = descriptions.filter((d) => d.length >= 60).length;

  let score = 0;
  score += clamp(nonEmptyItems.length * 5, 0, 12);
  score += clamp(detailedDescriptions * 3, 0, 8);
  score += clamp(actionVerbCount, 0, 3);
  score += clamp(numericMentions, 0, 2);
  score = clamp(score, 0, 25);

  return {
    id: "experience",
    label: "Work Experience",
    score,
    maxScore: 25,
    reason:
      score >= 18
        ? "Experience entries show solid depth and impact."
        : "Add role-wise impact bullets with numbers (%, revenue, time saved, users).",
  };
};

const scoreSkillsSection = (resumeData, targetRole) => {
  const skills = Array.isArray(resumeData?.skills)
    ? resumeData.skills.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  const roleText = String(targetRole || resumeData?.personal_info?.profession || "").toLowerCase();
  let matchedRoleKeywords = 0;
  const normalizedSkills = skills.join(" ").toLowerCase();
  for (const [role, keywords] of Object.entries(ROLE_KEYWORDS)) {
    if (!roleText.includes(role)) continue;
    matchedRoleKeywords = keywords.filter((keyword) => normalizedSkills.includes(keyword)).length;
  }

  let score = 0;
  score += clamp(skills.length, 0, 12);
  score += clamp(matchedRoleKeywords * 2, 0, 8);
  score = clamp(score, 0, 20);

  return {
    id: "skills",
    label: "Skills Match",
    score,
    maxScore: 20,
    reason:
      score >= 14
        ? "Skills section has good keyword coverage."
        : "Add 8-15 relevant keywords/tools aligned with your target role.",
  };
};

const scoreEducationSection = (resumeData) => {
  const education = Array.isArray(resumeData?.education) ? resumeData.education : [];
  const valid = education.filter(
    (item) => String(item?.institution || "").trim() || String(item?.degree || "").trim()
  );
  const score = clamp(valid.length * 5, 0, 10);

  return {
    id: "education",
    label: "Education",
    score,
    maxScore: 10,
    reason: score >= 7 ? "Education details are present." : "Add degree, institution, and year.",
  };
};

const scoreProjectsSection = (resumeData) => {
  const projects = Array.isArray(resumeData?.project) ? resumeData.project : [];
  const valid = projects.filter((item) => String(item?.name || "").trim());
  const richDescriptions = valid.filter((item) => String(item?.description || "").trim().length > 50);
  let score = clamp(valid.length * 4 + richDescriptions.length * 2, 0, 10);
  score = clamp(score, 0, 10);

  return {
    id: "projects",
    label: "Projects",
    score,
    maxScore: 10,
    reason:
      score >= 7
        ? "Projects add practical proof of your work."
        : "Add 1-3 projects with tech stack and measurable outcome.",
  };
};

const scoreReadabilitySection = (resumeData) => {
  const text = [
    resumeData?.professional_summary || "",
    ...(Array.isArray(resumeData?.experience)
      ? resumeData.experience.map((item) => item?.description || "")
      : []),
    ...(Array.isArray(resumeData?.project)
      ? resumeData.project.map((item) => item?.description || "")
      : []),
  ]
    .join(" ")
    .trim();

  const wordCount = text ? text.split(/\s+/).length : 0;
  const hasEmailInText = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text);
  const score = clamp((wordCount >= 120 ? 6 : 3) + (hasEmailInText ? 2 : 0) + 2, 0, 10);

  return {
    id: "readability",
    label: "ATS Readability",
    score,
    maxScore: 10,
    reason:
      score >= 8
        ? "Resume has enough parseable content for ATS."
        : "Increase role-specific, plain-text content and avoid very short descriptions.",
  };
};

const buildRuleBasedFeedback = (breakdown) => {
  return breakdown
    .filter((item) => item.score < item.maxScore * 0.7)
    .sort((a, b) => a.score / a.maxScore - b.score / b.maxScore)
    .slice(0, 4)
    .map((item) => item.reason);
};

const buildAtsFeedbackPrompt = ({ score, breakdown, roleHint, resumeData }) => {
  const compactResume = {
    role: resumeData?.personal_info?.profession || "",
    summary: resumeData?.professional_summary || "",
    skills: resumeData?.skills || [],
    experience: Array.isArray(resumeData?.experience)
      ? resumeData.experience.map((item) => ({
          company: item.company || "",
          position: item.position || "",
          description: item.description || "",
        }))
      : [],
    education: resumeData?.education || [],
    project: resumeData?.project || [],
  };

  return [
    "You are an ATS optimization coach.",
    "Give concise, practical feedback to improve ATS score.",
    "Return JSON only with this shape:",
    '{ "improvements": ["...", "..."], "keywordSuggestions": ["...", "..."], "rewrittenSummary": "..." }',
    "Constraints:",
    "1) Maximum 5 improvements",
    "2) Maximum 8 keywordSuggestions",
    "3) rewrittenSummary in 3-4 sentences plain text",
    "",
    `Current ATS score: ${score}/100`,
    `Target role hint: ${roleHint || "not specified"}`,
    `Breakdown: ${JSON.stringify(breakdown)}`,
    `Resume data: ${JSON.stringify(compactResume)}`,
  ].join("\n");
};

const extractJsonObject = (rawText) => {
  const cleaned = String(rawText || "").replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
};

const getWordCount = (text) => String(text || "").trim().split(/\s+/).filter(Boolean).length;

const isLikelyCompleteSummary = (text) => {
  const summary = String(text || "").trim();
  if (!summary) return false;
  const wordCount = getWordCount(summary);
  if (wordCount < 20) return false;

  // Summary should end with sentence punctuation to avoid cut-off/incomplete outputs.
  if (!/[.!?]$/.test(summary)) return false;

  // Avoid truncated ellipsis endings that often indicate incomplete generation.
  if (/\.\.\.$/.test(summary)) return false;

  return true;
};

const shouldAcceptSummaryUpdate = ({ candidate, current }) => {
  const candidateSummary = String(candidate || "").trim();
  const currentSummary = String(current || "").trim();

  if (!isLikelyCompleteSummary(candidateSummary)) return false;
  if (!currentSummary) return true;

  const candidateWords = getWordCount(candidateSummary);
  const currentWords = getWordCount(currentSummary);

  // Reject if candidate is much shorter than current content.
  if (currentWords > 0 && candidateWords < Math.floor(currentWords * 0.7)) return false;

  return true;
};

const getRoleKeywordSuggestions = ({ targetRole, resumeData }) => {
  const roleText = String(targetRole || resumeData?.personal_info?.profession || "").toLowerCase();
  const existingSkills = new Set(
    (Array.isArray(resumeData?.skills) ? resumeData.skills : [])
      .map((item) => String(item || "").trim().toLowerCase())
      .filter(Boolean)
  );

  for (const [role, keywords] of Object.entries(ROLE_KEYWORDS)) {
    if (!roleText.includes(role)) continue;
    return keywords.filter((keyword) => !existingSkills.has(keyword.toLowerCase()));
  }

  const genericKeywords = [
    "problem solving",
    "communication",
    "team collaboration",
    "stakeholder management",
  ];
  return genericKeywords.filter((keyword) => !existingSkills.has(keyword.toLowerCase()));
};

const requestGemini = async ({ prompt, maxOutputTokens = 500 }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const configuredModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey) {
    throw new ApiError(
      500,
      "AI_CONFIG_ERROR",
      "GEMINI_API_KEY is not configured in server environment"
    );
  }

  const normalizeModel = (modelName) => {
    const cleaned = String(modelName || "")
      .trim()
      .replace(/^models\//, "");
    if (cleaned.includes("1.5")) return "gemini-2.0-flash";
    return cleaned;
  };

  const tryModel = async (modelName) => {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const geminiResponse = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens,
        },
      }),
    });
    const payload = await geminiResponse.json();
    return { geminiResponse, payload };
  };

  const modelCandidates = [
    normalizeModel(configuredModel),
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-flash-latest",
  ].filter(Boolean);

  let payload = null;
  let usedModel = "";
  let lastErrorMessage = "";

  for (const model of [...new Set(modelCandidates)]) {
    const { geminiResponse, payload: attemptPayload } = await tryModel(model);
    if (geminiResponse.ok) {
      payload = attemptPayload;
      usedModel = model;
      break;
    }

    lastErrorMessage =
      attemptPayload?.error?.message || "Gemini request failed with unknown provider error";
    const shouldRetryWithNextModel = geminiResponse.status === 404 || geminiResponse.status === 400;
    if (!shouldRetryWithNextModel) {
      throw new ApiError(502, "AI_PROVIDER_ERROR", lastErrorMessage);
    }
  }

  if (!payload) {
    throw new ApiError(
      502,
      "AI_PROVIDER_ERROR",
      lastErrorMessage || "No compatible Gemini model was found"
    );
  }

  const text =
    payload?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim() || "";

  if (!text) {
    throw new ApiError(502, "AI_EMPTY_RESPONSE", "AI returned an empty response");
  }

  return { text, model: usedModel };
};

const computeAtsResult = async ({ resumeData, targetRole = "", includeAiFeedback = true }) => {
  const breakdown = [
    scoreContactSection(resumeData),
    scoreSummarySection(resumeData),
    scoreExperienceSection(resumeData),
    scoreSkillsSection(resumeData, targetRole),
    scoreEducationSection(resumeData),
    scoreProjectsSection(resumeData),
    scoreReadabilitySection(resumeData),
  ];

  const maxScore = breakdown.reduce((sum, item) => sum + item.maxScore, 0);
  const rawScore = breakdown.reduce((sum, item) => sum + item.score, 0);
  const normalizedScore = clamp(Math.round((rawScore / maxScore) * 100), 0, 100);
  const ruleBasedImprovements = buildRuleBasedFeedback(breakdown);

  let aiFeedback = {
    improvements: [],
    keywordSuggestions: [],
    rewrittenSummary: "",
    model: "",
  };

  if (includeAiFeedback) {
    try {
      const { text, model } = await requestGemini({
        prompt: buildAtsFeedbackPrompt({
          score: normalizedScore,
          breakdown,
          roleHint: targetRole,
          resumeData,
        }),
        maxOutputTokens: 600,
      });

      const parsed = extractJsonObject(text);
      if (!parsed) {
        throw new Error("AI feedback JSON parse failed");
      }
      aiFeedback = {
        improvements: Array.isArray(parsed?.improvements)
          ? parsed.improvements.map((item) => String(item).trim()).filter(Boolean).slice(0, 5)
          : [],
        keywordSuggestions: Array.isArray(parsed?.keywordSuggestions)
          ? parsed.keywordSuggestions.map((item) => String(item).trim()).filter(Boolean).slice(0, 8)
          : [],
        rewrittenSummary: String(parsed?.rewrittenSummary || "").trim(),
        model,
      };
    } catch {
      aiFeedback.improvements = [];
    }
  }

  return {
    score: normalizedScore,
    grade:
      normalizedScore >= 85
        ? "Excellent"
        : normalizedScore >= 70
          ? "Good"
          : normalizedScore >= 55
            ? "Average"
            : "Needs Improvement",
    breakdown,
    improvements:
      aiFeedback.improvements.length > 0 ? aiFeedback.improvements : ruleBasedImprovements,
    keywordSuggestions: aiFeedback.keywordSuggestions,
    rewrittenSummary: aiFeedback.rewrittenSummary,
    model: aiFeedback.model || null,
  };
};

export const enhanceSummary = async (req, res, next) => {
  try {
    const { summary } = req.validatedBody;
    const { text: enhancedSummary, model: usedModel } = await requestGemini({
      prompt: buildPrompt(summary),
      maxOutputTokens: 220,
    });

    if (!enhancedSummary) {
      throw new ApiError(502, "AI_EMPTY_RESPONSE", "AI did not return enhanced content");
    }

    return sendSuccess(res, {
      message: "Summary enhanced successfully",
      data: { enhancedSummary, model: usedModel },
    });
  } catch (error) {
    return next(error);
  }
};

export const analyzeAtsScore = async (req, res, next) => {
  try {
    const { resumeId, resumeData: rawResumeData, targetRole, includeAiFeedback } = req.validatedBody;
    let resumeData = rawResumeData;

    if (resumeId) {
      const resume = await Resume.findOne({ _id: resumeId, userId: req.userId }).lean();
      if (!resume) {
        throw new ApiError(404, "RESUME_NOT_FOUND", "Resume not found");
      }
      resumeData = resume;
    }

    if (!resumeData || typeof resumeData !== "object") {
      throw new ApiError(400, "VALIDATION_ERROR", "resumeData is required for ATS analysis");
    }

    const atsResult = await computeAtsResult({
      resumeData,
      targetRole,
      includeAiFeedback,
    });

    return sendSuccess(res, {
      message: "ATS score analyzed successfully",
      data: atsResult,
    });
  } catch (error) {
    return next(error);
  }
};

export const improveAtsWithAi = async (req, res, next) => {
  try {
    const { resumeId, resumeData: rawResumeData, targetRole } = req.validatedBody;
    let resumeData = rawResumeData;
    let resumeDoc = null;

    if (resumeId) {
      resumeDoc = await Resume.findOne({ _id: resumeId, userId: req.userId });
      if (!resumeDoc) {
        throw new ApiError(404, "RESUME_NOT_FOUND", "Resume not found");
      }
      resumeData = resumeDoc.toObject();
    }

    if (!resumeData || typeof resumeData !== "object") {
      throw new ApiError(400, "VALIDATION_ERROR", "resumeData is required for ATS improvement");
    }

    const atsBefore = await computeAtsResult({
      resumeData,
      targetRole,
      includeAiFeedback: true,
    });

    const existingSkills = Array.isArray(resumeData.skills)
      ? resumeData.skills.map((item) => String(item || "").trim()).filter(Boolean)
      : [];
    const suggestedSkills = Array.isArray(atsBefore.keywordSuggestions)
      ? atsBefore.keywordSuggestions.map((item) => String(item || "").trim()).filter(Boolean)
      : [];
    const fallbackRoleSkills = getRoleKeywordSuggestions({ targetRole, resumeData });

    const mergedSkills = [...new Set([...existingSkills, ...suggestedSkills])].slice(0, 20);
    const mergedSkillsWithFallback = [...new Set([...mergedSkills, ...fallbackRoleSkills])].slice(0, 20);

    let improvedSummary = atsBefore.rewrittenSummary || "";
    const currentSummary = String(resumeData.professional_summary || "").trim();

    if (!improvedSummary) {
      if (currentSummary) {
        try {
          const { text } = await requestGemini({
            prompt: buildPrompt(currentSummary),
            maxOutputTokens: 220,
          });
          improvedSummary = text;
        } catch {
          improvedSummary = "";
        }
      } else {
        const role = targetRole || resumeData?.personal_info?.profession || "professional";
        const skillsSnippet = mergedSkillsWithFallback.slice(0, 4).join(", ");
        improvedSummary = `Results-oriented ${role} with strong foundation in ${skillsSnippet || "core technical skills"}. Demonstrates ownership, problem-solving, and continuous learning with measurable project outcomes.`;
      }
    }

    const finalSummary = shouldAcceptSummaryUpdate({
      candidate: improvedSummary,
      current: currentSummary,
    })
      ? String(improvedSummary).trim()
      : currentSummary;

    const improvedResume = {
      ...resumeData,
      professional_summary: String(finalSummary).slice(0, 2000),
      skills: mergedSkillsWithFallback,
    };

    const atsAfter = await computeAtsResult({
      resumeData: improvedResume,
      targetRole,
      includeAiFeedback: false,
    });

    // Safety rule: never apply AI changes that reduce ATS score.
    const shouldApplyChanges = atsAfter.score >= atsBefore.score;

    let savedResume = resumeData;
    if (shouldApplyChanges) {
      if (resumeDoc) {
        resumeDoc.professional_summary = improvedResume.professional_summary;
        resumeDoc.skills = improvedResume.skills;
        await resumeDoc.save();
        savedResume = resumeDoc.toObject();
      } else {
        savedResume = improvedResume;
      }
    } else if (resumeDoc) {
      savedResume = resumeDoc.toObject();
    }

    const changedFields = [
      ...(shouldApplyChanges &&
      improvedResume.professional_summary !== (resumeData.professional_summary || "")
        ? ["professional_summary"]
        : []),
      ...(shouldApplyChanges &&
      JSON.stringify(improvedResume.skills) !== JSON.stringify(existingSkills)
        ? ["skills"]
        : []),
    ];

    if (resumeId) {
      await AtsHistory.create({
        userId: req.userId,
        resumeId,
        beforeScore: atsBefore.score,
        afterScore: shouldApplyChanges ? atsAfter.score : atsBefore.score,
        applied: shouldApplyChanges,
        changedFields,
        targetRole: targetRole || "",
      });
    }

    return sendSuccess(res, {
      message: shouldApplyChanges
        ? "ATS improvement applied successfully"
        : "AI suggestion was skipped because it reduced ATS score",
      data: {
        resume: savedResume,
        atsBefore,
        atsAfter: shouldApplyChanges ? atsAfter : atsBefore,
        applied: shouldApplyChanges,
        changedFields,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getAtsHistory = async (req, res, next) => {
  try {
    const { resumeId } = req.validatedParams || req.params;

    const history = await AtsHistory.find({
      userId: req.userId,
      resumeId,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return sendSuccess(res, {
      message: "ATS history fetched successfully",
      data: { history },
    });
  } catch (error) {
    return next(error);
  }
};
