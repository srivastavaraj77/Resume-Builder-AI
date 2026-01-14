import { Palette } from 'lucide-react';
import React, { useState } from 'react'


const ColorPicker = ({selectedColor, onChange}) => {
    const colors = [
        { name: "Blue", value: "#3B82F6"},
        { name: "Indigo", value: "#6366F1"},
        { name: "Purple", value: "#8B5CF6"},
        { name: "Green", value: "#10B981"},
        { name: "Red", value: "#EF4444"},
        { name: "Orange", value: "#F97316"},
        { name: "Teal", value: "#14B8A6"},
        { name: "Pink", value: "#EC4899"},
        { name: "Gray", value: "#6B7280"},
        { name: "Black", value: "#1F2937"},
        
    ]
    const [isOpen, setIsOpen] = useState(false);
    
  return (
    <div className='relative'>
        <button onClick={()=> setIsOpen(!isOpen)} className='flex items-center gap-1 text-sm
        text-purple-600 bg-gradient-to-br from-purple-50 to-purple-100 ring-purple-300 hover:ring transition-all px-3 py-2 rounded-lg'>
            <Palette size={16}/> <span className='max-sm:hidden'>Accent</span>
        </button>

        {isOpen && (
            <div className='grid grid-cols-4 w-60 gap-2 absolute top-full left-0 right-0 p-3 mt-2 z-10 bg-white rounded-md border border-gray-200 shadow-sm'>

                {colors.map((color) => (
                    <div 
                        key={color.value} 
                        className='relative cursor-pointer group flex flex-col'
                        onClick={() => {onChange(color.value)}}
                    >
                        <div 
                            className={`w-full h-8 rounded-md border ${
                                selectedColor === color.value 
                                    ? 'border-gray-800 ring-2 ring-gray-400' 
                                    : 'border-gray-300'
                            }`} 
                            style={{ backgroundColor: color.value }}
                        />
                        <span className='text-xs text-gray-600 mt-1'>{color.name}</span>
                    </div>
                ))}
            </div>
        )}
      
    </div>
  )
}

export default ColorPicker
