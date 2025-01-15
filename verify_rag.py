import time
import traceback
from typing import Dict, Tuple, Any
from src.ai.rag import RAGSystem

class RAGVerifier:
    def __init__(self):
        self.rag = RAGSystem()
        self.results = {
            "ingestion": {"passed": False, "details": ""},
            "query": {"passed": False, "details": ""},
            "performance": {"passed": False, "details": ""}
        }

    def verify_ingestion(self) -> Tuple[bool, str]:
        """Verify document ingestion functionality."""
        try:
            test_doc = """
            Agile is an iterative approach to project management and software development
            that helps teams deliver value to their customers faster and with fewer headaches. 
            Instead of betting everything on a "big bang" launch, an agile team delivers work 
            in small, but consumable, increments.
            """
            
            num_chunks = self.rag.ingest_text(test_doc, {"source": "test"})
            return True, f"Successfully ingested document into {num_chunks} chunks"
        except Exception as e:
            return False, f"Failed to ingest document: {str(e)}"

    def verify_query(self) -> Tuple[bool, str]:
        """Verify query functionality."""
        try:
            response = self.rag.query("What is Agile?")
            if response and isinstance(response, str) and len(response) > 0:
                return True, "Successfully queried RAG system"
            return False, "Query returned empty or invalid response"
        except Exception as e:
            return False, f"Failed to query RAG system: {str(e)}"

    def verify_performance(self) -> Tuple[bool, str]:
        """Verify system performance."""
        try:
            start_time = time.time()
            
            # Test ingestion performance
            test_doc = "Test document for performance verification."
            self.rag.ingest_text(test_doc)
            
            # Test query performance
            self.rag.query("What is the test about?")
            
            total_time = time.time() - start_time
            if total_time < 5:  # 5 second threshold
                return True, f"Performance check passed in {total_time:.2f} seconds"
            return False, f"Performance check failed - took {total_time:.2f} seconds"
        except Exception as e:
            return False, f"Performance check failed with error: {str(e)}"

    def run_all_checks(self) -> None:
        """Run all verification checks."""
        print("\n🔍 Running RAG System Verification\n")
        
        # Ingestion Check
        passed, details = self.verify_ingestion()
        self.results["ingestion"] = {"passed": passed, "details": details}
        print(f"{'✅' if passed else '❌'} Ingestion Check: {details}")
        
        if passed:
            # Query Check
            passed, details = self.verify_query()
            self.results["query"] = {"passed": passed, "details": details}
            print(f"{'✅' if passed else '❌'} Query Check: {details}")
            
            # Performance Check
            passed, details = self.verify_performance()
            self.results["performance"] = {"passed": passed, "details": details}
            print(f"{'✅' if passed else '❌'} Performance Check: {details}")
        
        print("\n📊 Verification Summary:")
        all_passed = all(result["passed"] for result in self.results.values())
        print(f"{'✅' if all_passed else '❌'} Overall Status: {'All checks passed!' if all_passed else 'Some checks failed'}")
        
        if not all_passed:
            print("\n🔧 Action Items:")
            for check, result in self.results.items():
                if not result["passed"]:
                    print(f"- Fix {check}: {result['details']}")

def main():
    try:
        verifier = RAGVerifier()
        verifier.run_all_checks()
    except Exception as e:
        print(f"\n❌ Verification failed to start: {str(e)}\n")
        print("Traceback:")
        print(traceback.format_exc())
        print("\nTip: Ensure all required files and dependencies are in place")

if __name__ == "__main__":
    main() 