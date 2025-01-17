<template>
  <div class="chat-app">
    <!-- Messages Area -->
    <div class="messages" ref="messagesContainer">
      <div v-for="message in messages" 
           :key="message.id" 
           class="message">
        <div class="message-content">
          <div class="message-header">
            <span class="user-name">{{ message.user }}</span>
            <span class="timestamp">{{ new Date(message.timestamp).toLocaleTimeString() }}</span>
          </div>
          <div class="message-text">{{ message.content }}</div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="input-area">
      <form @submit.prevent="sendMessage">
        <input 
          v-model="userInput"
          type="text"
          placeholder="Type a message..."
          :disabled="isLoading"
        />
        <button type="submit" 
                :disabled="isLoading || !userInput.trim()">
          Send
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const messages = ref([
  {
    id: 1,
    user: 'System',
    content: 'Welcome to ChatGenius!',
    timestamp: Date.now()
  }
])
const userInput = ref('')
const isLoading = ref(false)
const messagesContainer = ref(null)

const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return
  
  // Add user message
  messages.value.push({
    id: Date.now(),
    user: 'You',
    content: userInput.value,
    timestamp: Date.now()
  })

  const messageText = userInput.value
  userInput.value = ''
  isLoading.value = true

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Add AI response
    messages.value.push({
      id: Date.now() + 1,
      user: 'AI Assistant',
      content: `You said: "${messageText}"`,
      timestamp: Date.now()
    })
  } catch (error) {
    messages.value.push({
      id: Date.now() + 1,
      user: 'System',
      content: 'Failed to send message. Please try again.',
      timestamp: Date.now()
    })
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

onMounted(() => {
  scrollToBottom()
})
</script>

<style scoped>
.chat-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  background: white;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: #f0f0f0;
}

.message-header {
  margin-bottom: 0.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-name {
  font-weight: bold;
}

.timestamp {
  color: #666;
  font-size: 0.8rem;
}

.message-text {
  word-break: break-word;
}

.input-area {
  border-top: 1px solid #eee;
  padding: 1rem;
}

form {
  display: flex;
  gap: 0.5rem;
}

input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

button {
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style> 