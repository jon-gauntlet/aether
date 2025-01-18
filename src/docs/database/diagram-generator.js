import { createClient } from '@supabase/supabase-js';
import { SystemMonitor } from '../../monitoring/monitor';
import mermaid from 'mermaid';

const monitor = new SystemMonitor();
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export class DatabaseDiagramGenerator {
    async generateMermaidDiagram() {
        try {
            const [tables, relationships] = await Promise.all([
                this.getTables(),
                this.getRelationships()
            ]);

            return this.createMermaidMarkdown(tables, relationships);
        } catch (error) {
            monitor.errorTracker.track(error, {
                context: 'database-diagram-generator'
            });
            throw error;
        }
    }

    async getTables() {
        const { data, error } = await supabase.rpc('get_table_info');
        if (error) throw error;
        
        // Group by table name to get column lists
        const tableMap = new Map();
        data.forEach(row => {
            if (!tableMap.has(row.table_name)) {
                tableMap.set(row.table_name, []);
            }
            tableMap.get(row.table_name).push({
                name: row.column_name,
                type: row.data_type,
                nullable: row.is_nullable
            });
        });
        
        return tableMap;
    }

    async getRelationships() {
        const { data, error } = await supabase.rpc('get_foreign_keys');
        if (error) throw error;
        return data;
    }

    createMermaidMarkdown(tables, relationships) {
        let markdown = 'erDiagram\n';

        // Add tables and their columns
        for (const [tableName, columns] of tables.entries()) {
            markdown += `    ${tableName} {\n`;
            columns.forEach(col => {
                const nullable = col.nullable ? 'NULL' : 'NOT NULL';
                markdown += `        ${col.type} ${col.name} ${nullable}\n`;
            });
            markdown += '    }\n';
        }

        // Add relationships
        relationships.forEach(rel => {
            markdown += `    ${rel.table_name} ${this.getRelationType(rel.update_rule, rel.delete_rule)} ${rel.foreign_table_name} : "${rel.column_name}"\n`;
        });

        return markdown;
    }

    getRelationType(updateRule, deleteRule) {
        if (deleteRule === 'CASCADE') {
            return '||--||';
        } else if (deleteRule === 'SET NULL') {
            return 'o|--||';
        } else {
            return '||--|{';
        }
    }

    async generateSVG(mermaidMarkdown) {
        try {
            const { svg } = await mermaid.render('database-diagram', mermaidMarkdown);
            return svg;
        } catch (error) {
            monitor.errorTracker.track(error, {
                context: 'mermaid-svg-generation'
            });
            throw error;
        }
    }
} 