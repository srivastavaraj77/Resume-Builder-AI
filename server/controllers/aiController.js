import ApiError from "../utils/ApiError.js";
import { sendSuccess } from "../utils/sendResponse.js";

const buildPrompt = (summary) => {
  return [
    "You are an expert resume writer.",
    "Improve the following professional summary for a resume.",
    "Requirements:",
    "1) Keep it truthful and realistic.",
    "2) Keep it concise (3-5 sentences).",
    "3) Use strong professional language.",
    "4) Keep plain text output only (no markdown, no bullets).",
    "",
    "Original summary:",
    summary,
  ].join("\n");
};

export const enhanceSummary = async (req, res, next) => {
  try {
    const { summary } = req.validatedBody;
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

      // Gemini 1.5 model aliases are deprecated; auto-upgrade to a supported flash model.
      if (cleaned.includes("1.5")) {
        return "gemini-2.0-flash";
      }

      return cleaned;
    };

    const tryModel = async (modelName) => {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const geminiResponse = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: buildPrompt(summary) }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 220,
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
    let lastErrorMessage = "";
    let usedModel = "";

    for (const model of [...new Set(modelCandidates)]) {
      const { geminiResponse, payload: attemptPayload } = await tryModel(model);
      if (geminiResponse.ok) {
        payload = attemptPayload;
        usedModel = model;
        break;
      }
      lastErrorMessage =
        attemptPayload?.error?.message || "Gemini request failed while enhancing summary";

      const shouldRetryWithNextModel =
        geminiResponse.status === 404 || geminiResponse.status === 400;
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

    const enhancedSummary =
      payload?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim() || "";

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
