"""Event type constants for the RAG system."""

# Document events
EVENT_INGESTION = "document_ingestion"
EVENT_INDEXING = "document_indexing"
EVENT_UPDATE = "document_update"
EVENT_DELETION = "document_deletion"

# Query events
EVENT_QUERY = "query"
EVENT_QUERY_EXPANSION = "query_expansion"
EVENT_RETRIEVAL = "document_retrieval"
EVENT_RERANKING = "result_reranking"

# System events
EVENT_SYSTEM_STARTUP = "system_startup"
EVENT_SYSTEM_SHUTDOWN = "system_shutdown"
EVENT_CACHE_CLEAR = "cache_clear"
EVENT_INDEX_REBUILD = "index_rebuild"

# Performance events
EVENT_PERFORMANCE_CHECK = "performance_check"
EVENT_RESOURCE_MONITOR = "resource_monitor"
EVENT_OPTIMIZATION = "system_optimization"

# Quality events
EVENT_QUALITY_CHECK = "quality_check"
EVENT_FEEDBACK = "user_feedback"
EVENT_METRIC_UPDATE = "metric_update" 