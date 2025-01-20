import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export const useFolder = (bucket) => {
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load folders
  const loadFolders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: listError } = await supabase.storage
        .from(bucket)
        .list()

      if (listError) throw listError

      // Extract unique folder paths
      const folderPaths = new Set()
      data.forEach(item => {
        if (item.name.includes('/')) {
          const segments = item.name.split('/')
          let path = ''
          segments.slice(0, -1).forEach(segment => {
            path = path ? `${path}/${segment}` : segment
            folderPaths.add(path)
          })
        }
      })

      setFolders(Array.from(folderPaths).sort())
    } catch (err) {
      setError(err.message)
      console.error('Error loading folders:', err)
    } finally {
      setLoading(false)
    }
  }, [bucket])

  // Create folder
  const createFolder = useCallback(async (path) => {
    try {
      setError(null)
      
      // Create an empty file to represent the folder
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(`${path}/.folder`, new Blob([]))

      if (uploadError) throw uploadError

      await loadFolders()
    } catch (err) {
      setError(err.message)
      console.error('Error creating folder:', err)
    }
  }, [bucket, loadFolders])

  // Delete folder
  const deleteFolder = useCallback(async (path) => {
    try {
      setError(null)

      // List all files in folder
      const { data, error: listError } = await supabase.storage
        .from(bucket)
        .list(path)

      if (listError) throw listError

      // Delete all files in folder
      const deletePromises = data.map(item => 
        supabase.storage
          .from(bucket)
          .remove([`${path}/${item.name}`])
      )

      await Promise.all(deletePromises)
      await loadFolders()
    } catch (err) {
      setError(err.message)
      console.error('Error deleting folder:', err)
    }
  }, [bucket, loadFolders])

  // Load folders on mount
  useEffect(() => {
    loadFolders()
  }, [loadFolders])

  return {
    folders,
    loading,
    error,
    createFolder,
    deleteFolder,
    refresh: loadFolders
  }
} 