import { test, expect } from '@playwright/test'
import { mockSupabaseClient } from '../mocks/supabase'
import { setupTestAuth } from '../utils/auth'

test.describe('FileUpload E2E Tests', () => {
  let authSession

  test.beforeEach(async ({ page }) => {
    // Setup auth session
    authSession = await setupTestAuth(page)
    
    // Mock Supabase storage
    await page.route('**/storage/v1/**', async (route) => {
      const url = route.request().url()
      if (url.includes('/upload')) {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            data: { path: 'test-file.pdf' },
            error: null
          })
        })
      } else if (url.includes('/list')) {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            data: [
              { name: 'test-folder/file1.pdf' },
              { name: 'test-folder/file2.doc' },
              { name: 'file3.docx' }
            ],
            error: null
          })
        })
      }
    })
  })

  test('should upload files successfully', async ({ page }) => {
    await page.goto('/upload')
    
    // Upload file via input
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles([
      { name: 'test.pdf', mimeType: 'application/pdf', buffer: Buffer.from('test') }
    ])

    // Check file appears in list
    await expect(page.getByText('test.pdf')).toBeVisible()
    
    // Click upload button
    await page.getByRole('button', { name: 'Upload All' }).click()
    
    // Check progress indicator appears
    await expect(page.getByRole('progressbar')).toBeVisible()
    
    // Check success message
    await expect(page.getByText('Successfully uploaded 1 files')).toBeVisible()
  })

  test('should handle drag and drop', async ({ page }) => {
    await page.goto('/upload')

    // Trigger drag events
    await page.evaluate(() => {
      const dropZone = document.querySelector('[role="button"]')
      const dragEnter = new DragEvent('dragenter', { bubbles: true })
      dropZone.dispatchEvent(dragEnter)
    })

    // Check dropzone highlights
    await expect(page.locator('[role="button"]')).toHaveCSS(
      'border-color', 
      /rgb\(59, 130, 246\)/ // primary color
    )
  })

  test('should validate file types', async ({ page }) => {
    await page.goto('/upload')
    
    // Try uploading invalid file type
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles([
      { name: 'test.txt', mimeType: 'text/plain', buffer: Buffer.from('test') }
    ])

    // Check error message
    await expect(page.getByText(/Invalid file type/)).toBeVisible()
  })

  test('should handle folder operations', async ({ page }) => {
    await page.goto('/upload')
    
    // Create new folder
    await page.getByRole('button', { name: 'New Folder' }).click()
    await page.keyboard.type('test-folder')
    await page.keyboard.press('Enter')

    // Navigate into folder
    await page.getByText('test-folder').click()
    
    // Check breadcrumb navigation
    await expect(page.getByText('Root')).toBeVisible()
    await expect(page.getByText('/test-folder')).toBeVisible()
    
    // Upload file in folder
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles([
      { name: 'test.pdf', mimeType: 'application/pdf', buffer: Buffer.from('test') }
    ])
    await page.getByRole('button', { name: 'Upload All' }).click()
    
    // Check file uploaded to correct path
    await expect(page.getByText('Successfully uploaded 1 files')).toBeVisible()
  })

  test('should handle search functionality', async ({ page }) => {
    await page.goto('/upload')
    
    // Upload multiple files
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles([
      { name: 'test1.pdf', mimeType: 'application/pdf', buffer: Buffer.from('test1') },
      { name: 'test2.doc', mimeType: 'application/msword', buffer: Buffer.from('test2') }
    ])

    // Search for files
    await page.getByPlaceholder('Search files...').fill('pdf')
    
    // Check filtered results
    await expect(page.getByText('test1.pdf')).toBeVisible()
    await expect(page.getByText('test2.doc')).not.toBeVisible()
  })

  test('should handle batch operations', async ({ page }) => {
    await page.goto('/upload')
    
    // Upload multiple files
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles([
      { name: 'test1.pdf', mimeType: 'application/pdf', buffer: Buffer.from('test1') },
      { name: 'test2.doc', mimeType: 'application/msword', buffer: Buffer.from('test2') }
    ])

    // Cancel all uploads
    await page.getByRole('button', { name: 'Upload All' }).click()
    await page.getByRole('button', { name: 'Cancel All' }).click()
    
    // Check cancellation message
    await expect(page.getByText(/Upload cancelled/)).toBeVisible()

    // Remove all files
    await page.getByRole('button', { name: 'Remove All' }).click()
    
    // Check files removed
    await expect(page.getByText('test1.pdf')).not.toBeVisible()
    await expect(page.getByText('test2.doc')).not.toBeVisible()
  })

  test('should handle failed uploads and retries', async ({ page }) => {
    await page.goto('/upload')
    
    // Mock failed upload
    await page.route('**/storage/v1/upload', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({
          error: { message: 'Upload failed' }
        })
      })
    })

    // Upload file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles([
      { name: 'test.pdf', mimeType: 'application/pdf', buffer: Buffer.from('test') }
    ])
    await page.getByRole('button', { name: 'Upload All' }).click()
    
    // Check error message
    await expect(page.getByText('Failed to upload 1 files')).toBeVisible()
    
    // Mock successful retry
    await page.unroute('**/storage/v1/upload')
    await page.route('**/storage/v1/upload', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: { path: 'test.pdf' },
          error: null
        })
      })
    })

    // Retry upload
    await page.getByRole('button', { name: 'Retry Failed' }).click()
    
    // Check success message
    await expect(page.getByText('Successfully uploaded 1 files')).toBeVisible()
  })
}) 