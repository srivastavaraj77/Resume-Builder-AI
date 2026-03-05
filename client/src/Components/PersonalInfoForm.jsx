import { BriefcaseBusiness, Globe, Linkedin, Mail, MapPin, Phone, User } from 'lucide-react'
import React from 'react'

const PersonalInfoForm = ({data, onChange , removeBackground , setRemoveBackground}) => {      // We will get the data using props

      const handleChange = (field , value)=>{
        onChange({...data,[field ]:value})
      }

      const handleImageUpload = (file) => {
        if (!file) return
        const reader = new FileReader()
        reader.onloadend = () => {
          const imageAsDataUrl = typeof reader.result === "string" ? reader.result : ""
          handleChange("image", imageAsDataUrl)
        }
        reader.readAsDataURL(file)
      }


      const fields = [
        { key: "full_name", label:"Full Name" , icon:User,type: "text", required: true   },
        { key: "email", label:"Email Address" , icon:Mail,type: "email", required: true   },
        { key: "phone", label:"Phone number" , icon:Phone,type: "tel"  },
        { key: "location", label:"Location" , icon:MapPin ,type: "text"   },
        { key: "profession", label:"Profession" , icon:BriefcaseBusiness,type: "text",   },
        { key: "linkedin", label:"LinkedIn Profile" , icon:Linkedin,type: "url"  },
        { key: "website", label:"Personal Website" , icon:Globe,type: "url",   },

      ]



  return (
    <div>
      <h3 className='text-lg font-semibold text-gray-900'>Personal Information</h3>
      <p className='text-sm text-gray-600'>Get started with the personal information </p>

      <div className='flex items-center gap-2'>

                {/* Upload Image Section */}

        <label >
            {data.image ? (

                     /* If image exists → show preview */
       

                <img 
                    src={typeof data.image === 'string' ? data.image : ""} 
                    alt="user-image" 
                    className='w-16 h-16 rounded-full object-cover mt-5 ring ring-slate-300 hover:opacity-80' 
                />
            ) : (      
                      /* If no image → show upload icon & text */

                <div className='inline-flex items-center gap-2 mt-5 text-slate-600 hover:text-slate-700 cursor-pointer'>
                    <User className='size-10 p-2.5 border rounded-full'/>
                    upload user image
                </div>
            )}
                   {/* Hidden file input → triggers when label is clicked */}
            <input type="file" accept = 'image/jpeg, image/png' className='hidden'
            onChange={(e)=>handleImageUpload(e.target.files?.[0])} />
        </label>
      </div>

      {/*  Display the list of input fields  */}
      
      {fields.map((field)=>{

        const Icon = field.icon;
        return (
            <div key={field.key} className='space-y-1 mt-5'> 
                <label className='flex items-center gap-2 text-sm font-medium text-gray-600'>
                    <Icon className="size-4" />
                    {field.label}
                    {field.required && <span className='text-red-500'>*</span>}
                </label>
                <input 
                    type={field.type} 
                    value={data[field.key] || ''} 
                    onChange={(e)=>handleChange(field.key, e.target.value)} 
                    className='mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm' 
                    placeholder={`Enter your ${field.label.toLowerCase()}`}
                    required={field.required} 
                />
            </div>
        )
      })}

    </div>
  )
}

export default PersonalInfoForm
