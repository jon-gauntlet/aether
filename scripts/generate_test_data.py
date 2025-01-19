import json
import random
from pathlib import Path
import shutil
import os
from typing import List, Dict
import logging
from datetime import datetime
import base64

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TestDataGenerator:
    def __init__(self):
        self.test_data_dir = Path("test_data")
        self.test_files_dir = self.test_data_dir / "files"
        self.test_categories = ["unit", "integration", "performance"]
        self._setup_directories()

    def _setup_directories(self):
        """Create necessary directories if they don't exist"""
        # Clean up old test data
        if self.test_data_dir.exists():
            shutil.rmtree(self.test_data_dir)
            logger.info("Cleaned up old test data")
        
        self.test_data_dir.mkdir(exist_ok=True)
        self.test_files_dir.mkdir(exist_ok=True)
        # Create category subdirectories
        for category in self.test_categories:
            (self.test_files_dir / category).mkdir(exist_ok=True)
        logger.info(f"Created directories: {self.test_data_dir}, {self.test_files_dir}")

    def generate_files(self) -> List[Dict]:
        """Generate realistic sample test files with various content"""
        files = []
        file_types = [
            ("txt", "text/plain", self._generate_text_content),
            ("md", "text/markdown", self._generate_markdown_content),
            ("json", "application/json", self._generate_json_content),
            ("pdf", "application/pdf", self._generate_pdf_content),  # Now generates binary-like content
            ("doc", "application/msword", self._generate_doc_content)  # Simulated Word doc content
        ]

        # Generate files for each test category
        for category in self.test_categories:
            category_dir = self.test_files_dir / category
            for i in range(7):  # Generate 7 files per category
                ext, mime, content_generator = random.choice(file_types)
                file_path = category_dir / f"{category}_test_{i}.{ext}"
                
                content = content_generator(i, category)
                with open(file_path, "w") as f:
                    f.write(content)
                
                files.append({
                    "path": str(file_path.relative_to(self.test_data_dir)),
                    "size": file_path.stat().st_size,
                    "type": mime,
                    "created_at": datetime.now().isoformat(),
                    "metadata": {
                        "test_category": category,
                        "complexity": random.choice(["simple", "medium", "complex"]),
                        "priority": random.randint(1, 3),
                        "tags": [category, f"priority_{random.randint(1,3)}", "test"]
                    }
                })
                logger.info(f"Generated file: {file_path}")

        return files

    def _generate_text_content(self, index: int, category: str) -> str:
        content_templates = {
            "unit": [
                "Unit test case for file operations.",
                f"Test ID: UNIT_{index}",
                "Expected behavior: File should be properly processed",
                "Test steps:",
                "1. Create file",
                "2. Write content",
                "3. Verify content",
                "4. Delete file"
            ],
            "integration": [
                "Integration test scenario for system components.",
                f"Scenario ID: INT_{index}",
                "Components involved:",
                "- File System",
                "- RAG System",
                "- User Management",
                "Expected outcome: All components should interact correctly"
            ],
            "performance": [
                f"Performance test configuration {index}",
                "Metrics to measure:",
                "- Response time",
                "- Throughput",
                "- Resource usage",
                "Target thresholds:",
                "- Max response time: 200ms",
                "- Min throughput: 100 req/sec"
            ]
        }
        return "\n\n".join(content_templates[category])

    def _generate_markdown_content(self, index: int, category: str) -> str:
        return f"""# {category.title()} Test Document {index}

## Overview
This is a {category} test file for system evaluation.

### Test Objectives
- Verify {category} functionality
- Measure performance metrics
- Validate system behavior

## Test Scenarios
1. Basic operations
2. Edge cases
3. Error handling

## Expected Results
| Operation | Expected Outcome | Actual Result |
|-----------|-----------------|---------------|
| Create    | Success         | TBD           |
| Read      | Success         | TBD           |
| Update    | Success         | TBD           |
| Delete    | Success         | TBD           |

> Note: This is a test document for {category} testing

## Code Sample
```python
def test_{category}_scenario_{index}():
    assert system.process() == "success"
```
"""

    def _generate_json_content(self, index: int, category: str) -> str:
        test_data = {
            "id": f"{category}_test_{index}",
            "type": "test_document",
            "category": category,
            "properties": {
                "name": f"{category.title()} Test {index}",
                "priority": random.randint(1, 3),
                "tags": ["test", category, f"priority_{random.randint(1,3)}"],
                "complexity": random.randint(1, 5)
            },
            "test_cases": [
                {
                    "id": f"tc_{i}",
                    "name": f"Test Case {i}",
                    "steps": [f"Step {j}" for j in range(1, 4)],
                    "expected": "success"
                } for i in range(1, 4)
            ],
            "metadata": {
                "created_at": datetime.now().isoformat(),
                "version": "1.0",
                "is_test": True
            }
        }
        return json.dumps(test_data, indent=2)

    def _generate_pdf_content(self, index: int, category: str) -> str:
        # Simulate PDF-like content with some binary-looking data
        header = f"%PDF-1.7\n%{category.upper()} TEST {index}\n"
        content = f"""
1 0 obj
<< /Type /Catalog
   /Pages 2 0 R
>>
endobj

2 0 obj
<< /Type /Pages
   /Kids [3 0 R]
   /Count 1
>>
endobj

3 0 obj
<< /Type /Page
   /Parent 2 0 R
   /MediaBox [0 0 612 792]
   /Contents 4 0 R
>>
endobj

4 0 obj
<< /Length 100 >>
stream
BT
/F1 12 Tf
72 712 Td
({category} Test Document {index}) Tj
ET
endstream
endobj

trailer
<< /Root 1 0 R >>
%%EOF"""
        return header + content

    def _generate_doc_content(self, index: int, category: str) -> str:
        # Simulate Word document content
        return f"""MIME-Version: 1.0
Content-Type: application/msword
Content-Transfer-Encoding: binary

{category.upper()} TEST DOCUMENT {index}

1. Test Overview
   - Category: {category}
   - ID: {index}
   - Priority: {random.randint(1, 3)}

2. Test Objectives
   - Verify system functionality
   - Validate data processing
   - Measure performance

3. Expected Results
   - All tests should pass
   - Performance within thresholds
   - No errors reported

4. Notes
   This is a simulated Word document for testing purposes.
"""

    def generate_users(self) -> List[Dict]:
        """Generate comprehensive test user data"""
        roles = {
            "admin": ["read", "write", "admin", "manage_users"],
            "power_user": ["read", "write", "share"],
            "user": ["read", "write"],
            "viewer": ["read"]
        }
        
        users = []
        for i, (role, permissions) in enumerate(roles.items(), 1):
            users.append({
                "id": f"test{i}",
                "email": f"test{i}@example.com",
                "name": f"Test {role.title()} {i}",
                "role": role,
                "permissions": permissions,
                "created_at": datetime.now().isoformat(),
                "status": "active",
                "preferences": {
                    "theme": random.choice(["light", "dark"]),
                    "notifications": True,
                    "language": "en"
                }
            })
        
        user_file = self.test_data_dir / "users.json"
        with open(user_file, "w") as f:
            json.dump(users, f, indent=2)
        
        logger.info(f"Generated users data: {user_file}")
        return users

    def generate_sharing(self) -> List[Dict]:
        """Generate comprehensive file sharing scenarios"""
        sharing_scenarios = [
            {
                "file_id": "unit_test_1.txt",
                "owner": "test1",
                "shared_with": ["test2"],
                "permissions": ["read"],
                "shared_at": datetime.now().isoformat(),
                "expires_at": None,
                "access_count": random.randint(1, 10),
                "status": "active"
            },
            {
                "file_id": "integration_test_2.pdf",
                "owner": "test2",
                "shared_with": ["test1", "test3"],
                "permissions": ["read", "write"],
                "shared_at": datetime.now().isoformat(),
                "expires_at": (datetime.now().replace(day=datetime.now().day + 7)).isoformat(),
                "access_count": random.randint(1, 10),
                "status": "active"
            },
            {
                "file_id": "performance_test_3.json",
                "owner": "test1",
                "shared_with": ["test4"],
                "permissions": ["read"],
                "shared_at": datetime.now().isoformat(),
                "expires_at": None,
                "access_count": 0,
                "status": "pending"
            }
        ]
        
        sharing_file = self.test_data_dir / "sharing.json"
        with open(sharing_file, "w") as f:
            json.dump(sharing_scenarios, f, indent=2)
        
        logger.info(f"Generated sharing data: {sharing_file}")
        return sharing_scenarios

    def generate_rag_test_data(self):
        """Generate comprehensive RAG system test data"""
        rag_data = {
            "documents": [
                {
                    "id": "doc1",
                    "content": """The quick brown fox jumps over the lazy dog. 
                    This classic pangram contains every letter of the English alphabet at least once.
                    Pangrams are often used to display font samples and test keyboards.
                    This document tests basic text retrieval capabilities.""",
                    "metadata": {
                        "type": "test",
                        "category": "basic",
                        "complexity": "simple",
                        "tags": ["pangram", "english", "test"],
                        "priority": 1,
                        "embedding_model": "text-embedding-3-small"
                    }
                },
                {
                    "id": "doc2",
                    "content": """RAG systems combine retrieval and generation for better AI responses.
                    They work by first retrieving relevant documents from a knowledge base,
                    then using those documents to generate accurate and contextual responses.
                    This document tests technical content retrieval.
                    
                    Key RAG Components:
                    1. Document Indexing
                    2. Vector Search
                    3. Query Expansion
                    4. Response Generation
                    5. Context Integration""",
                    "metadata": {
                        "type": "test",
                        "category": "technical",
                        "complexity": "high",
                        "tags": ["rag", "ai", "technical"],
                        "priority": 1,
                        "embedding_model": "text-embedding-3-small"
                    }
                },
                {
                    "id": "doc3",
                    "content": """Performance testing guidelines for RAG systems:
                    1. Measure retrieval latency
                    2. Evaluate response quality
                    3. Monitor resource usage
                    4. Test with varying load
                    5. Benchmark against baselines
                    
                    Performance Metrics:
                    - Query Response Time
                    - Throughput (QPS)
                    - Memory Usage
                    - GPU Utilization
                    - Relevance Scores
                    - Context Window Usage""",
                    "metadata": {
                        "type": "test",
                        "category": "performance",
                        "complexity": "medium",
                        "tags": ["performance", "testing", "metrics"],
                        "priority": 2,
                        "embedding_model": "text-embedding-3-small"
                    }
                },
                {
                    "id": "doc4",
                    "content": """Error handling in RAG systems:
                    1. Invalid queries
                    2. Missing documents
                    3. Embedding failures
                    4. Context window overflow
                    5. Rate limiting
                    
                    Error Response Templates:
                    - "Unable to process query: {error}"
                    - "Document not found: {doc_id}"
                    - "Embedding generation failed"
                    - "Context window exceeded"
                    - "Rate limit reached" """,
                    "metadata": {
                        "type": "test",
                        "category": "error_handling",
                        "complexity": "high",
                        "tags": ["errors", "handling", "edge_cases"],
                        "priority": 1,
                        "embedding_model": "text-embedding-3-small"
                    }
                }
            ],
            "queries": [
                {
                    "query": "What does the fox do?",
                    "expected_doc_ids": ["doc1"],
                    "expected_snippets": ["quick brown fox jumps"],
                    "difficulty": "easy",
                    "expected_metrics": {
                        "retrieval_time_ms": 100,
                        "relevance_score": 0.9,
                        "context_length": 100
                    }
                },
                {
                    "query": "How do RAG systems work and what are their components?",
                    "expected_doc_ids": ["doc2"],
                    "expected_snippets": [
                        "combine retrieval and generation",
                        "Key RAG Components"
                    ],
                    "difficulty": "medium",
                    "expected_metrics": {
                        "retrieval_time_ms": 150,
                        "relevance_score": 0.85,
                        "context_length": 250
                    }
                },
                {
                    "query": "What metrics should we track for RAG performance testing?",
                    "expected_doc_ids": ["doc3"],
                    "expected_snippets": [
                        "Performance Metrics",
                        "Query Response Time",
                        "Throughput (QPS)"
                    ],
                    "difficulty": "hard",
                    "expected_metrics": {
                        "retrieval_time_ms": 200,
                        "relevance_score": 0.8,
                        "context_length": 300
                    }
                },
                {
                    "query": "How should the system handle errors and edge cases?",
                    "expected_doc_ids": ["doc4"],
                    "expected_snippets": [
                        "Error handling in RAG systems",
                        "Error Response Templates"
                    ],
                    "difficulty": "hard",
                    "expected_metrics": {
                        "retrieval_time_ms": 180,
                        "relevance_score": 0.85,
                        "context_length": 250
                    }
                }
            ],
            "performance_metrics": {
                "expected_retrieval_time_ms": 100,
                "expected_generation_time_ms": 500,
                "minimum_relevance_score": 0.7,
                "target_throughput_qps": 10,
                "max_memory_usage_mb": 1024,
                "max_gpu_memory_mb": 2048,
                "max_context_length": 4096,
                "chunk_size": 512,
                "chunk_overlap": 50
            },
            "test_scenarios": [
                {
                    "name": "Basic Retrieval",
                    "description": "Test basic document retrieval capabilities",
                    "queries": ["What does the fox do?"],
                    "expected_latency_ms": 100,
                    "test_type": "functional"
                },
                {
                    "name": "Technical Content",
                    "description": "Test retrieval of technical documentation",
                    "queries": ["How do RAG systems work?", "Explain RAG components"],
                    "expected_latency_ms": 150,
                    "test_type": "functional"
                },
                {
                    "name": "Performance Testing",
                    "description": "Test system under load",
                    "queries": ["What metrics to track?", "How to measure performance?"],
                    "expected_latency_ms": 200,
                    "test_type": "performance",
                    "load_test_config": {
                        "concurrent_users": 10,
                        "ramp_up_time_sec": 30,
                        "steady_state_time_sec": 300,
                        "cool_down_time_sec": 30
                    }
                },
                {
                    "name": "Error Handling",
                    "description": "Test system error handling",
                    "queries": [
                        "",  # Empty query
                        "x" * 1000,  # Very long query
                        "🚀🌟✨"  # Special characters
                    ],
                    "expected_latency_ms": 50,
                    "test_type": "error_handling",
                    "expected_errors": [
                        "Empty query not allowed",
                        "Query too long",
                        "Invalid characters in query"
                    ]
                }
            ]
        }
        
        rag_file = self.test_data_dir / "rag_test_data.json"
        with open(rag_file, "w") as f:
            json.dump(rag_data, f, indent=2)
        
        logger.info(f"Generated RAG test data: {rag_file}")

def main():
    generator = TestDataGenerator()
    
    # Generate all test data
    files = generator.generate_files()
    users = generator.generate_users()
    sharing = generator.generate_sharing()
    generator.generate_rag_test_data()
    
    # Save manifest of all generated data
    manifest = {
        "files": files,
        "users": users,
        "sharing": sharing,
        "generated_at": datetime.now().isoformat(),
        "test_suite_version": "1.0.0",
        "metadata": {
            "purpose": "Integration and Performance Testing",
            "environment": "development",
            "generated_by": "TestDataGenerator",
            "categories": ["unit", "integration", "performance"],
            "total_files": len(files),
            "total_users": len(users),
            "total_sharing_scenarios": len(sharing)
        }
    }
    
    with open(generator.test_data_dir / "manifest.json", "w") as f:
        json.dump(manifest, f, indent=2)
    
    logger.info("✅ Test data generation complete!")

if __name__ == "__main__":
    main() 