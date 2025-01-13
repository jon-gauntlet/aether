declare module '@prisma/client' {
  export class PrismaClient {
    constructor(options?: any)
    $connect(): Promise<void>
    $disconnect(): Promise<void>
    $queryRaw<T = any>(query: string): Promise<T>
  }
}

declare module '@meilisearch/instant-meilisearch' {
  export interface MeiliSearchConfig {
    host: string
    apiKey?: string
  }
  export default function instantMeiliSearch(host: string, apiKey?: string, options?: MeiliSearchConfig): any
}

declare module '*.css' {
  const classes: { [key: string]: string }
  export default classes
}

declare module '*.scss' {
  const classes: { [key: string]: string }
  export default classes
} 