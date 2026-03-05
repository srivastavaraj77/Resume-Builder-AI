import {
  FilePenLineIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UploadCloud,
  UploadCloudIcon,
  XIcon,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { aiApi, importApi, resumeApi } from "../lib/api";

const Dashboard = () => {
  const colors = ["#9333ea", "#d97706", "#dc2626", "#0284c7", "#16a34a"];
  const navigate = useNavigate();

  const [allResumes, setAllResumes] = useState([]);
  const [showCreateResume, setShowCreateResume] = useState(false);
  const [showUploadResume, setShowUploadResume] = useState(false);
  const [showImportReview, setShowImportReview] = useState(false);
  const [title, setTitle] = useState("");
  const [resume, setResume] = useState(null);
  const [parsedResumeDraft, setParsedResumeDraft] = useState(null);
  const [editResumeId, setResumeId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isAnalyzingAts, setIsAnalyzingAts] = useState(false);
  const [draftAtsAnalysis, setDraftAtsAnalysis] = useState(null);

  useEffect(() => {
    const loadResumes = async () => {
      try {
        const data = await resumeApi.listMine();
        setAllResumes(data.resumes || []);
      } catch (error) {
        setErrorMessage(error.message || "Failed to load resumes");
      }
    };

    loadResumes();
  }, [navigate]);

  const createResume = async (event) => {
    event.preventDefault();
    try {
      const data = await resumeApi.create({ title });
      setShowCreateResume(false);
      setTitle("");
      navigate(`/app/builder/${data.resume._id}`);
    } catch (error) {
      setErrorMessage(error.message || "Failed to create resume");
    }
  };

  const uploadResume = async (event) => {
    event.preventDefault();
    if (!resume) {
      setErrorMessage("Please choose a PDF file to import.");
      return;
    }

    setIsParsing(true);
    setErrorMessage("");
    try {
      const data = await importApi.previewResumeFromPdf({ title, file: resume });
      setParsedResumeDraft(data.parsedResume);
      setDraftAtsAnalysis(null);
      setShowImportReview(true);
      setShowUploadResume(false);
    } catch (error) {
      setErrorMessage(error.message || "Failed to import resume");
    } finally {
      setIsParsing(false);
    }
  };

  const handleDraftChange = (field, value) => {
    setDraftAtsAnalysis(null);
    setParsedResumeDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePersonalInfoChange = (field, value) => {
    setDraftAtsAnalysis(null);
    setParsedResumeDraft((prev) => ({
      ...prev,
      personal_info: {
        ...(prev?.personal_info || {}),
        [field]: value,
      },
    }));
  };

  const confirmImportResume = async (event) => {
    event.preventDefault();
    if (!parsedResumeDraft) return;

    setIsImporting(true);
    setErrorMessage("");
    try {
      const data = await importApi.confirmResumeImport({
        title,
        parsedResume: {
          ...parsedResumeDraft,
          skills: Array.isArray(parsedResumeDraft.skills)
            ? parsedResumeDraft.skills
            : String(parsedResumeDraft.skills || "")
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
        },
      });
      setShowImportReview(false);
      setParsedResumeDraft(null);
      setDraftAtsAnalysis(null);
      setTitle("");
      setResume(null);
      navigate(`/app/builder/${data.resume._id}`);
    } catch (error) {
      setErrorMessage(error.message || "Failed to confirm import");
    } finally {
      setIsImporting(false);
    }
  };

  const analyzeDraftAts = async () => {
    if (!parsedResumeDraft) return;

    setIsAnalyzingAts(true);
    setErrorMessage("");
    try {
      const data = await aiApi.analyzeAts({
        resumeData: parsedResumeDraft,
        targetRole: parsedResumeDraft?.personal_info?.profession || "",
        includeAiFeedback: true,
      });
      setDraftAtsAnalysis(data);
    } catch (error) {
      setErrorMessage(error.message || "Failed to analyze ATS score");
    } finally {
      setIsAnalyzingAts(false);
    }
  };

  const editTitle = async (event) => {
    event.preventDefault();
    try {
      const data = await resumeApi.update(editResumeId, { title });
      setAllResumes((prev) =>
        prev.map((item) => (item._id === editResumeId ? data.resume : item))
      );
      setResumeId("");
      setTitle("");
    } catch (error) {
      setErrorMessage(error.message || "Failed to update title");
    }
  };

  const deleteResume = async (resumeId) => {
    const confirmed = window.confirm("Are you sure you want to delete this resume?");
    if (!confirmed) return;

    try {
      await resumeApi.remove(resumeId);
      setAllResumes((prev) => prev.filter((item) => item._id !== resumeId));
    } catch (error) {
      setErrorMessage(error.message || "Failed to delete resume");
    }
  };

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-2xl font-medium mb-6 bg-gradient-to-r from-slate-600 to-slate-700 bg-clip-text text-transparent sm:hidden">
          Welcome
        </p>
        {errorMessage && <p className="text-sm text-red-500 mb-4">{errorMessage}</p>}

        <div className="flex gap-4">
          <button
            onClick={() => setShowCreateResume(true)}
            className="w-full bg-white sm:max-w-36 h-48 flex flex-col items-center justify-center rounded-lg gap-2 text-slate-600 border border-dashed border-slate-300 group transition-all duration-300 cursor-pointer"
          >
            <PlusIcon className="size-11 transition-all duration-300 p-2.5 bg-gradient-to-br from-green-300 to-green-500 text-white rounded-full" />
            <p className="text-sm transition-all duration-300">Create Resume</p>
          </button>

          <button
            onClick={() => setShowUploadResume(true)}
            className="w-full bg-white sm:max-w-36 h-48 flex flex-col items-center justify-center rounded-lg gap-2 text-slate-600 border border-dashed border-slate-300 group transition-all duration-300 cursor-pointer"
          >
            <UploadCloudIcon className="size-11 transition-all duration-300 p-2.5 bg-gradient-to-br from-purple-300 to-purple-500 text-white rounded-full" />
            <p className="text-sm transition-all duration-300">Upload Existing</p>
          </button>
        </div>

        <hr className="border-slate-300 my-6 sm:w-[305px]" />
        <div className="grid grid-cols-2 sm:flex flex-wrap gap-4">
          {allResumes.map((item, index) => {
            const baseColor = colors[index % colors.length];
            return (
              <button
                key={item._id}
                onClick={() => navigate(`/app/builder/${item._id}`)}
                className="relative w-full sm:max-w-36 h-48 flex flex-col items-center justify-center rounded-lg gap-2 border group hover:shadow-lg transition-all duration-300 cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${baseColor}10, ${baseColor}40)`,
                  borderColor: baseColor + "40",
                }}
              >
                <FilePenLineIcon
                  className="size-7 group-hover:scale-105 transition-all"
                  style={{ color: baseColor }}
                />
                <p
                  className="text-sm group-hover:scale-105 transition-all px-2 text-center"
                  style={{ color: baseColor }}
                >
                  {item.title}
                </p>
                <p
                  className="absolute bottom-1 text-[11px] text-slate-400 group-hover:text-slate-500 transition-all duration-300 px-2 text-center"
                  style={{ color: baseColor + "90" }}
                >
                  Updated on {new Date(item.updatedAt).toLocaleDateString()}
                </p>
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-1 right-1 group-hover:flex items-center hidden"
                >
                  <TrashIcon
                    onClick={() => deleteResume(item._id)}
                    className="size-7 p-1.5 hover:bg-white/50 rounded text-slate-700 transition-colors"
                  />
                  <PencilIcon
                    onClick={() => {
                      setResumeId(item._id);
                      setTitle(item.title);
                    }}
                    className="size-7 p-1.5 hover:bg-white/50 rounded text-slate-700 transition-colors"
                  />
                </div>
              </button>
            );
          })}
        </div>

        {showCreateResume && (
          <form
            onSubmit={createResume}
            onClick={() => setShowCreateResume(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur bg-opacity-50 z-10 flex items-center justify-center"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative bg-slate-50 border shadow-md rounded-lg w-full max-w-sm p-6"
            >
              <h2 className="text-xl font-bold mb-4">Create a Resume</h2>
              <input
                onChange={(e) => setTitle(e.target.value)}
                value={title}
                type="text"
                placeholder="Enter resume title"
                className="w-full px-4 py-2 mb-4 focus:border-green-600 ring-green-600"
                required
              />
              <button className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                Create Resume
              </button>
              <XIcon
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                onClick={() => {
                  setShowCreateResume(false);
                  setTitle("");
                }}
              />
            </div>
          </form>
        )}

        {showUploadResume && (
          <form
            onSubmit={uploadResume}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 bg-black/70 backdrop-blur bg-opacity-50 z-10 flex items-center justify-center"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative bg-slate-50 border shadow-md rounded-lg w-full max-w-sm p-6"
            >
              <h2 className="text-xl font-bold mb-4">Upload Resume</h2>
              <input
                onChange={(e) => setTitle(e.target.value)}
                value={title}
                type="text"
                placeholder="Enter resume title"
                className="w-full px-4 py-2 mb-4 focus:border-green-600 ring-green-600"
                required
              />

              <div>
                <label htmlFor="resume-input" className="block text-sm text-slate-700">
                  Select resume file
                  <div className="flex flex-col items-center justify-center gap-2 border group text-slate-400 border-slate-400 border-dashed rounded-md p-4 py-10 my-4 cursor-pointer transition-colors">
                    {resume ? (
                      <p className="text-green-700">{resume.name}</p>
                    ) : (
                      <>
                        <UploadCloud className="size-14 stroke-1" />
                        <p>Upload Resume</p>
                      </>
                    )}
                  </div>
                </label>
                <input
                  type="file"
                  id="resume-input"
                  accept=".pdf"
                  hidden
                  onChange={(e) => setResume(e.target.files[0])}
                />
              </div>

              <button
                disabled={isParsing}
                className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isParsing ? "Parsing..." : "Upload Resume"}
              </button>
              <XIcon
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                onClick={() => {
                  setShowUploadResume(false);
                  setTitle("");
                }}
              />
            </div>
          </form>
        )}

        {showImportReview && parsedResumeDraft && (
          <form
            onSubmit={confirmImportResume}
            onClick={() => setShowImportReview(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur bg-opacity-50 z-20 flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white border shadow-md rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl font-bold mb-2">Review Parsed Resume</h2>
              <p className="text-sm text-slate-500 mb-4">
                We parsed your PDF. Review and edit before importing.
              </p>

              <div className="space-y-4">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  type="text"
                  placeholder="Resume title"
                  className="w-full px-3 py-2"
                  required
                />

                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    value={parsedResumeDraft.personal_info?.full_name || ""}
                    onChange={(e) => handlePersonalInfoChange("full_name", e.target.value)}
                    type="text"
                    placeholder="Full name"
                    className="w-full px-3 py-2"
                  />
                  <input
                    value={parsedResumeDraft.personal_info?.email || ""}
                    onChange={(e) => handlePersonalInfoChange("email", e.target.value)}
                    type="email"
                    placeholder="Email"
                    className="w-full px-3 py-2"
                  />
                  <input
                    value={parsedResumeDraft.personal_info?.phone || ""}
                    onChange={(e) => handlePersonalInfoChange("phone", e.target.value)}
                    type="text"
                    placeholder="Phone"
                    className="w-full px-3 py-2"
                  />
                  <input
                    value={parsedResumeDraft.personal_info?.linkedin || ""}
                    onChange={(e) => handlePersonalInfoChange("linkedin", e.target.value)}
                    type="text"
                    placeholder="LinkedIn URL"
                    className="w-full px-3 py-2"
                  />
                </div>

                <textarea
                  value={parsedResumeDraft.professional_summary || ""}
                  onChange={(e) => handleDraftChange("professional_summary", e.target.value)}
                  rows={5}
                  placeholder="Professional summary"
                  className="w-full px-3 py-2"
                />

                <input
                  value={Array.isArray(parsedResumeDraft.skills) ? parsedResumeDraft.skills.join(", ") : ""}
                  onChange={(e) =>
                    handleDraftChange(
                      "skills",
                      e.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean)
                    )
                  }
                  type="text"
                  placeholder="Skills (comma separated)"
                  className="w-full px-3 py-2"
                />

                <div className="text-xs text-slate-500">
                  Parsed experience: {parsedResumeDraft.experience?.length || 0} entries | education:{" "}
                  {parsedResumeDraft.education?.length || 0} | projects:{" "}
                  {parsedResumeDraft.project?.length || 0}
                </div>

                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">ATS Score Check</p>
                    <button
                      type="button"
                      onClick={analyzeDraftAts}
                      disabled={isAnalyzingAts}
                      className="px-3 py-1 text-xs rounded bg-blue-100 text-blue-700 disabled:opacity-50"
                    >
                      {isAnalyzingAts ? "Analyzing..." : "Check ATS Score"}
                    </button>
                  </div>

                  {draftAtsAnalysis && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Score</span>
                        <span className="font-semibold text-slate-800">
                          {draftAtsAnalysis.score}/100 ({draftAtsAnalysis.grade})
                        </span>
                      </div>
                      <div className="space-y-1">
                        {(draftAtsAnalysis.improvements || []).map((item, index) => (
                          <p key={`${item}-${index}`} className="text-xs text-slate-600">
                            • {item}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportReview(false);
                    setParsedResumeDraft(null);
                  }}
                  className="px-4 py-2 rounded border border-slate-300 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isImporting}
                  className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50"
                >
                  {isImporting ? "Importing..." : "Confirm Import"}
                </button>
              </div>

              <XIcon
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                onClick={() => {
                  setShowImportReview(false);
                  setParsedResumeDraft(null);
                }}
              />
            </div>
          </form>
        )}

        {editResumeId && (
          <form
            onSubmit={editTitle}
            onClick={() => setResumeId("")}
            className="fixed inset-0 bg-black/70 backdrop-blur bg-opacity-50 z-10 flex items-center justify-center"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative bg-slate-50 border shadow-md rounded-lg w-full max-w-sm p-6"
            >
              <h2 className="text-xl font-bold mb-4">Edit Resume Title</h2>
              <input
                onChange={(e) => setTitle(e.target.value)}
                value={title}
                type="text"
                placeholder="Enter resume title"
                className="w-full px-4 py-2 mb-4 focus:border-green-600 ring-green-600"
                required
              />
              <button className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                Update Resume
              </button>
              <XIcon
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                onClick={() => {
                  setResumeId("");
                  setTitle("");
                }}
              />
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
