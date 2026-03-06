import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams, Link, useBlocker } from 'react-router-dom'
import { ArrowLeftIcon, Award, Briefcase, CheckCircle2, ChevronLeft, ChevronRight, Circle, Crown, DownloadIcon, EyeIcon, EyeOffIcon, FileText, FolderIcon, Gauge, GraduationCap, Share2Icon, Sparkles, User } from 'lucide-react'
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
import CertificationForm from '../Components/CertificationForm'
import Loader from '../Components/Loader'
import { aiApi, paymentApi, resumeApi } from '../lib/api'
import { loadRazorpayCheckoutScript } from '../lib/razorpay'

const ResumeBuilder = () => {
  const { resumeId } = useParams()

  const [resumeData, setResumeData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEnhancingSummary, setIsEnhancingSummary] = useState(false)
  const [isAnalyzingAts, setIsAnalyzingAts] = useState(false)
  const [isImprovingAts, setIsImprovingAts] = useState(false)
  const [isUndoingAi, setIsUndoingAi] = useState(false)
  const [atsAnalysis, setAtsAnalysis] = useState(null)
  const [atsHistory, setAtsHistory] = useState([])
  const [lastAiSnapshot, setLastAiSnapshot] = useState(null)
  const [saveStatus, setSaveStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false)
  const [isProPromptOpen, setIsProPromptOpen] = useState(false)
  const lastSavedSnapshotRef = useRef(null)
      
  // Active section index
  const [activeSectionIndex, setActiveSectionIndex] = useState(0)
  const [removeBackground, setRemoveBackground] = useState(false)
  const [accountPlan, setAccountPlan] = useState(() => {
    const rawUser = localStorage.getItem('user')
    if (!rawUser) return 'free'
    try {
      const user = JSON.parse(rawUser)
      return user?.plan === 'pro' ? 'pro' : 'free'
    } catch {
      return 'free'
    }
  })

  const normalizeResumeForUi = useCallback((rawResume) => {
    const safeImage =
      typeof rawResume?.personal_info?.image === 'string' ? rawResume.personal_info.image : ''

    return {
      ...rawResume,
      is_fresher: Boolean(rawResume?.is_fresher),
      personal_info: {
        ...(rawResume?.personal_info || {}),
        image: safeImage,
      },
      certifications: rawResume?.certifications || [],
    }
  }, [])

  // Resume builder sections
  const sections = [
    { id: "personal", name: "Personal Info", icon: User },
    { id: "summary", name: "Summary", icon: FileText },
    { id: "experience", name: "Experience", icon: Briefcase },
    { id: "education", name: "Education", icon: GraduationCap },
    { id: "certifications", name: "Certifications", icon: Award },
    { id: "projects", name: "Projects", icon: FolderIcon },
    { id: "skills", name: "Skills", icon: Sparkles },
  ]

  // Currently active section
  const activeSection = sections[activeSectionIndex]
  const hasUnsavedChanges = saveStatus === 'pending' || saveStatus === 'saving'
  const blocker = useBlocker(hasUnsavedChanges)

  const completionStatus = useMemo(() => {
    if (!resumeData) {
      return {
        personal: false,
        summary: false,
        experience: false,
        education: false,
        projects: false,
        skills: false,
      }
    }

    const personalInfo = resumeData.personal_info || {}
    const personal =
      Boolean(String(personalInfo.full_name || '').trim()) &&
      Boolean(String(personalInfo.email || '').trim()) &&
      Boolean(String(personalInfo.phone || '').trim())

    const summary = String(resumeData.professional_summary || '').trim().length >= 30

    const experience = Array.isArray(resumeData.experience)
      ? Boolean(resumeData.is_fresher) ||
        resumeData.experience.some(
          (item) =>
            String(item?.company || '').trim() &&
            String(item?.position || '').trim() &&
            String(item?.description || '').trim()
        )
      : false

    const education = Array.isArray(resumeData.education)
      ? resumeData.education.some(
          (item) => String(item?.institution || '').trim() && String(item?.degree || '').trim()
        )
      : false

    const projects = Array.isArray(resumeData.project)
      ? resumeData.project.some(
          (item) => String(item?.name || '').trim() && String(item?.description || '').trim()
        )
      : false

    const certifications = Array.isArray(resumeData.certifications)
      ? resumeData.certifications.some((item) => String(item?.name || '').trim())
      : false

    const skills = Array.isArray(resumeData.skills)
      ? resumeData.skills.filter((skill) => String(skill || '').trim()).length >= 3
      : false

    return { personal, summary, experience, education, certifications, projects, skills }
  }, [resumeData])

  const completedSectionsCount = useMemo(
    () => Object.values(completionStatus).filter(Boolean).length,
    [completionStatus]
  )
  const completionPercent = Math.round((completedSectionsCount / sections.length) * 100)
  const isResumeComplete = completedSectionsCount === sections.length

  const getSavableResumeData = useCallback((data) => {
    if (!data) return null

    return {
      title: data.title,
      template: data.template,
      accent_color: data.accent_color,
      is_fresher: Boolean(data.is_fresher),
      professional_summary: data.professional_summary,
      personal_info: data.personal_info,
      experience: data.experience,
      education: data.education,
      project: data.project,
      skills: data.skills,
      certifications: data.certifications || [],
    }
  }, [])

  useEffect(() => {
    const loadResume = async () => {
      try {
        const data = await resumeApi.getMineById(resumeId)
        const normalizedResume = normalizeResumeForUi(data.resume)
        setResumeData(normalizedResume)
        lastSavedSnapshotRef.current = JSON.stringify(getSavableResumeData(normalizedResume))
        setSaveStatus('saved')
      } catch (error) {
        setErrorMessage(error.message || "Failed to load resume")
        setSaveStatus('error')
      } finally {
        setIsLoading(false)
      }
    }

    loadResume()
  }, [getSavableResumeData, normalizeResumeForUi, resumeId])

  const loadAtsHistory = useCallback(async () => {
    try {
      const data = await aiApi.getAtsHistory(resumeId)
      setAtsHistory(data?.history || [])
    } catch {
      setAtsHistory([])
    }
  }, [resumeId])

  useEffect(() => {
    loadAtsHistory()
  }, [loadAtsHistory])

  useEffect(() => {
    const syncPlan = async () => {
      try {
        const data = await paymentApi.getStatus()
        const user = data?.user
        if (!user) return
        setAccountPlan(user.plan === 'pro' ? 'pro' : 'free')
        localStorage.setItem('user', JSON.stringify(user))
      } catch {
        // Silent: plan fallback already comes from localStorage.
      }
    }

    syncPlan()
  }, [])

  // Update document title when resume data changes
  useEffect(() => {
    if (resumeData?.title) {
      document.title = resumeData.title
    }
  }, [resumeData?.title])

  const changeResumeVisibility = async ()  => {
    try {
      const data = await resumeApi.updateVisibility(resumeId, !resumeData.public)
      setResumeData(normalizeResumeForUi(data.resume))
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
    try {
      await resumeApi.checkDownloadAccess(resumeId)
    } catch (error) {
      setErrorMessage(error.message || 'Upgrade to Pro to download resume')
      return
    }

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

  const handleUpgradeToPro = async () => {
    setIsCreatingCheckout(true)
    setErrorMessage('')
    try {
      const isRazorpayLoaded = await loadRazorpayCheckoutScript()
      if (!isRazorpayLoaded || !window.Razorpay) {
        throw new Error('Unable to load Razorpay checkout. Please try again.')
      }

      const data = await paymentApi.createOrder()
      if (!data?.orderId || !data?.keyId) {
        throw new Error('Unable to create order. Please try again.')
      }

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Resume Builder',
        description: 'Upgrade to Pro',
        order_id: data.orderId,
        prefill: data.prefill || {},
        theme: { color: '#1f2937' },
        handler: async (response) => {
          try {
            await paymentApi.verifyPayment(response)
            const status = await paymentApi.getStatus()
            const user = status?.user
            if (user) {
              localStorage.setItem('user', JSON.stringify(user))
              setAccountPlan(user.plan === 'pro' ? 'pro' : 'free')
            }
            setErrorMessage('')
          } catch (verificationError) {
            setErrorMessage(verificationError.message || 'Payment verification failed. Please contact support.')
          }
        },
      })

      rzp.on('payment.failed', () => {
        setErrorMessage('Payment failed. Please try again.')
      })

      rzp.open()
      return
    } catch (error) {
      setErrorMessage(error.message || 'Unable to start payment flow')
    } finally {
      setIsCreatingCheckout(false)
    }
  }

  const handleLockedTemplateClick = () => {
    setIsProPromptOpen(true)
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
      const mergedResume = normalizeResumeForUi({
        ...data.resume,
        is_fresher:
          typeof data.resume?.is_fresher === 'boolean'
            ? data.resume.is_fresher
            : Boolean(targetResumeData?.is_fresher),
      })
      lastSavedSnapshotRef.current = JSON.stringify(getSavableResumeData(mergedResume))
      setResumeData(mergedResume)
      setSaveStatus('saved')
    } catch (error) {
      setSaveStatus('error')
      setErrorMessage(error.message || "Failed to save resume")
    } finally {
      setIsSaving(false)
    }
  }, [getSavableResumeData, normalizeResumeForUi, resumeData, resumeId])

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

  const handleAnalyzeAts = async () => {
    if (!resumeData) return
    if (!isResumeComplete) {
      setErrorMessage('Complete all resume sections before checking overall ATS score')
      return
    }

    setIsAnalyzingAts(true)
    setErrorMessage('')
    try {
      const data = await aiApi.analyzeAts({
        resumeId,
        resumeData: getSavableResumeData(resumeData),
        targetRole: resumeData?.personal_info?.profession || '',
        includeAiFeedback: true,
      })
      setAtsAnalysis(data)
    } catch (error) {
      setErrorMessage(error.message || "ATS analysis failed")
    } finally {
      setIsAnalyzingAts(false)
    }
  }

  const handleImproveAts = async () => {
    if (!resumeData) return
    if (!isResumeComplete) {
      setErrorMessage('Complete all resume sections before improving ATS score')
      return
    }

    setIsImprovingAts(true)
    setErrorMessage('')
    try {
      const snapshotBeforeImprove = JSON.parse(JSON.stringify(resumeData))
      const data = await aiApi.improveAts({
        resumeId,
        resumeData: getSavableResumeData(resumeData),
        targetRole: resumeData?.personal_info?.profession || '',
      })

      if (!data.applied) {
        setAtsAnalysis(data.atsAfter)
        setErrorMessage('AI could not find a safe improvement that keeps or increases ATS score.')
        return
      }

      const normalizedResume = normalizeResumeForUi(data.resume)
      setResumeData(normalizedResume)
      lastSavedSnapshotRef.current = JSON.stringify(getSavableResumeData(normalizedResume))
      setSaveStatus('saved')
      setAtsAnalysis(data.atsAfter)
      setLastAiSnapshot(snapshotBeforeImprove)
      loadAtsHistory()
    } catch (error) {
      setErrorMessage(error.message || "ATS improvement failed")
    } finally {
      setIsImprovingAts(false)
    }
  }

  const handleUndoLastAiChange = async () => {
    if (!lastAiSnapshot) {
      setErrorMessage('No AI change is available to undo.')
      return
    }

    setIsUndoingAi(true)
    setErrorMessage('')
    try {
      const payload = getSavableResumeData(lastAiSnapshot)
      const data = await resumeApi.update(resumeId, payload)
      const restoredResume = normalizeResumeForUi(data.resume)
      setResumeData(restoredResume)
      lastSavedSnapshotRef.current = JSON.stringify(getSavableResumeData(restoredResume))
      setSaveStatus('saved')
      setLastAiSnapshot(null)
      setAtsAnalysis(null)
    } catch (error) {
      setErrorMessage(error.message || 'Failed to undo AI changes')
    } finally {
      setIsUndoingAi(false)
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
      {isProPromptOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4'>
          <div className='w-full max-w-sm rounded-xl bg-white p-6 shadow-xl border border-slate-200 text-center'>
            <p className='text-lg font-semibold text-slate-900'>Be a PRO</p>
            <p className='mt-2 text-sm text-slate-600'>
              This template is available only for Pro users.
            </p>
            <div className='mt-5 flex items-center justify-center gap-2'>
              <button
                type='button'
                onClick={() => setIsProPromptOpen(false)}
                className='px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50'
              >
                Not now
              </button>
              <button
                type='button'
                onClick={async () => {
                  setIsProPromptOpen(false)
                  await handleUpgradeToPro()
                }}
                className='inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded bg-amber-200 text-amber-900 hover:bg-amber-300'
              >
                <Crown className='size-4' />
                Go Pro
              </button>
            </div>
          </div>
        </div>
      )}

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
                  onChange={(template) => setResumeData(prev => ({...prev, template}))}
                  userPlan={accountPlan}
                  onLockedTemplateClick={handleLockedTemplateClick}
                />

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
                    isFresher={Boolean(resumeData.is_fresher)}
                    onFresherChange={(isFresher) =>
                      setResumeData((prev) => ({ ...prev, is_fresher: isFresher }))
                    }/>
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
                  activeSection.id === 'certifications' && (
                    <CertificationForm
                      data={resumeData.certifications || []}
                      onChange={(data)=> setResumeData(prev=> ({...prev, certifications: data}))}
                    />
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

              <div className='mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3'>
                <div className='flex items-center justify-between text-sm'>
                  <p className='font-semibold text-slate-800'>Resume Completion</p>
                  <p className='font-semibold text-slate-700'>{completionPercent}%</p>
                </div>
                <div className='mt-2 h-2 w-full rounded bg-slate-200'>
                  <div
                    className='h-2 rounded bg-gradient-to-r from-green-500 to-green-600 transition-all'
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>

                {isResumeComplete ? (
                  <button
                    onClick={handleAnalyzeAts}
                    disabled={isAnalyzingAts}
                    className='mt-3 flex items-center gap-2 px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded
                    hover:bg-blue-200 transition-colors disabled:opacity-50'
                  >
                    <Gauge className='size-4' />
                    {isAnalyzingAts ? 'Analyzing ATS...' : 'Check Overall ATS Score'}
                  </button>
                ) : (
                  <p className='mt-3 text-xs text-slate-500'>
                    Complete all sections to unlock overall ATS score.
                  </p>
                )}

                <div className='mt-3 border-t border-slate-200 pt-3'>
                  <p className='text-xs font-semibold text-slate-700 mb-2'>Completion Checklist</p>
                  <div className='space-y-1'>
                    {sections.map((section, index) => {
                      const isComplete = Boolean(completionStatus[section.id])
                      return (
                        <button
                          key={section.id}
                          type='button'
                          onClick={() => setActiveSectionIndex(index)}
                          className={`w-full flex items-center justify-between text-xs px-2 py-1.5 rounded transition-colors ${
                            isComplete
                              ? 'bg-green-50 text-green-700 hover:bg-green-100'
                              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          }`}
                        >
                          <span className='flex items-center gap-2'>
                            {isComplete ? <CheckCircle2 className='size-3.5' /> : <Circle className='size-3.5' />}
                            {section.name}
                          </span>
                          <span>{isComplete ? 'Done' : 'Pending'}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {atsAnalysis && (
                <div className='mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3'>
                  <div className='flex items-center justify-between'>
                    <p className='text-sm font-semibold text-slate-800'>Overall ATS Score</p>
                    <div className='text-right'>
                      <p className='text-xl font-bold text-slate-900'>{atsAnalysis.score}/100</p>
                      <p className='text-xs text-slate-500'>{atsAnalysis.grade}</p>
                    </div>
                  </div>

                  <div className='space-y-1'>
                    {(atsAnalysis.breakdown || []).map((item) => (
                      <div key={item.id} className='flex items-center justify-between text-xs'>
                        <span className='text-slate-600'>{item.label}</span>
                        <span className='font-medium text-slate-800'>{item.score}/{item.maxScore}</span>
                      </div>
                    ))}
                  </div>

                  {(atsAnalysis.improvements || []).length > 0 && (
                    <div>
                      <p className='text-xs font-semibold text-slate-700 mb-1'>How to improve</p>
                      <ul className='list-disc pl-4 text-xs text-slate-600 space-y-1'>
                        {atsAnalysis.improvements.map((item, index) => (
                          <li key={`${item}-${index}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    type='button'
                    onClick={handleImproveAts}
                    disabled={isImprovingAts}
                    className='w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 text-xs bg-purple-100 text-purple-700 rounded
                    hover:bg-purple-200 transition-colors disabled:opacity-50'
                  >
                    <Sparkles className='size-4' />
                    {isImprovingAts ? 'Improving ATS...' : 'Improve ATS using AI'}
                  </button>

                  {lastAiSnapshot && (
                    <button
                      type='button'
                      onClick={handleUndoLastAiChange}
                      disabled={isUndoingAi}
                      className='w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 text-xs bg-slate-100 text-slate-700 rounded
                      hover:bg-slate-200 transition-colors disabled:opacity-50'
                    >
                      {isUndoingAi ? 'Undoing...' : 'Undo Last AI Change'}
                    </button>
                  )}
                </div>
              )}

              {atsHistory.length > 0 && (
                <div className='mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <p className='text-sm font-semibold text-slate-800'>ATS History</p>
                    <p className='text-xs text-slate-500'>Last {atsHistory.length} runs</p>
                  </div>
                  <div className='space-y-2'>
                    {atsHistory.map((item) => (
                      <div key={item._id} className='rounded border border-slate-200 bg-white px-2 py-1.5 text-xs'>
                        <div className='flex items-center justify-between'>
                          <span className='text-slate-600'>
                            {new Date(item.createdAt).toLocaleString()}
                          </span>
                          <span className={item.applied ? 'text-green-700' : 'text-amber-700'}>
                            {item.applied ? 'Applied' : 'Skipped'}
                          </span>
                        </div>
                        <div className='mt-1 text-slate-700'>
                          Score: {item.beforeScore} → {item.afterScore}
                        </div>
                        {Array.isArray(item.changedFields) && item.changedFields.length > 0 && (
                          <div className='text-slate-500'>
                            Changed: {item.changedFields.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* RIGHT PANEL - PREVIEW */}
          <div className='lg:col-span-7 max-lg:mt-6'>

            <div className='relative w-full'>
              <div className='absolute bottom-3 left-0 right-0 flex items-center
              justify-end gap-2'>
                {accountPlan !== 'pro' ? (
                  <button
                    type='button'
                    onClick={handleUpgradeToPro}
                    disabled={isCreatingCheckout}
                    className={`inline-flex items-center gap-1.5 p-2 px-4 text-xs rounded-lg bg-amber-200 text-amber-900 ring-amber-300 hover:ring transition-all duration-300 disabled:opacity-60 ${
                      resumeData.public ? 'order-2' : 'order-1'
                    }`}
                  >
                    <Crown className='size-4' />
                    {isCreatingCheckout ? 'Opening payment...' : 'Go Pro'}
                  </button>
                ) : (
                  <div
                    className={`inline-flex items-center gap-1.5 p-2 px-4 text-xs rounded-lg bg-amber-100 text-amber-800 ring-1 ring-amber-300 transition-all duration-300 ${
                      resumeData.public ? 'order-2' : 'order-1'
                    }`}
                  >
                    <span>You're a PRO</span>
                    <Crown className='size-4' />
                  </div>
                )}

                {resumeData.public && (
                  <button onClick={handleShare} className='order-2 flex items-center p-2 px-4 gap-2 text-xs
                  bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600
                  rounded-lg ring-blue-300 hover:ring transition-colors duration-300'>
                    <Share2Icon className='size-4'/> Share
                  </button>
                )}

                <button onClick={changeResumeVisibility} className={`flex items-center p-2 px-4 gap-2 text-xs bg-gradient-to-br
                from-purple-100 to-purple-200 text-purple-600 ring-purple-300 rounded-lg 
                hover:ring transition-colors duration-300 ${resumeData.public ? 'order-3' : 'order-2'}`}>
                  {resumeData.public ? <EyeIcon className='size-4'/> :
                  <EyeOffIcon className='size-4'/>}
                  {resumeData.public ? 'Public': 'Private'}
                </button>

                <button
                  onClick={downloadResume}
                  className={`flex items-center gap-2 px-6 py-2 text-xs bg-gradient-to-br from-green-100 to-green-200 text-green-600 rounded-lg ring-green-300 hover:ring transition-colors duration-300 ${resumeData.public ? 'order-4' : accountPlan !== 'pro' ? 'order-3' : 'order-2'}`}
                >
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
