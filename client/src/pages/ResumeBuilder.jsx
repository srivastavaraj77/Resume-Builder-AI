import React, { useState, useEffect } from 'react'
import { dummyResumeData } from '../assets/assets'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeftIcon, Briefcase, ChevronLeft, ChevronRight, FileText, FolderIcon, GraduationCap, Sparkles, User } from 'lucide-react'
import PersonalInfoForm from '../Components/PersonalInfoForm'
import ResumePreview from '../Components/ResumePreview'
import TemplateSelector from '../Components/TemplateSelector'
import ColorPicker from '../Components/ColorPicker'
import ProffesionalSummaeyForm from '../Components/ProffesionalSummaeyForm'
import ExperienceForm from '../Components/ExperienceForm'
import EducationForm from '../Components/EducationForm'

const ResumeBuilder = () => {
  const { resumeId } = useParams()

  // State for storing resume data
  const [resumeData, setResumeData] = useState(() => {
    const existingResume = dummyResumeData.find(resume => resume._id === resumeId)
    return existingResume || {
      _id: resumeId || '',
      title: '',
      personal_info: {},
      proffesional_summary: '',
      experience: [],
      education: [],
      project: [],
      skills: [],
      template: "classic",
      accent_color: "#3B82F6",
      public: false
    }
  })

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

  // Update document title when resume data changes
  useEffect(() => {
    if (resumeData.title) {
      document.title = resumeData.title
    }
  }, [resumeData.title])

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
                    setResumeData={setResumeData}/>
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

                
              </div>

            </div>
          </div>

          {/* RIGHT PANEL - PREVIEW */}
          <div className='lg:col-span-7 max-lg:mt-6'>
            <ResumePreview
              data={resumeData}
              template={resumeData.template}
              accentcolor={resumeData.accent_color}
            />
          </div>

        </div>
      </div>

    </div>
  )
}

export default ResumeBuilder
