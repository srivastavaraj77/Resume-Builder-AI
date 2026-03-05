import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link, useBlocker } from 'react-router-dom'
import { ArrowLeftIcon, Briefcase, ChevronLeft, ChevronRight, DownloadIcon, EyeIcon, EyeOffIcon, FileText, FolderIcon, GraduationCap, Share2Icon, Sparkles, User } from 'lucide-react'
import html2canvas from 'html2canvas'
import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import PersonalInfoForm from '../Components/PersonalInfoForm'
import ResumePreview from '../Components/ResumePreview'
import TemplateSelector from '../Components/TemplateSelector'
import ColorPicker from '../Components/ColorPicker'
import ProffesionalSummaeyForm from '../Components/ProffesionalSummaeyForm'
import ExperienceForm from '../Components/ExperienceForm'
import EducationForm from '../Components/EducationForm'
import ProjectForm from '../Components/ProjectForm'
import SkillsForm from '../Components/SkillsForm'
import Loader from '../Components/Loader'
import { aiApi, resumeApi } from '../lib/api'

const ResumeBuilder = () => {
  const { resumeId } = useParams()

  const [resumeData, setResumeData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEnhancingSummary, setIsEnhancingSummary] = useState(false)
  const [saveStatus, setSaveStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const lastSavedSnapshotRef = useRef(null)
      
  // Active section index
  const [activeSectionIndex, setActiveSectionIndex] = useState(0)
  const [removeBackground, setRemoveBackground] = useState(false)

  // Resume builder sections
  const sections = [
    { id: "personal", name: "Personal Info", icon: User },
    { id: "summary", name: "Summary", icon: FileText },
    { id: "experience", name: "Experience", icon: Briefcase },
    { id: "education", name: "Education", icon: GraduationCap },
    { id: "projects", name: "Projects", icon: FolderIcon },
    { id: "skills", name: "Skills", icon: Sparkles },
  ]

  // Currently active section
  const activeSection = sections[activeSectionIndex]
  const hasUnsavedChanges = saveStatus === 'pending' || saveStatus === 'saving'
  const blocker = useBlocker(hasUnsavedChanges)

  const getSavableResumeData = useCallback((data) => {
    if (!data) return null

    return {
      title: data.title,
      template: data.template,
      accent_color: data.accent_color,
      professional_summary: data.professional_summary,
      personal_info: data.personal_info,
      experience: data.experience,
      education: data.education,
      project: data.project,
      skills: data.skills,
    }
  }, [])

  useEffect(() => {
    const loadResume = async () => {
      try {
        const data = await resumeApi.getMineById(resumeId)
        setResumeData(data.resume)
        lastSavedSnapshotRef.current = JSON.stringify(getSavableResumeData(data.resume))
        setSaveStatus('saved')
      } catch (error) {
        setErrorMessage(error.message || "Failed to load resume")
        setSaveStatus('error')
      } finally {
        setIsLoading(false)
      }
    }

    loadResume()
  }, [getSavableResumeData, resumeId])

  // Update document title when resume data changes
  useEffect(() => {
    if (resumeData?.title) {
      document.title = resumeData.title
    }
  }, [resumeData?.title])

  const changeResumeVisibility = async ()  => {
    try {
      const data = await resumeApi.updateVisibility(resumeId, !resumeData.public)
      setResumeData(data.resume)
    } catch (error) {
      setErrorMessage(error.message || "Failed to update visibility")
    }
  }

  const handleShare = () => {
    const frontendUrl = window.location.href.split('/app/')[0]
    const resumeUrl = frontendUrl + '/view/' + resumeId;

    if (navigator.share){
      navigator.share({url: resumeUrl, text: "My Resume"})
    } else{
      alert('Share not supported on this browser')
    }
  }
   {/* Function to download resume   */}
  const downloadResume = async ()=>{
    const resumeElement = document.getElementById("resume-preview")

    if (!resumeElement) {
      alert("Resume preview not ready yet. Please try again.")
      return
    }

    try {
      const pdf = new jsPDF("p", "pt", "letter")
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      let imageData
      let sourceWidth
      let sourceHeight
      let imageFormat = "PNG"

      try {
        imageData = await toPng(resumeElement, {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: "#ffffff",
        })
        sourceWidth = resumeElement.offsetWidth
        sourceHeight = resumeElement.scrollHeight
      } catch (primaryError) {
        console.warn("html-to-image failed, falling back to html2canvas:", primaryError)
        const canvas = await html2canvas(resumeElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        })
        imageData = canvas.toDataURL("image/jpeg", 0.98)
        sourceWidth = canvas.width
        sourceHeight = canvas.height
        imageFormat = "JPEG"
      }

      const imageWidth = pageWidth
      const imageHeight = (sourceHeight * imageWidth) / sourceWidth

      let remainingHeight = imageHeight
      let yOffset = 0

      pdf.addImage(imageData, imageFormat, 0, yOffset, imageWidth, imageHeight)
      remainingHeight -= pageHeight

      while (remainingHeight > 0) {
        yOffset = remainingHeight - imageHeight
        pdf.addPage()
        pdf.addImage(imageData, imageFormat, 0, yOffset, imageWidth, imageHeight)
        remainingHeight -= pageHeight
      }

      const fileName = `${(resumeData.title || "resume").trim().replace(/\s+/g, "-")}.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error("Failed to generate PDF:", error?.message || error, error)
      alert("Unable to generate PDF. Please try again.")
    }
  }

  const saveResume = useCallback(async (overrideResumeData = null) => {
    const targetResumeData = overrideResumeData || resumeData
    if (!targetResumeData) return

    const payload = getSavableResumeData(targetResumeData)
    if (!payload) return

    setIsSaving(true)
    setSaveStatus('saving')
    setErrorMessage('')
    try {
      const data = await resumeApi.update(resumeId, payload)
      lastSavedSnapshotRef.current = JSON.stringify(getSavableResumeData(data.resume))
      setResumeData(data.resume)
      setSaveStatus('saved')
    } catch (error) {
      setSaveStatus('error')
      setErrorMessage(error.message || "Failed to save resume")
    } finally {
      setIsSaving(false)
    }
  }, [getSavableResumeData, resumeData, resumeId])

  useEffect(() => {
    if (isLoading || !resumeData || isSaving) return

    const currentSnapshot = JSON.stringify(getSavableResumeData(resumeData))
    if (currentSnapshot === lastSavedSnapshotRef.current) return

    setSaveStatus('pending')
    const debounceTimer = setTimeout(() => {
      saveResume(resumeData)
    }, 1500)

    return () => clearTimeout(debounceTimer)
  }, [getSavableResumeData, isLoading, isSaving, resumeData, saveResume])

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!hasUnsavedChanges) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  useEffect(() => {
    if (blocker.state === 'blocked') {
      const shouldLeave = window.confirm('You have unsaved changes. Do you still want to leave this page?')
      if (shouldLeave) {
        blocker.proceed()
      } else {
        blocker.reset()
      }
    }
  }, [blocker])

  const handleEnhanceSummary = async () => {
    const currentSummary = resumeData?.professional_summary || ""
    if (!currentSummary.trim()) return

    setIsEnhancingSummary(true)
    setErrorMessage('')
    try {
      const data = await aiApi.enhanceSummary(currentSummary)
      setResumeData((prev) => ({
        ...prev,
        professional_summary: data.enhancedSummary,
      }))
    } catch (error) {
      setErrorMessage(error.message || "AI enhancement failed")
    } finally {
      setIsEnhancingSummary(false)
    }
  }

  if (isLoading) return <Loader />
  if (!resumeData) {
    return (
      <div className='h-screen flex items-center justify-center text-red-500'>
        {errorMessage || "Resume not found"}
      </div>
    )
  }

  return (
    <div>

      {/* Back button */}
      <div className='max-w-7xl mx-auto px-4 py-6'>
        <Link to='/app' className='inline-flex gap-2 items-center text-slate-500 hover:text-slate-700 transition-all'>
          <ArrowLeftIcon className='size-4' /> Back to Dashboard
        </Link>
      </div>

      {/* Two Column Layout */}
      <div className='max-w-7xl mx-auto px-4 pb-8'>
        {errorMessage && <p className='text-sm text-red-500 mb-3'>{errorMessage}</p>}
        <div className='grid lg:grid-cols-12 gap-8'>

          {/* LEFT PANEL - FORM */}
          <div className='relative lg:col-span-5 rounded-lg overflow-hidden'>
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 pt-1'>

              {/* Progress Bar */}
              <hr className='absolute top-0 right-0 border-2 border-gray-200' />
              <hr
                className='absolute top-0 left-0 h-1 bg-gradient-to-r from-green-500 to-green-600 border-none transition-all duration-200'
                style={{ width: `${activeSectionIndex * 100 / (sections.length - 1)}%` }}
              />

              {/* Section Navigation */}
              <div className='flex justify-between items-center mb-6 border-b border-gray-300 py-1'>
              <div className='flex justify-between items-center mb-6 border-b border-gray-300 py-1'>
                <TemplateSelector 
                  selectedTemplate={resumeData.template} 
                  onChange={(template) => setResumeData(prev => ({...prev, template}))}  />

                  <ColorPicker selectedColor={resumeData.accent_color} 
                  onChange={(color)=>setResumeData(prev =>  ({...prev, accent_color:color}))}/>
              </div>
              
              <div className='flex items-center justify-between mb-6'>
                {activeSectionIndex !== 0 && (
                  <button
                    onClick={() => setActiveSectionIndex(prev => Math.max(prev - 1, 0))}
                    className='flex items-center gap-1 p-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all'
                  >
                    <ChevronLeft className='size-4' /> Previous
                  </button>
                )}

                <button
                  onClick={() => setActiveSectionIndex(prev => Math.min(prev + 1, sections.length - 1))}
                  className={`flex items-center gap-1 p-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all ${activeSectionIndex === sections.length - 1 && 'opacity-50'}`}
                  disabled={activeSectionIndex === sections.length - 1}
                >
                  Next <ChevronRight className='size-4' />
                </button>
              </div>
              </div>

              {/* Form Content */}
              <div className='space-y-6'>
                {activeSection.id === 'personal' && (
                  <PersonalInfoForm
                    data={resumeData.personal_info}
                    onChange={(data) => setResumeData(prev => ({ ...prev, personal_info: data }))}
                    removeBackground={removeBackground}
                    setRemoveBackground={setRemoveBackground}
                  />
                )}

                {
                  activeSection.id === 'summary' && (
                    <ProffesionalSummaeyForm data={resumeData.professional_summary}
                    onChange={(data)=> setResumeData(prev=> ({...prev, professional_summary: data}))}
                    onEnhance={handleEnhanceSummary}
                    isEnhancing={isEnhancingSummary} />
                  )
                }

{
                  activeSection.id === 'experience' && (
                    <ExperienceForm data={resumeData.experience}
                    onChange={(data)=> setResumeData(prev=> ({...prev, experience: data}))} 
                    setResumeData={setResumeData}/>
                  )
                }

{
                  activeSection.id === 'education' && (
                    <EducationForm data={resumeData.education}
                    onChange={(data)=> setResumeData(prev=> ({...prev, education: data}))} 
                    setResumeData={setResumeData}/>
                  )
                }
{
                  activeSection.id === 'projects' && (
                    <ProjectForm data={resumeData.project}
                    onChange={(data)=> setResumeData(prev=> ({...prev, project: data}))} 
                    setResumeData={setResumeData}/>
                  )
                }

{
                  activeSection.id === 'skills' && (
                    <SkillsForm data={resumeData.skills}
                    onChange={(data)=> setResumeData(prev=> ({...prev, skills: data}))} 
                    setResumeData={setResumeData}/>
                  )
                }
                
              </div>
              <button onClick={() => saveResume()} disabled={isSaving} className='bg-gradient-to-br from-green-100 to-green-200 ring-green
              -300 text-green-600 ring hover:ring-green-400 transition-all rounded-md px-6 py-2
              mt-6 text-sm
              disabled:opacity-50'> {isSaving ? 'Saving...' : 'Save Changes'}</button>
              <p className='text-xs mt-2 text-slate-500'>
                {saveStatus === 'saving' && 'Saving changes...'}
                {saveStatus === 'saved' && 'All changes saved'}
                {saveStatus === 'pending' && 'Unsaved changes'}
                {saveStatus === 'error' && 'Auto-save failed, please click Save Changes'}
                {saveStatus === 'idle' && 'Ready'}
              </p>

            </div>
          </div>

          {/* RIGHT PANEL - PREVIEW */}
          <div className='lg:col-span-7 max-lg:mt-6'>

            <div className='relative w-full'>
              <div className='absolute bottom-3 left-0 right-0 flex items-center
              justify-end gap-2'>
                {resumeData.public && (
                  <button onClick={handleShare} className='flex items-center p-2 px-4 gap-2 text-xs
                  bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600
                  rounded-lg ring-blue-300 hover:ring transition-colors'>
                    <Share2Icon className='size-4'/> Share
                  </button>
                )}

                <button onClick={changeResumeVisibility} className='flex items-center p-2 px-4 gap-2 text-xs bg-gradient-to-br
                from-purple-100 to-purple-200 text-purple-600 ring-purple-300 rounded-lg 
                hover:ring transition-colors'>
                  {resumeData.public ? <EyeIcon className='size-4'/> :
                  <EyeOffIcon className='size-4'/>}
                  {resumeData.public ? 'Public': 'Private'}
                </button>

                <button onClick={downloadResume} className='flex items-center gap-2 px-6 py-2 text-xs bg-gradient-to-br
                from-green-100 to-green-200 text-green-600 rounded-lg ring-green-300 hover:ring transition-colors'>

                  <DownloadIcon className='size-4'/> Download
                </button>
              </div>
            </div>
            <ResumePreview
              data={resumeData}
              template={resumeData.template}
              accentColor={resumeData.accent_color}
            />
          </div>

        </div>
      </div>

    </div>
  )
}

export default ResumeBuilder
