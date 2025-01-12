export class SystemIntegrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SystemIntegrationError';
  }
} 