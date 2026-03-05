import pdf from "pdf-parse";
import Resume from "../models/resume.js";
import ApiError from "../utils/ApiError.js";
import { sendSuccess } from "../utils/sendResponse.js";

const HEADING_ALIASES = {
  summary: ["summary", "professional summary", "profile", "objective", "about"],
  experience: ["experience", "work experience", "employment", "professional experience"],
  education: ["education", "academic background", "academics"],
  skills: ["skills", "technical skills", "core skills"],
  projects: ["projects", "project"],
};

const normalizeText = (text) => text.replace(/\r/g, "\n").replace(/\t/g, " ").trim();

const splitLines = (text) =>
  normalizeText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const extractEmail = (text) => text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";

const extractPhone = (text) =>
  text.match(/(\+?\d[\d\s().-]{8,}\d)/)?.[0]?.replace(/\s+/g, " ").trim() || "";

const extractLinkedIn = (text) =>
  text.match(/https?:\/\/(www\.)?linkedin\.com\/[^\s)]+/i)?.[0] || "";

const extractWebsite = (text) =>
  text.match(/https?:\/\/(?!www\.linkedin\.com)[^\s)]+/i)?.[0] || "";

const isHeadingMatch = (line, aliases) => {
  const normalized = line.toLowerCase().replace(/[:|]/g, "").trim();
  return aliases.some((alias) => normalized === alias || normalized.includes(alias));
};

const buildSectionMap = (lines) => {
  const map = {
    summary: [],
    experience: [],
    education: [],
    skills: [],
    projects: [],
    other: [],
  };

  let currentSection = "other";

  for (const line of lines) {
    if (isHeadingMatch(line, HEADING_ALIASES.summary)) {
      currentSection = "summary";
      continue;
    }
    if (isHeadingMatch(line, HEADING_ALIASES.experience)) {
      currentSection = "experience";
      continue;
    }
    if (isHeadingMatch(line, HEADING_ALIASES.education)) {
      currentSection = "education";
      continue;
    }
    if (isHeadingMatch(line, HEADING_ALIASES.skills)) {
      currentSection = "skills";
      continue;
    }
    if (isHeadingMatch(line, HEADING_ALIASES.projects)) {
      currentSection = "projects";
      continue;
    }

    map[currentSection].push(line);
  }

  return map;
};

