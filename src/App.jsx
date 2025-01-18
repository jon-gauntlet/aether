import ChatContainer from './components/ChatContainer'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Aether Chat</h1>
        <ChatContainer />
      </div>
    </div>
  )
} 