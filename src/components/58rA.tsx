'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { RichTextEditor } from '../editor/rich-text-editor'
import { trpc } from '@/lib/trpc'
import { toast } from '../ui/use-toast'

interface LessonEditorProps {
  moduleId: string
  lessonId?: string
  initialData?: {
    title: string
    content: string
    order: number
  }
}

export function LessonEditor({
  moduleId,
  lessonId,
  initialData,
}: LessonEditorProps) {
  const router = useRouter()
  const [title, setTitle] = React.useState(initialData?.title ?? '')
  const [content, setContent] = React.useState(initialData?.content ?? '')
  const [isSaving, setIsSaving] = React.useState(false)

  const { mutate: createLesson } = trpc.lesson.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Lesson created successfully',
      })
      router.refresh()
      router.push(`/modules/${moduleId}`)
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
      setIsSaving(false)
    },
  })

  const { mutate: updateLesson } = trpc.lesson.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Lesson updated successfully',
      })
      router.refresh()
      router.push(`/modules/${moduleId}`)
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
      setIsSaving(false)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    if (lessonId) {
      updateLesson({
        id: lessonId,
        title,
        content,
      })
    } else {
      createLesson({
        moduleId,
        title,
        content,
        order: initialData?.order ?? 0,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter lesson title"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Content</Label>
        <RichTextEditor content={content} onChange={setContent} />
      </div>
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/modules/${moduleId}`)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : lessonId ? 'Update Lesson' : 'Create Lesson'}
        </Button>
      </div>
    </form>
  )
} 