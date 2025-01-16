// Natural flow: request → process → response
export async function sendMessage(text) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    text: `Response to: ${text}`,
    metrics: { latency: 100 }
  };
}

export async function getMessages() {
  return [];
} 