import { useState, useEffect, lazy, Suspense } from 'react'
import { useFiles } from '../contexts/FileContext'
import { useTeams } from '../contexts/TeamContext'
import FilesErrorBoundary from '../components/ErrorBoundary/FilesErrorBoundary'

// Lazy load components
const FileList = lazy(() => import('../components/files/FileList'))
const FileUpload = lazy(() => import('../components/files/FileUpload'))

// Loading fallbacks
const FileListFallback = () => (
  <div className="mt-8">
    <div className="flex flex-col space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-gray-200 rounded w-10 h-10"></div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
              <div className="mt-2 h-3 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gray-200 rounded w-8 h-8"></div>
            <div className="p-2 bg-gray-200 rounded w-8 h-8"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

const FileUploadFallback = () => (
  <div className="border-2 border-dashed rounded-lg p-8 text-center border-gray-300">
    <div className="animate-pulse space-y-2">
      <div className="mx-auto h-12 w-12 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
    </div>
  </div>
)

function Files() {
  const { files, loading, fetchFiles } = useFiles()
  const { teams, currentTeam, setCurrentTeam } = useTeams()

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles, currentTeam])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading files...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Files</h1>
          <select
            value={currentTeam?.id || ''}
            onChange={(e) => setCurrentTeam(teams.find(t => t.id === e.target.value) || null)}
            className="rounded-md border-gray-300"
          >
            <option value="">All Files</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </div>
      </div>

      <Suspense fallback={<FileUploadFallback />}>
        <FileUpload currentTeam={currentTeam} />
      </Suspense>

      <Suspense fallback={<FileListFallback />}>
        <FileList files={files} />
      </Suspense>
    </div>
  )
}

// Wrap Files component with FilesErrorBoundary
export default function FilesWithErrorBoundary() {
  return (
    <FilesErrorBoundary>
      <Files />
    </FilesErrorBoundary>
  )
} 