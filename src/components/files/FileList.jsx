import { memo } from 'react'
import { useFiles } from '../../contexts/FileContext'
import { formatBytes } from '../../utils/format'

function FileList({ files }) {
  const { deleteFile } = useFiles()

  return (
    <div className="mt-8">
      <div className="flex flex-col space-y-4">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm"
          >
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gray-100 rounded">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">{file.name}</h3>
                <p className="text-sm text-gray-500">
                  {formatBytes(file.size)} • Uploaded by {file.uploaded_by.email}
                  {file.team && ` • ${file.team.name}`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <a
                href={file.url}
                download
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
              <button
                onClick={() => deleteFile(file.id, file.path)}
                className="p-2 text-red-500 hover:text-red-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default memo(FileList) 