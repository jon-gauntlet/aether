"""Sharded index implementation for scalable vector storage."""
from typing import List, Tuple, Optional, Dict, Any
import numpy as np
import faiss
import os
from pathlib import Path
from rag_aether.core.logging import get_logger
from rag_aether.core.errors import IndexError
from rag_aether.core.performance import with_performance_monitoring, performance_section

logger = get_logger("index")

class ShardedIndex:
    """Sharded FAISS index for scalable vector storage."""
    
    def __init__(
        self,
        dimension: int = 384,  # Default for BGE model
        num_shards: int = 2,
        index_type: str = "IVFFlat",
        nlist: int = 100,
        nprobe: int = 10,
        use_gpu: bool = False
    ):
        """Initialize sharded index."""
        self.dimension = dimension
        self.num_shards = num_shards
        self.index_type = index_type
        self.nlist = nlist
        self.nprobe = nprobe
        self.use_gpu = use_gpu
        
        # Initialize shards
        self.shards = []
        for i in range(num_shards):
            shard = self._create_index()
            self.shards.append(shard)
            
        logger.info(
            "Initialized sharded index",
            extra={
                "dimension": dimension,
                "num_shards": num_shards,
                "index_type": index_type,
                "use_gpu": use_gpu
            }
        )
        
    @with_performance_monitoring(operation="create", component="index")
    def _create_index(self) -> faiss.Index:
        """Create a FAISS index shard."""
        try:
            if self.index_type == "Flat":
                index = faiss.IndexFlatIP(self.dimension)
            elif self.index_type == "IVFFlat":
                quantizer = faiss.IndexFlatIP(self.dimension)
                index = faiss.IndexIVFFlat(
                    quantizer,
                    self.dimension,
                    self.nlist,
                    faiss.METRIC_INNER_PRODUCT
                )
            else:
                raise ValueError(f"Unsupported index type: {self.index_type}")
                
            # Move to GPU if requested and available
            if self.use_gpu and faiss.get_num_gpus() > 0:
                res = faiss.StandardGpuResources()
                index = faiss.index_cpu_to_gpu(res, 0, index)
                
            return index
            
        except Exception as e:
            raise IndexError(
                f"Failed to create index: {str(e)}",
                operation="create",
                component="index"
            )
    
    @with_performance_monitoring(operation="add", component="index")
    def add(
        self,
        vectors: np.ndarray,
        ids: Optional[np.ndarray] = None
    ) -> None:
        """Add vectors to sharded index."""
        try:
            # Normalize vectors
            faiss.normalize_L2(vectors)
            
            # Split vectors across shards
            n = len(vectors)
            shard_size = n // self.num_shards
            
            for i in range(self.num_shards):
                start = i * shard_size
                end = start + shard_size if i < self.num_shards - 1 else n
                
                shard_vectors = vectors[start:end]
                
                if ids is not None:
                    shard_ids = ids[start:end]
                    self.shards[i].add_with_ids(shard_vectors, shard_ids)
                else:
                    self.shards[i].add(shard_vectors)
                    
            logger.debug(
                "Added vectors to index",
                extra={"num_vectors": n}
            )
            
        except Exception as e:
            raise IndexError(
                f"Failed to add vectors: {str(e)}",
                operation="add",
                component="index"
            )
    
    @with_performance_monitoring(operation="search", component="index")
    def search(
        self,
        query: np.ndarray,
        k: int
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Search across all shards and merge results."""
        try:
            # Normalize query
            faiss.normalize_L2(query)
            
            # Search each shard
            all_D = []
            all_I = []
            
            for shard in self.shards:
                if isinstance(shard, faiss.IndexIVFFlat):
                    shard.nprobe = self.nprobe
                D, I = shard.search(query, k)
                all_D.append(D)
                all_I.append(I)
                
            # Merge results
            D = np.concatenate(all_D, axis=1)
            I = np.concatenate(all_I, axis=1)
            
            # Sort merged results
            for i in range(len(query)):
                order = np.argsort(D[i])[::-1][:k]
                D[i] = D[i][order]
                I[i] = I[i][order]
                
            return D, I
            
        except Exception as e:
            raise IndexError(
                f"Failed to search index: {str(e)}",
                operation="search",
                component="index"
            )
    
    def save(self, directory: str) -> None:
        """Save sharded index to disk."""
        try:
            directory = Path(directory)
            directory.mkdir(parents=True, exist_ok=True)
            
            # Save configuration
            config = {
                "dimension": self.dimension,
                "num_shards": self.num_shards,
                "index_type": self.index_type,
                "nlist": self.nlist,
                "nprobe": self.nprobe
            }
            
            config_path = directory / "config.json"
            with open(config_path, "w") as f:
                json.dump(config, f)
                
            # Save each shard
            for i, shard in enumerate(self.shards):
                shard_path = directory / f"shard_{i}.index"
                
                # Convert GPU index to CPU if needed
                if self.use_gpu:
                    shard = faiss.index_gpu_to_cpu(shard)
                    
                faiss.write_index(shard, str(shard_path))
                
            logger.info(f"Saved index to {directory}")
            
        except Exception as e:
            raise IndexError(
                f"Failed to save index: {str(e)}",
                operation="save",
                component="index"
            )
    
    @classmethod
    def load(cls, directory: str) -> "ShardedIndex":
        """Load sharded index from disk."""
        try:
            directory = Path(directory)
            
            # Load configuration
            config_path = directory / "config.json"
            with open(config_path) as f:
                config = json.load(f)
                
            # Create instance
            index = cls(**config)
            
            # Load each shard
            for i in range(config["num_shards"]):
                shard_path = directory / f"shard_{i}.index"
                shard = faiss.read_index(str(shard_path))
                
                # Move to GPU if needed
                if index.use_gpu:
                    res = faiss.StandardGpuResources()
                    shard = faiss.index_cpu_to_gpu(res, 0, shard)
                    
                index.shards[i] = shard
                
            logger.info(f"Loaded index from {directory}")
            return index
            
        except Exception as e:
            raise IndexError(
                f"Failed to load index: {str(e)}",
                operation="load",
                component="index"
            )
    
    def optimize(self) -> None:
        """Optimize index for faster search."""
        try:
            for shard in self.shards:
                if isinstance(shard, faiss.IndexIVFFlat):
                    if not shard.is_trained:
                        # Get random subset of vectors for training
                        n = shard.ntotal
                        if n > 0:
                            sample_size = min(100000, n)
                            indices = np.random.choice(n, sample_size, replace=False)
                            vectors = shard.reconstruct_n(indices[0], indices[-1] + 1)
                            shard.train(vectors)
                            
            logger.info("Optimized index")
            
        except Exception as e:
            raise IndexError(
                f"Failed to optimize index: {str(e)}",
                operation="optimize",
                component="index"
            ) 