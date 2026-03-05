import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ResumePreview from '../Components/ResumePreview'
import { ArrowLeftIcon, Loader } from 'lucide-react'
import { resumeApi } from '../lib/api'

const Preview = () => {

  const {resumeId} = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [resumeData, setResumeData] = useState(null)

  useEffect(() => {
    const loadPublicResume = async () => {
      try {
        const data = await resumeApi.getPublicById(resumeId)
        setResumeData(data.resume || null)
      } catch {
        setResumeData(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadPublicResume()
  }, [resumeId])

  return resumeData ? (
    <div className='bg-slate-100'>
      <div className='max-w-3xl mx-auto py-10'>
        <ResumePreview data={resumeData} template={resumeData.template} accentColor={resumeData.accent_color}
        classes='py-4 bg-white'/>
      </div>
      
    </div>
  )  : (
<div>
  {isLoading ? <Loader/>:(
    <div className='flex flex-col items-center justify-center h-screen'>
      <p className='text-center text-6xl text-slate-400 font-medium'>Resume not found</p>
      <a href="/" className='mt-6 bg-green-500 hover:bg-green-600 text-white rounded-full px-6 h-9 m-1 ring-offset-1 ring-1
      ring-green-400 flex items-center transition-colors'>
        <ArrowLeftIcon className='mr-2 size-4' /> go to homepage
      </a>
    </div>
  )}
</div>
  )
}

export default Preview
