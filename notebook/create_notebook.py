import json

nb = {
    "cells": [
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "# RAG System Demo\n\n",
                "This notebook demonstrates the RAG system for Aether chat features.\n\n",
                "## Contents\n",
                "1. Setup & Imports\n",
                "2. Loading Chat Data\n",
                "3. Document Processing\n",
                "4. Semantic Search\n",
                "5. Question Answering"
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "source": [
                "import os\n",
                "from dotenv import load_dotenv\n",
                "from langchain_openai import OpenAIEmbeddings, ChatOpenAI\n",
                "from langchain.chains import RetrievalQA\n",
                "from langchain_community.vectorstores import FAISS\n\n",
                "# Load environment variables\n",
                "load_dotenv()\n\n",
                "# Initialize OpenAI components\n",
                "embeddings = OpenAIEmbeddings()\n",
                "llm = ChatOpenAI(temperature=0)\n",
                "print(\"OpenAI components initialized!\")"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## Loading Chat Data\n\n",
                "First, we will load our chat data from the mock conversations we created."
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "source": [
                "from tools.rag.data_prep import create_langchain_documents\n\n",
                "# Load documents\n",
                "documents = create_langchain_documents()\n",
                "print(f\"Loaded {len(documents)} documents\")\n\n",
                "# Display first document as example\n",
                "print(\"\\nExample document:\")\n",
                "print(f\"Content: {documents[0].page_content}\")\n",
                "print(f\"Metadata: {documents[0].metadata}\")"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## Document Processing\n\n",
                "Now we will create our vector store using FAISS."
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "source": [
                "# Create vector store\n",
                "vectorstore = FAISS.from_documents(documents, embeddings)\n",
                "print(\"Vector store created!\")\n\n",
                "# Create retriever\n",
                "retriever = vectorstore.as_retriever(\n",
                "    search_type=\"similarity\",\n",
                "    search_kwargs={\"k\": 3}\n",
                ")\n",
                "print(\"Retriever configured!\")"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## Semantic Search\n\n",
                "Let us test our semantic search capabilities."
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "source": [
                "# Test query\n",
                "query = \"What are some examples of high energy conversations?\"\n",
                "docs = retriever.get_relevant_documents(query)\n\n",
                "print(f\"Found {len(docs)} relevant documents\\n\")\n",
                "for i, doc in enumerate(docs):\n",
                "    print(f\"Document {i+1}:\")\n",
                "    print(f\"Content: {doc.page_content}\")\n",
                "    print(f\"Metadata: {doc.metadata}\\n\")"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## Question Answering\n\n",
                "Finally, let us test our question answering chain."
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "source": [
                "# Create QA chain\n",
                "qa_chain = RetrievalQA.from_chain_type(\n",
                "    llm=llm,\n",
                "    chain_type=\"stuff\",\n",
                "    retriever=retriever,\n",
                "    return_source_documents=True\n",
                ")\n\n",
                "# Test question\n",
                "question = \"How does the system handle conversations with varying energy levels?\"\n",
                "result = qa_chain({\"query\": question})\n\n",
                "print(\"Question:\", question)\n",
                "print(\"\\nAnswer:\", result[\"result\"])\n",
                "print(\"\\nSource Documents:\")\n",
                "for i, doc in enumerate(result[\"source_documents\"]):\n",
                "    print(f\"\\nDocument {i+1}:\")\n",
                "    print(f\"Content: {doc.page_content}\")\n",
                "    print(f\"Metadata: {doc.metadata}\")"
            ]
        }
    ],
    "metadata": {
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3"
        },
        "language_info": {
            "codemirror_mode": {"name": "ipython", "version": 3},
            "file_extension": ".py",
            "mimetype": "text/x-python",
            "name": "python",
            "nbconvert_exporter": "python",
            "pygments_lexer": "ipython3",
            "version": "3.13.1"
        }
    },
    "nbformat": 4,
    "nbformat_minor": 4
}

with open("rag_demo_complete.ipynb", "w") as f:
    json.dump(nb, f, indent=2) 