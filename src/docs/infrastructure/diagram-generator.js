import { SystemMonitor } from '../../monitoring/monitor';
import mermaid from 'mermaid';

export class InfrastructureDiagramGenerator {
    constructor() {
        this.monitor = new SystemMonitor();
    }

    async generateDiagrams() {
        try {
            const [
                architectureDiagram,
                networkDiagram,
                deploymentDiagram,
                securityDiagram
            ] = await Promise.all([
                this.generateArchitectureDiagram(),
                this.generateNetworkDiagram(),
                this.generateDeploymentDiagram(),
                this.generateSecurityDiagram()
            ]);

            return {
                architecture: architectureDiagram,
                network: networkDiagram,
                deployment: deploymentDiagram,
                security: securityDiagram
            };
        } catch (error) {
            this.monitor.errorTracker.track(error, {
                context: 'infrastructure-diagram-generator'
            });
            throw error;
        }
    }

    async generateArchitectureDiagram() {
        const diagram = `
        graph TB
            Client[Client Applications]
            LB[Load Balancer]
            API[API Server]
            Worker[Worker Service]
            DB[(Supabase/PostgreSQL)]
            Cache[(Redis Cache)]
            MQ[Message Queue]
            
            Client --> LB
            LB --> API
            API --> DB
            API --> Cache
            API --> MQ
            MQ --> Worker
            Worker --> DB
            
            subgraph Infrastructure
                LB
                subgraph Application Layer
                    API
                    Worker
                end
                subgraph Data Layer
                    DB
                    Cache
                    MQ
                end
            end
            
            style Client fill:#f9f,stroke:#333
            style Infrastructure fill:#f4f4f4,stroke:#666
            style Application Layer fill:#e4e4e4
            style Data Layer fill:#d4d4d4
        `;

        return this.renderDiagram(diagram);
    }

    async generateNetworkDiagram() {
        const diagram = `
        graph TB
            Internet((Internet))
            WAF[AWS WAF]
            ALB[Application Load Balancer]
            
            subgraph VPC [VPC 10.0.0.0/16]
                subgraph Public Subnets
                    ALB
                    NAT[NAT Gateway]
                end
                
                subgraph Private Subnets
                    API[API Servers]
                    Worker[Workers]
                end
                
                subgraph Database Subnets
                    DB[(Database)]
                    Cache[(Cache)]
                end
            end
            
            Internet --> WAF
            WAF --> ALB
            ALB --> API
            API --> NAT
            Worker --> NAT
            API --> DB
            API --> Cache
            Worker --> DB
            
            style VPC fill:#f4f4f4,stroke:#666
            style Public Subnets fill:#e4e4e4
            style Private Subnets fill:#d4d4d4
            style Database Subnets fill:#c4c4c4
        `;

        return this.renderDiagram(diagram);
    }

    async generateDeploymentDiagram() {
        const diagram = `
        graph LR
            Dev[Developer] --> Git[Git Repository]
            Git --> Actions[GitHub Actions]
            
            subgraph CI/CD Pipeline
                Actions --> Build[Build]
                Build --> Test[Test]
                Test --> Security[Security Scan]
                Security --> Deploy[Deploy]
            end
            
            Deploy --> Staging[Staging Environment]
            Deploy --> Prod[Production Environment]
            
            subgraph Environments
                Staging
                Prod
            end
            
            style CI/CD Pipeline fill:#f4f4f4,stroke:#666
            style Environments fill:#e4e4e4
        `;

        return this.renderDiagram(diagram);
    }

    async generateSecurityDiagram() {
        const diagram = `
        graph TB
            Client[Client] --> WAF[WAF]
            WAF --> ALB[Load Balancer]
            
            subgraph Security Layers
                WAF
                ALB
                Auth[Authentication]
                RBAC[Authorization]
                Encrypt[Encryption]
            end
            
            ALB --> Auth
            Auth --> RBAC
            RBAC --> API[API Server]
            API --> Encrypt
            Encrypt --> DB[(Database)]
            
            style Security Layers fill:#f4f4f4,stroke:#666
            style Client fill:#f9f,stroke:#333
            style DB fill:#d4d4d4
        `;

        return this.renderDiagram(diagram);
    }

    async renderDiagram(mermaidMarkdown) {
        try {
            const { svg } = await mermaid.render('infrastructure-diagram', mermaidMarkdown);
            return {
                mermaid: mermaidMarkdown,
                svg
            };
        } catch (error) {
            this.monitor.errorTracker.track(error, {
                context: 'mermaid-diagram-generation'
            });
            throw error;
        }
    }
} 