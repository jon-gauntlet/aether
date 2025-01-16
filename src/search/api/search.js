// Natural flow: query → search → results
export async function search(query) {
  // Simulate search delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    results: [
      {
        id: '1',
        text: `Result for: ${query}`,
        score: 0.95
      }
    ],
    metrics: { latency: 50 }
  };
} 