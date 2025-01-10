import { MeiliSearch } from 'meilisearch'

const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_API_KEY,
})

// Define searchable attributes and filterable attributes for each index
export const setupMeilisearchIndices = async () => {
  // Courses index
  await client.createIndex('courses', { primaryKey: 'id' })
  await client.index('courses').updateSettings({
    searchableAttributes: [
      'title',
      'description',
    ],
    filterableAttributes: ['moduleIds'],
    sortableAttributes: ['createdAt', 'updatedAt'],
  })

  // Lessons index
  await client.createIndex('lessons', { primaryKey: 'id' })
  await client.index('lessons').updateSettings({
    searchableAttributes: [
      'title',
      'content',
    ],
    filterableAttributes: ['moduleId'],
    sortableAttributes: ['order', 'createdAt', 'updatedAt'],
  })
}

export default client 