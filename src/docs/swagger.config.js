import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'System Claude API',
            version,
            description: `
                API documentation for System Claude
                
                ## API Versioning
                This API supports versioning through the following methods:
                1. Accept-Version header (recommended)
                2. version query parameter
                
                Current versions:
                - 1.0.0 (stable)
                - 2.0.0 (beta)
                
                Deprecated versions:
                - 0.9.0
                
                Example: \`curl -H "Accept-Version: 2.0.0" /api/users\`
            `,
            license: {
                name: 'Private',
                url: 'https://your-license-url.com'
            }
        },
        servers: [
            {
                url: process.env.API_URL || 'http://localhost:3000',
                description: 'Development server'
            }
        ],
        components: {
            parameters: {
                ApiVersion: {
                    in: 'header',
                    name: 'Accept-Version',
                    required: false,
                    schema: {
                        type: 'string',
                        enum: ['1.0.0', '2.0.0'],
                        default: '1.0.0'
                    },
                    description: 'API version to use'
                }
            },
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        error: {
                            type: 'object',
                            properties: {
                                message: { type: 'string' },
                                code: { type: 'string' },
                                type: { type: 'string' }
                            }
                        },
                        meta: {
                            type: 'object',
                            properties: {
                                timestamp: {
                                    type: 'string',
                                    format: 'date-time'
                                },
                                version: {
                                    type: 'string',
                                    example: '1.0.0'
                                }
                            }
                        }
                    }
                },
                VersionError: {
                    allOf: [
                        { $ref: '#/components/schemas/Error' },
                        {
                            type: 'object',
                            properties: {
                                meta: {
                                    type: 'object',
                                    properties: {
                                        supportedVersions: {
                                            type: 'array',
                                            items: {
                                                type: 'string'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        }
    },
    apis: ['./src/routes/*.js', './src/docs/components/*.yaml']
};

export const specs = swaggerJsdoc(options); 