/**
 * Format file size into human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size with units
 */
export const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

/**
 * Get file type for icon display
 * @param {File} file - File object
 * @returns {string} File type identifier
 */
export const getFileType = (file) => {
  if (file.type.startsWith('image/')) return 'image'
  
  const ext = file.name.split('.').pop().toLowerCase()
  switch (ext) {
    case 'pdf':
      return 'pdf'
    case 'doc':
    case 'docx':
      return 'doc'
    case 'xls':
    case 'xlsx':
      return 'spreadsheet'
    case 'ppt':
    case 'pptx':
      return 'presentation'
    case 'zip':
    case 'rar':
    case '7z':
      return 'archive'
    case 'txt':
    case 'md':
      return 'text'
    case 'mp3':
    case 'wav':
    case 'ogg':
      return 'audio'
    case 'mp4':
    case 'mov':
    case 'avi':
      return 'video'
    default:
      return 'default'
  }
} 