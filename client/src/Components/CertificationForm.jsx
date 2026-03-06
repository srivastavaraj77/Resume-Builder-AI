import { Award, Plus, Trash2 } from "lucide-react"
import React from "react"

const CertificationForm = ({ data = [], onChange }) => {
  const addCertification = () => {
    const newCertification = {
      name: "",
      issuer: "",
      date: "",
      description: "",
    }
    onChange([...data, newCertification])
  }

  const removeCertification = (index) => {
    onChange(data.filter((_, i) => i !== index))
  }

  const updateCertification = (index, field, value) => {
    const updated = [...data]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            Certifications
          </h3>
          <p className="text-sm text-gray-500">Add any certifications or credentials</p>
        </div>
        <button
          type="button"
          onClick={addCertification}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
        >
          <Plus className="size-4" />
          Add Certification
        </button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No certifications added yet</p>
          <p className="text-sm">Click "Add Certification" to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((cert, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
              <div className="flex justify-between items-start">
                <h4>Certification #{index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeCertification(index)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Certification name"
                  className="px-3 py-2 text-sm rounded-lg"
                  value={cert.name || ""}
                  onChange={(e) => updateCertification(index, "name", e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Issuing organization"
                  className="px-3 py-2 text-sm rounded-lg"
                  value={cert.issuer || ""}
                  onChange={(e) => updateCertification(index, "issuer", e.target.value)}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <input
                  type="month"
                  placeholder="Date earned"
                  className="px-3 py-2 text-sm rounded-lg"
                  value={cert.date || ""}
                  onChange={(e) => updateCertification(index, "date", e.target.value)}
                />
                <textarea
                  rows={3}
                  className="px-3 py-2 text-sm rounded-lg resize-none"
                  placeholder="Notes or description (optional)"
                  value={cert.description || ""}
                  onChange={(e) => updateCertification(index, "description", e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CertificationForm
