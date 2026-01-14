import React from 'react'
import { Sparkles } from 'lucide-react'
const ProffesionalSummaeyForm = ({data , onChange , setResumeData}) => {
  return (
    <div className='space-y-4'>

        <div className='flex items-center justify-between'>


        
        {/* For the left section --- Yha pe ham summary likhege*/}

        <div>

               <h3 className='flex items-center gap-2 text-lg font-semibold
                text-gray-900'>Professional Summary</h3>

                <p className='text-sm text-gray-500'>Add summary for your resume here</p>
        </div>

        {/* For right side hm ek button lagayege jisse summary enhance kr skte AI se */}

        <button className=' flex items-center gap-2 px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded
         hover:bg-purple-200 transition-colors disabled:opacity-50'>
        <Sparkles className="size-4"/>
        AI Enhance
        </button>

        </div>


          {/* Text area where we can write our profile summary */}

        <div className='mt-6'>
          <textarea value={data  || ""} onChange={(e)=> onChange(e.target.value)} rows={7} className='w-full p-3 px-4 mt-2 border text-sm border-gray-300 rounded-lg 
          focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none'
          placeholder='Write a compelling professional summary that highlights your key strengths and career objectives...'/>

          <p className='text-xs text-gray-500 max-w-4/5 mx-auto text-center'>Tip:
          Keep it concise (3-4 sentences) and focus on your most relevant achievements and skiils</p>

        </div>
      
    </div>
  )
}

export default ProffesionalSummaeyForm
