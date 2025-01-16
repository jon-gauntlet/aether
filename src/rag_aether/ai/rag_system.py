from typing import List, Dict, Optional, Tuple, Union
import numpy as np
from sentence_transformers import SentenceTransformer, util
import faiss
from datetime import datetime, timedelta
import json
import openai
from openai import OpenAI
import os
from dotenv import load_dotenv
from rag_aether.ai.rag import BaseRAG
from rag_aether.core.quality import QualityScorer
from rag_aether.core.cache import QueryCache, EmbeddingCache
from rag_aether.core.metrics import MetricsTracker
from rag_aether.core.logging import get_logger

load_dotenv()
logger = get_logger("rag_system")

class RAGSystem:
    def __init__(
        self,
        model_name: str = "BAAI/bge-large-en-v1.5",
        use_production_features: bool = True
    ):
        """Initialize RAG system with production features
        
        Args:
            model_name: Name of the embedding model to use
            use_production_features: Whether to use production features like caching and quality scoring
        """
        # Initialize base RAG system with production features
        self.base_rag = BaseRAG(
            model_name=model_name,
            use_query_expansion=True,
            use_query_reformulation=True,
            query_cache_size=1000,
            embedding_cache_size=10000,
            min_confidence_threshold=0.7,
            min_relevance_threshold=0.6
        ) if use_production_features else None
        
        # Initialize simple components if not using production features
        if not use_production_features:
            self.model = SentenceTransformer(model_name)
            self.dimension = 384
            self.index = faiss.IndexFlatL2(self.dimension)
            
        # Shared components
        self.messages: List[Dict] = []
        self.client = OpenAI()
        self.metrics = MetricsTracker()
        
        logger.info(
            "Initialized RAG system",
            extra={
                "model": model_name,
                "production_features": use_production_features
            }
        )
        
    def ingest_message(self, message: Dict) -> None:
        """Ingest a new message into the system
        
        Args:
            message: Dict containing:
                - content: str
                - channel: str
                - user_id: str
                - timestamp: float
                - thread_id: Optional[str]
        """
        try:
            with self.metrics.track_operation("ingest_message"):
                if self.base_rag:
                    # Use production features
                    metadata = {
                        "channel": message["channel"],
                        "user_id": message["user_id"],
                        "timestamp": message["timestamp"],
                        "thread_id": message.get("thread_id"),
                        "vector_id": len(self.messages)
                    }
                    
                    # Ingest with production features
                    self.base_rag.ingest_text(
                        text=message["content"],
                        metadata=metadata,
                        doc_id=str(len(self.messages))
                    )
                else:
                    # Use simple ingestion
                    embedding = self.model.encode([message["content"]])[0]
                    self.index.add(np.array([embedding], dtype=np.float32))
                
                # Store message with timestamp
                self.messages.append({
                    **message,
                    "vector_id": len(self.messages),
                    "ingested_at": datetime.now().isoformat()
                })
                
                logger.info(
                    "Message ingested successfully",
                    extra={
                        "channel": message["channel"],
                        "thread_id": message.get("thread_id"),
                        "vector_id": len(self.messages) - 1
                    }
                )
                
        except Exception as e:
            logger.error(
                f"Failed to ingest message: {str(e)}",
                extra={
                    "channel": message.get("channel"),
                    "thread_id": message.get("thread_id")
                }
            )
            raise

    def search_context(
        self, 
        query: str, 
        k: int = 5,
        channel: Optional[str] = None,
        thread_id: Optional[str] = None,
        time_window_hours: Optional[float] = None
    ) -> List[Dict]:
        """Search for most relevant messages given a query and context
        
        Args:
            query: Search query string
            k: Number of results to return
            channel: Optional channel to search within
            thread_id: Optional thread to search within
            time_window_hours: Optional time window to search within
            
        Returns:
            List of k most relevant messages with scores
        """
        try:
            with self.metrics.track_operation("search_context"):
                if self.base_rag:
                    # Use production features
                    metadata_filter = {}
                    if channel:
                        metadata_filter["channel"] = channel
                    if thread_id:
                        metadata_filter["thread_id"] = thread_id
                    if time_window_hours:
                        now = datetime.now()
                        metadata_filter["timestamp"] = {
                            "gte": (now - timedelta(hours=time_window_hours)).timestamp()
                        }
                    
                    # Search with production features
                    results = self.base_rag.retrieve_with_fusion(
                        query=query,
                        k=k,
                        metadata_filter=metadata_filter,
                        use_query_processing=True,
                        return_contexts=True
                    )
                    
                    # Format results to match expected structure
                    formatted_results = []
                    for result in results:
                        msg_id = int(result["metadata"]["doc_id"])
                        if msg_id < len(self.messages):
                            formatted_results.append({
                                **self.messages[msg_id],
                                "relevance_score": float(result["score"])
                            })
                    
                    return formatted_results
                    
                else:
                    # Use simple search
                    query_embedding = self.model.encode([query])[0]
                    scores, indices = self.index.search(
                        np.array([query_embedding], dtype=np.float32), 
                        min(k * 2, len(self.messages))
                    )
                    
                    # Filter and rerank results
                    results = []
                    now = datetime.now()
                    
                    for score, idx in zip(scores[0], indices[0]):
                        if idx >= len(self.messages):
                            continue
                            
                        msg = self.messages[idx]
                        
                        # Apply filters
                        if channel and msg["channel"] != channel:
                            continue
                        if thread_id and msg.get("thread_id") != thread_id:
                            continue
                        if time_window_hours:
                            msg_time = datetime.fromisoformat(msg["timestamp"])
                            hours_old = (now - msg_time).total_seconds() / 3600
                            if hours_old > time_window_hours:
                                continue
                        
                        # Add to results
                        results.append({
                            **msg,
                            "relevance_score": float(score)
                        })
                        
                        if len(results) >= k:
                            break
                    
                    return results
                    
        except Exception as e:
            logger.error(
                f"Failed to search context: {str(e)}",
                extra={
                    "query": query,
                    "channel": channel,
                    "thread_id": thread_id
                }
            )
            raise

    def get_enhanced_context(
        self,
        query: str,
        k: int = 5,
        include_channels: bool = True,
        include_threads: bool = True,
        include_user_history: bool = True
    ) -> Dict[str, List[Dict]]:
        """Get comprehensive context for a query
        
        Args:
            query: Search query string
            k: Base number of results per context type
            include_channels: Whether to include channel context
            include_threads: Whether to include thread context
            include_user_history: Whether to include user history
            
        Returns:
            Dict containing different types of context
        """
        context = {
            "semantic_matches": self.search_context(query, k=k)
        }
        
        if not context["semantic_matches"]:
            return context
            
        # Get most relevant message
        top_msg = context["semantic_matches"][0]
        
        # Add channel context
        if include_channels and top_msg.get("channel"):
            context["channel_context"] = self.get_channel_context(
                top_msg["channel"],
                limit=k
            )
            
        # Add thread context
        if include_threads and top_msg.get("thread_id"):
            context["thread_context"] = self.get_thread_context(
                top_msg["thread_id"]
            )
            
        # Add user history
        if include_user_history and top_msg.get("user_id"):
            context["user_history"] = self.get_user_context(
                top_msg["user_id"],
                limit=k
            )
            
        return context

    def get_channel_context(self, channel: str, limit: int = 10) -> List[Dict]:
        """Get recent messages from a specific channel"""
        channel_msgs = [
            msg for msg in self.messages 
            if msg["channel"] == channel
        ]
        return sorted(
            channel_msgs,
            key=lambda x: x["timestamp"],
            reverse=True
        )[:limit]

    def get_thread_context(self, thread_id: str) -> List[Dict]:
        """Get all messages in a thread"""
        return sorted(
            [msg for msg in self.messages if msg.get("thread_id") == thread_id],
            key=lambda x: x["timestamp"]
        )

    def get_user_context(self, user_id: str, limit: int = 50) -> List[Dict]:
        """Get recent messages from a specific user"""
        user_msgs = [
            msg for msg in self.messages
            if msg["user_id"] == user_id
        ]
        return sorted(
            user_msgs,
            key=lambda x: x["timestamp"],
            reverse=True
        )[:limit] 

    def generate_response(
        self,
        query: str,
        max_context_messages: int = 5,
        format: str = "text",
        style: Optional[str] = None,
        temperature: float = 0.7
    ) -> Union[str, Dict]:
        """Generate a natural response to a query using RAG
        
        Args:
            query: User's question
            max_context_messages: Max number of context messages to use
            format: Response format ('text', 'markdown', or 'json')
            style: Optional response style ('concise', 'detailed', or 'technical')
            temperature: Controls response creativity (0.0-1.0)
            
        Returns:
            Generated response in requested format
        """
        try:
            with self.metrics.track_operation("generate_response"):
                # Get enhanced context
                context = self.get_enhanced_context(
                    query=query,
                    k=max_context_messages
                )
                
                # Format context messages
                context_text = self._format_context(context, style)
                
                # Prepare system message based on style
                system_message = self._get_system_message(style)
                
                if self.base_rag:
                    # Use production features for response generation
                    response = self.base_rag.generate_response(
                        query=query,
                        context=context_text,
                        system_message=system_message,
                        temperature=temperature,
                        format=format
                    )
                    
                    # Add chat-specific metadata
                    response["metadata"].update({
                        "num_context_messages": len(context.get("semantic_matches", [])),
                        "has_thread_context": "thread_context" in context,
                        "has_channel_context": "channel_context" in context
                    })
                    
                else:
                    # Use simple response generation
                    messages = [
                        {"role": "system", "content": system_message},
                        {"role": "user", "content": f"Context:\n{context_text}\n\nQuestion: {query}"}
                    ]
                    
                    chat_completion = self.client.chat.completions.create(
                        model="gpt-3.5-turbo",
                        messages=messages,
                        temperature=temperature,
                        max_tokens=1000
                    )
                    
                    response = {
                        "answer": chat_completion.choices[0].message.content,
                        "context": context_text,
                        "metadata": {
                            "num_context_messages": len(context.get("semantic_matches", [])),
                            "has_thread_context": "thread_context" in context,
                            "has_channel_context": "channel_context" in context,
                            "timestamp": datetime.now().isoformat(),
                            "model": "gpt-3.5-turbo",
                            "temperature": temperature
                        }
                    }
                
                logger.info(
                    "Generated response successfully",
                    extra={
                        "query_length": len(query),
                        "response_length": len(response["answer"]),
                        "num_context_messages": response["metadata"]["num_context_messages"]
                    }
                )
                
                return response
                
        except Exception as e:
            logger.error(
                f"Failed to generate response: {str(e)}",
                extra={
                    "query": query,
                    "style": style,
                    "format": format
                }
            )
            raise

    def _format_context(self, context: Dict[str, List[Dict]], style: Optional[str]) -> str:
        """Format context messages based on style
        
        Args:
            context: Context dictionary from get_enhanced_context
            style: Optional formatting style
        """
        parts = []
        
        # Add semantic matches
        if context.get("semantic_matches"):
            matches = context["semantic_matches"]
            if style == "concise":
                # Just use top match
                parts.append(matches[0]["content"])
            elif style == "technical":
                # Add scores and metadata
                for match in matches:
                    parts.append(
                        f"{match['content']} (score: {match['relevance_score']:.2f})"
                    )
            else:
                # Default: all content
                parts.extend(m["content"] for m in matches)
                
        # Add thread context if available
        if context.get("thread_context"):
            thread = context["thread_context"]
            if style == "concise":
                # Just thread summary
                parts.append(f"From thread with {len(thread)} messages")
            else:
                # Full thread context
                parts.append("\nThread context:")
                parts.extend(f"- {m['content']}" for m in thread)
                
        return "\n".join(parts)
        
    def _format_markdown_response(self, response: Dict) -> str:
        """Format response as markdown
        
        Args:
            response: Response dictionary
        """
        parts = [
            f"# Response\n{response['answer']}\n",
            "## Context\n" + response["context"],
            "\n---\n",
            f"*Generated at {response['metadata']['timestamp']}*"
        ]
        return "\n".join(parts) 

    def _get_system_message(self, style: Optional[str]) -> str:
        """Get appropriate system message based on style
        
        Args:
            style: Response style preference
        """
        base_prompt = (
            "You are a helpful AI assistant with access to conversation history. "
            "Use the provided context to answer questions accurately and naturally. "
            "Only use information from the context, and say 'I don't have enough context to answer that' if needed."
        )
        
        if style == "concise":
            return base_prompt + " Provide brief, focused answers."
        elif style == "technical":
            return base_prompt + " Include technical details and cite relevance scores when available."
        else:
            return base_prompt + " Provide comprehensive but clear answers." 