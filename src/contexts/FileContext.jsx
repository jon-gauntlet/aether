import { createContext, useContext, useState, useCallback } from 'react'
import { supabase } from '../utils/supabase'
import { useNotifications } from './NotificationContext'
import { useTeams } from './TeamContext'
import { uploadFile as uploadFileUtil } from '../utils/fileUpload'

const FileContext = createContext({})

export function FileProvider({ children }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const { addNotification } = useNotifications()
  const { currentTeam } = useTeams()

  const fetchFiles = useCallback(async () => {
    try {
      const query = supabase
        .from('files')
        .select(`
          *,
          uploaded_by:users(email),
          team:teams(name)
        `)
        .order('created_at', { ascending: false })

      if (currentTeam) {
        query.eq('team_id', currentTeam.id)
      }

      const { data, error } = await query

      if (error) throw error
      setFiles(data)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to load files',
        message: error.message
      })
    } finally {
      setLoading(false)
    }
  }, [currentTeam, addNotification])

  const uploadFile = useCallback(async (file, teamId = null, onProgress) => {
    try {
      // Upload file to storage with progress tracking
      const { data: uploadData } = await uploadFileUtil(file, onProgress)
      if (!uploadData) throw new Error('Upload failed')

      // Save file metadata to database
      const { data, error } = await supabase
        .from('files')
        .insert([{
          name: file.name,
          size: file.size,
          type: file.type,
          path: uploadData.path,
          url: uploadData.publicUrl,
          team_id: teamId
        }])
        .select()
        .single()

      if (error) throw error

      setFiles(prev => [data, ...prev])
      addNotification({
        type: 'success',
        title: 'File uploaded',
        message: `${file.name} has been uploaded successfully.`
      })

      return data
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to upload file',
        message: error.message
      })
      throw error
    }
  }, [addNotification])

  const deleteFile = useCallback(async (fileId, filePath) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([filePath])

      if (storageError) throw storageError

      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId)

      if (dbError) throw dbError

      setFiles(prev => prev.filter(file => file.id !== fileId))
      addNotification({
        type: 'success',
        title: 'File deleted',
        message: 'File has been deleted successfully.'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to delete file',
        message: error.message
      })
      throw error
    }
  }, [addNotification])

  return (
    <FileContext.Provider value={{
      files,
      loading,
      fetchFiles,
      uploadFile,
      deleteFile
    }}>
      {children}
    </FileContext.Provider>
  )
}

export const useFiles = () => {
  const context = useContext(FileContext)
  if (!context) {
    throw new Error('useFiles must be used within a FileProvider')
  }
  return context
} 