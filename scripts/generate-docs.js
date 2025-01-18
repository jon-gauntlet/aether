import fs from 'fs/promises';
import path from 'path';
import { specs } from '../src/docs/swagger.config';

async function generateDocs() {
    try {
        // Generate OpenAPI JSON
        await fs.writeFile(
            path.join(process.cwd(), 'docs', 'openapi.json'),
            JSON.stringify(specs, null, 2)
        );

        // Generate Markdown documentation
        const markdown = generateMarkdown(specs);
        await fs.writeFile(
            path.join(process.cwd(), 'docs', 'API.md'),
            markdown
        );

        console.log('Documentation generated successfully');
    } catch (error) {
        console.error('Error generating documentation:', error);
        process.exit(1);
    }
}

function generateMarkdown(specs) {
    // ... markdown generation logic ...
}

generateDocs(); 