const extractName = (lines) => {
  const candidate = lines
    .slice(0, 6)
    .find((line) => /^[a-zA-Z][a-zA-Z\s.'-]{2,50}$/.test(line) && !line.includes("@"));
  return candidate || "";
};

const extractSummary = (sectionMap, lines) => {
  const source = sectionMap.summary.length > 0 ? sectionMap.summary : lines.slice(0, 6);
  return source.join(" ").slice(0, 900).trim();
};

const extractSkills = (sectionMap, fullText) => {
  if (sectionMap.skills.length > 0) {
    return sectionMap.skills
      .join(",")
      .split(/[,\u2022|/]/)
      .map((item) => item.replace(/^[-*]\s*/, "").trim())
      .filter((item) => item.length >= 2 && item.length <= 40)
      .slice(0, 20);
  }

  const fallback = fullText.match(/skills[:\s]*([\s\S]{0,500})/i)?.[1] || "";
  return fallback
    .split(/[\n,|•]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2 && item.length <= 40)
    .slice(0, 15);
};

const extractExperience = (sectionMap) => {
  const lines = sectionMap.experience;
  if (lines.length === 0) return [];

  const blocks = [];
  let current = [];

  const boundaryRegex = /(\b(19|20)\d{2}\b)|(\b(present|current)\b)/i;
  for (const line of lines) {
    if (current.length > 0 && boundaryRegex.test(line) && current.length >= 2) {
      blocks.push(current);
      current = [line];
      continue;
    }
    current.push(line);
  }
  if (current.length > 0) blocks.push(current);

  return blocks.slice(0, 5).map((block) => {
    const first = block[0] || "";
    const second = block[1] || "";
    const rest = block.slice(2).join(" ");

    const [position, company] = first.includes(" at ")
      ? first.split(" at ").map((v) => v.trim())
      : [first, second];

    return {
      position: position || "",
      company: company || "",
      start_date: "",
      end_date: "",
      is_current: /present|current/i.test(block.join(" ")),
      description: rest || block.join(" "),
    };
  });
};

const extractEducation = (sectionMap) => {
  const lines = sectionMap.education;
  if (lines.length === 0) return [];

  const blocks = [];
  let current = [];
  for (const line of lines) {
    if (current.length >= 2 && /(college|university|school|institute|academy)/i.test(line)) {
      blocks.push(current);
      current = [line];
      continue;
    }
    current.push(line);
  }
  if (current.length > 0) blocks.push(current);

  return blocks.slice(0, 4).map((block) => {
    const institution = block.find((line) =>
      /(college|university|school|institute|academy)/i.test(line)
    );
    const degree = block.find((line) =>
      /(b\.?tech|bachelor|master|mba|bsc|msc|phd|diploma|certificate)/i.test(line)
    );

    return {
      institution: institution || block[0] || "",
      degree: degree || "",
      field: "",
      graduation_date: "",
      gpa: "",
    };
  });
};

const extractProjects = (sectionMap) => {
  const lines = sectionMap.projects;
  if (lines.length === 0) return [];

  const projects = [];
  let current = null;

  for (const line of lines) {
    const isBullet = /^[-*•]/.test(line);
    if (!isBullet && line.length < 70) {
      if (current) projects.push(current);
      current = { name: line, type: "", description: "" };
      continue;
    }
    if (!current) {
      current = { name: "Project", type: "", description: line.replace(/^[-*•]\s*/, "") };
    } else {
      current.description = `${current.description} ${line.replace(/^[-*•]\s*/, "")}`.trim();
    }
  }
  if (current) projects.push(current);

  return projects.slice(0, 5);
};

const buildParsedResume = ({ title, text }) => {
  const normalized = normalizeText(text);
  const lines = splitLines(normalized);
  const sectionMap = buildSectionMap(lines);

  return {
    title,
    template: "classic",
    accent_color: "#3B82F6",
    professional_summary: extractSummary(sectionMap, lines),
    skills: extractSkills(sectionMap, normalized),
    personal_info: {
      image: "",
      full_name: extractName(lines),
      profession: "",
      email: extractEmail(normalized),
      phone: extractPhone(normalized),
      location: "",
      linkedin: extractLinkedIn(normalized),
      website: extractWebsite(normalized),
    },
    experience: extractExperience(sectionMap),
    education: extractEducation(sectionMap),
    project: extractProjects(sectionMap),
  };
};

const sanitizeParsedResume = (rawResume = {}) => {
  return {
    template: rawResume.template || "classic",
    accent_color: rawResume.accent_color || "#3B82F6",
    professional_summary: String(rawResume.professional_summary || "").slice(0, 3000),
    skills: Array.isArray(rawResume.skills)
      ? rawResume.skills.map((item) => String(item).trim()).filter(Boolean).slice(0, 30)
      : [],
    personal_info: {
      image: "",
      full_name: String(rawResume.personal_info?.full_name || "").slice(0, 120),
      profession: String(rawResume.personal_info?.profession || "").slice(0, 120),
      email: String(rawResume.personal_info?.email || "").slice(0, 120),
      phone: String(rawResume.personal_info?.phone || "").slice(0, 80),
      location: String(rawResume.personal_info?.location || "").slice(0, 120),
      linkedin: String(rawResume.personal_info?.linkedin || "").slice(0, 220),
      website: String(rawResume.personal_info?.website || "").slice(0, 220),
    },
    experience: Array.isArray(rawResume.experience) ? rawResume.experience.slice(0, 8) : [],
    education: Array.isArray(rawResume.education) ? rawResume.education.slice(0, 8) : [],
    project: Array.isArray(rawResume.project) ? rawResume.project.slice(0, 8) : [],
  };
};

export const previewImportedResume = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, "VALIDATION_ERROR", "resume file is required");
    }

    const title = (req.body.title || "").trim() || req.file.originalname.replace(/\.[^.]+$/, "");
    const parsedPdf = await pdf(req.file.buffer);
    const extractedText = parsedPdf?.text?.trim() || "";

    if (!extractedText) {
      throw new ApiError(400, "PARSING_ERROR", "Unable to extract text from uploaded PDF");
    }

    const parsedResume = buildParsedResume({ title, text: extractedText });

    return sendSuccess(res, {
      message: "Resume parsed successfully",
      data: {
        parsedResume,
        extractionMeta: {
          pages: parsedPdf.numpages || null,
          textLength: extractedText.length,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const confirmImportedResume = async (req, res, next) => {
  try {
    const title = String(req.body?.title || "").trim();
    const parsedResume = req.body?.parsedResume;

    if (!parsedResume || typeof parsedResume !== "object") {
      throw new ApiError(400, "VALIDATION_ERROR", "parsedResume object is required");
    }

    const sanitized = sanitizeParsedResume(parsedResume);
    const createdResume = await Resume.create({
      userId: req.userId,
      title: title || parsedResume.title || "Imported Resume",
      ...sanitized,
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: "Resume imported successfully",
      data: { resume: createdResume },
    });
  } catch (error) {
    return next(error);
  }
};
