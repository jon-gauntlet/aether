# GauntletAI LMS API Documentation

## Authentication

All API routes are protected by NextAuth.js authentication. Include the session token in your requests.

### Providers
- GitHub OAuth
- Google OAuth

## API Routes

### User Management

```typescript
// Get current user
query: user.me()
returns: User & { enrollments: Enrollment[] }

// Update user profile
mutation: user.updateProfile({
  name?: string
  image?: string
})
returns: User
```

### Course Management

```typescript
// List all courses
query: course.list()
returns: Course[]

// Get course by ID
query: course.byId(id: string)
returns: Course & { modules: Module[] }

// Create course
mutation: course.create({
  title: string
  description: string
  modules: {
    title: string
    description: string
    order: number
    lessons: {
      title: string
      content: string
      order: number
    }[]
  }[]
})
returns: Course & { modules: Module[] }
```

### Interactive Content

```typescript
// Create quiz
mutation: quiz.create({
  title: string
  description?: string
  lessonId: string
  questions: {
    content: string
    type: 'multiple_choice' | 'code' | 'text'
    options?: string[]
    answer: string
  }[]
})
returns: Quiz & { questions: Question[] }

// Submit quiz attempt
mutation: quiz.submitAttempt({
  quizId: string
  answers: {
    questionId: string
    answer: string
  }[]
})
returns: QuizAttempt & { score: number }
```

### Real-time Collaboration

```typescript
// Create collaboration session
mutation: collaboration.createSession(lessonId: string)
returns: CollaborationSession & { participants: User[] }

// Join session
mutation: collaboration.joinSession(sessionId: string)
returns: UserCollaboration & { session: CollaborationSession }

// Send message
mutation: collaboration.sendMessage({
  sessionId: string
  content: string
})
returns: ChatMessage & { user: User }
```

### Analytics

```typescript
// Get course analytics
query: analytics.getCourseAnalytics(courseId: string)
returns: CourseAnalytics & { course: Course }

// Get instructor analytics
query: analytics.getInstructorAnalytics()
returns: {
  totalCourses: number
  totalStudents: number
  totalFeedback: number
  averageCompletionRate: number
}
```

## WebSocket Events

### Lesson Collaboration

```typescript
// Join lesson room
emit: 'join-lesson', lessonId: string

// Leave lesson room
emit: 'leave-lesson', lessonId: string

// Send chat message
emit: 'chat-message', {
  sessionId: string
  content: string
}

// Receive chat message
on: 'chat-message', ChatMessage & { user: User }
```

## Error Handling

All API routes return standard tRPC errors:

```typescript
{
  code: 'NOT_FOUND' | 'FORBIDDEN' | 'UNAUTHORIZED' | 'BAD_REQUEST'
  message: string
  cause?: unknown
}
```

## Rate Limiting

- API routes: 100 requests per minute
- WebSocket events: 60 messages per minute 