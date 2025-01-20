import { test, expect } from '@playwright/test'
import { mockSupabaseClient } from '../mocks/supabase'
import { setupTestAuth } from '../utils/auth'

test.describe('FileUpload Performance Tests', () => {
  let authSession

  test.beforeEach(async ({ page }) => {
    authSession = await setupTestAuth(page)
    await mockSupabaseClient(page)
  })

  test('should maintain performance with large file lists', async ({ page }) => {
    await page.goto('/upload')

    // Create 100 test files
    const files = Array.from({ length: 100 }, (_, i) => ({
      name: `test${i}.pdf`,
      mimeType: 'application/pdf',
      buffer: Buffer.from(`test${i}`)
    }))

    // Measure time to add files
    const startAdd = performance.now()
    await page.locator('input[type="file"]').setInputFiles(files)
    const endAdd = performance.now()

    // Check file list render time
    expect(endAdd - startAdd).toBeLessThan(1000) // Should render within 1s

    // Check memory usage
    const metrics = await page.metrics()
    expect(metrics.JSHeapUsedSize).toBeLessThan(50 * 1024 * 1024) // Less than 50MB

    // Check search performance
    const startSearch = performance.now()
    await page.getByPlaceholder('Search files...').fill('test50')
    await page.waitForTimeout(100) // Wait for debounce
    const endSearch = performance.now()

    expect(endSearch - startSearch).toBeLessThan(100) // Search should complete within 100ms
  })

  test('should handle concurrent uploads efficiently', async ({ page }) => {
    await page.goto('/upload')

    // Create 10 1MB files
    const largeFiles = Array.from({ length: 10 }, (_, i) => ({
      name: `large${i}.pdf`,
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(1024 * 1024) // 1MB each
    }))

    await page.locator('input[type="file"]').setInputFiles(largeFiles)
    
    // Start upload and measure CPU/memory
    const startMetrics = await page.metrics()
    await page.getByRole('button', { name: 'Upload All' }).click()

    // Wait for uploads to complete
    await page.waitForSelector('[role="progressbar"]', { state: 'hidden' })
    
    const endMetrics = await page.metrics()

    // Check CPU usage
    const cpuTime = endMetrics.TaskDuration - startMetrics.TaskDuration
    expect(cpuTime).toBeLessThan(5000) // Less than 5s CPU time

    // Check memory growth
    const memoryGrowth = endMetrics.JSHeapUsedSize - startMetrics.JSHeapUsedSize
    expect(memoryGrowth).toBeLessThan(20 * 1024 * 1024) // Less than 20MB growth
  })

  test('should maintain responsiveness during folder operations', async ({ page }) => {
    await page.goto('/upload')

    // Create deep folder structure
    for (let i = 0; i < 10; i++) {
      await page.getByRole('button', { name: 'New Folder' }).click()
      await page.keyboard.type(`folder${i}`)
      await page.keyboard.press('Enter')
      await page.getByText(`folder${i}`).click()
    }

    // Measure navigation time
    const startNav = performance.now()
    await page.getByText('Root').click()
    const endNav = performance.now()

    expect(endNav - startNav).toBeLessThan(100) // Navigation should be instant

    // Check folder list render performance
    const folders = await page.$$('[role="button"]')
    expect(folders.length).toBeGreaterThan(0)
    
    const metrics = await page.metrics()
    expect(metrics.ScriptDuration).toBeLessThan(100) // Script execution under 100ms
  })

  test('should handle drag and drop efficiently', async ({ page }) => {
    await page.goto('/upload')

    // Simulate continuous drag events
    const startMetrics = await page.metrics()
    
    for (let i = 0; i < 100; i++) {
      await page.evaluate(() => {
        const dropZone = document.querySelector('[role="button"]')
        const dragEnter = new DragEvent('dragenter', { bubbles: true })
        const dragLeave = new DragEvent('dragleave', { bubbles: true })
        dropZone.dispatchEvent(dragEnter)
        dropZone.dispatchEvent(dragLeave)
      })
    }

    const endMetrics = await page.metrics()

    // Check animation performance
    expect(endMetrics.ScriptDuration - startMetrics.ScriptDuration)
      .toBeLessThan(500) // Animation should be smooth

    // Check memory stability
    expect(endMetrics.JSHeapUsedSize - startMetrics.JSHeapUsedSize)
      .toBeLessThan(1024 * 1024) // Less than 1MB growth
  })

  test('should clean up resources properly', async ({ page }) => {
    await page.goto('/upload')

    // Upload and remove files repeatedly
    const startHeap = await page.evaluate(() => performance.memory.usedJSHeapSize)

    for (let i = 0; i < 10; i++) {
      // Add files
      await page.locator('input[type="file"]').setInputFiles([
        { name: 'test.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(1024 * 1024) }
      ])

      // Remove files
      await page.getByRole('button', { name: 'Remove All' }).click()
    }

    // Force garbage collection if possible
    await page.evaluate(() => {
      if (window.gc) window.gc()
    })

    const endHeap = await page.evaluate(() => performance.memory.usedJSHeapSize)
    
    // Check for memory leaks
    expect(endHeap - startHeap).toBeLessThan(5 * 1024 * 1024) // Less than 5MB growth
  })
}) 