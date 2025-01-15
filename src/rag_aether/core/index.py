"""Index management for distributed FAISS indices."""
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import faiss
from pathlib import Path
import json
from dataclasses import dataclass
from rag_aether.core.logging import get_logger
from rag_aether.core.performance import with_performance_monitoring, performance_section
from rag_aether.core.errors import IndexError

logger = get_logger("index")

@dataclass
class ShardInfo:
    """Information about an index shard."""
    shard_id: str
    num_vectors: int
    dimension: int
    index_type: str
    metadata: Dict[str, Any]

class ShardedIndex:
    """Manages distributed FAISS indices with sharding."""
    
    def __init__(
        self,
        dimension: int,
        num_shards: int = 2,
        index_type: str = "IVFFlat",
        nlist: int = 100,
        use_gpu: bool = False
    ):
        """Initialize sharded index."""
        self.dimension = dimension
        self.num_shards = num_shards
        self.index_type = index_type
        self.nlist = nlist
        self.use_gpu = use_gpu
        
        # Initialize shards
        self.shards = []
        self._initialize_shards()
        
        logger.info(
            "Initialized sharded index",
            extra={
                "dimension": dimension,
                "num_shards": num_shards,
                "index_type": index_type,
                "nlist": nlist,
                "use_gpu": use_gpu
            }
        )
    
    def _initialize_shards(self) -> None:
        """Initialize index shards."""
        try:
            for i in range(self.num_shards):
                # Create quantizer
                quantizer = faiss.IndexFlatL2(self.dimension)
                
                # Create index
                if self.index_type == "IVFFlat":
                    index = faiss.IndexIVFFlat(
                        quantizer,
                        self.dimension,
                        self.nlist,
                        faiss.METRIC_L2
                    )
                elif self.index_type == "IVFPQ":
                    # Product Quantization for memory efficiency
                    index = faiss.IndexIVFPQ(
                        quantizer,
                        self.dimension,
                        self.nlist,
                        8,  # sub-quantizers
                        8   # bits per sub-quantizer
                    )
                else:
                    raise ValueError(f"Unsupported index type: {self.index_type}")
                
                # Move to GPU if requested
                if self.use_gpu:
                    if not faiss.get_num_gpus():
                        logger.warning("No GPU available, falling back to CPU")
                    else:
                        gpu_index = faiss.index_cpu_to_gpu(
                            faiss.StandardGpuResources(),
                            i % faiss.get_num_gpus(),
                            index
                        )
                        index = gpu_index
                
                self.shards.append({
                    "index": index,
                    "is_trained": False,
                    "info": ShardInfo(
                        shard_id=f"shard_{i}",
                        num_vectors=0,
                        dimension=self.dimension,
                        index_type=self.index_type,
                        metadata={}
                    )
                })
                
            logger.info(f"Initialized {self.num_shards} shards")
            
        except Exception as e:
            logger.error(f"Failed to initialize shards: {str(e)}")
            raise IndexError(
                f"Shard initialization failed: {str(e)}",
                operation="init",
                component="sharded_index"
            )
    
    @with_performance_monitoring(operation="add", component="sharded_index")
    def add(self, vectors: np.ndarray, ids: Optional[np.ndarray] = None) -> None:
        """Add vectors to shards."""
        try:
            num_vectors = len(vectors)
            vectors_per_shard = num_vectors // self.num_shards
            
            for i, shard in enumerate(self.shards):
                # Get vectors for this shard
                start_idx = i * vectors_per_shard
                end_idx = start_idx + vectors_per_shard if i < self.num_shards - 1 else num_vectors
                shard_vectors = vectors[start_idx:end_idx]
                
                # Get IDs for this shard if provided
                shard_ids = None
                if ids is not None:
                    shard_ids = ids[start_idx:end_idx]
                
                # Train if needed
                if not shard["is_trained"] and len(shard_vectors) > self.nlist:
                    with performance_section("train", "sharded_index"):
                        shard["index"].train(shard_vectors)
                        shard["is_trained"] = True
                
                # Add vectors
                with performance_section("add_vectors", "sharded_index"):
                    if shard_ids is not None:
                        shard["index"].add_with_ids(shard_vectors, shard_ids)
                    else:
                        shard["index"].add(shard_vectors)
                
                # Update shard info
                shard["info"].num_vectors += len(shard_vectors)
            
            logger.info(
                "Added vectors to shards",
                extra={"num_vectors": num_vectors}
            )
            
        except Exception as e:
            logger.error(f"Failed to add vectors: {str(e)}")
            raise IndexError(
                f"Vector addition failed: {str(e)}",
                operation="add",
                component="sharded_index"
            )
    
    @with_performance_monitoring(operation="search", component="sharded_index")
    def search(self, query: np.ndarray, k: int) -> Tuple[np.ndarray, np.ndarray]:
        """Search across all shards."""
        try:
            # Search each shard
            all_distances = []
            all_indices = []
            
            for shard in self.shards:
                with performance_section("shard_search", "sharded_index"):
                    D, I = shard["index"].search(query, k)
                    all_distances.append(D)
                    all_indices.append(I)
            
            # Merge results
            with performance_section("merge_results", "sharded_index"):
                distances = np.concatenate(all_distances, axis=1)
                indices = np.concatenate(all_indices, axis=1)
                
                # Sort merged results
                sorted_idx = np.argsort(distances, axis=1)
                final_distances = np.take_along_axis(distances, sorted_idx, axis=1)[:, :k]
                final_indices = np.take_along_axis(indices, sorted_idx, axis=1)[:, :k]
            
            return final_distances, final_indices
            
        except Exception as e:
            logger.error(f"Search failed: {str(e)}")
            raise IndexError(
                f"Search failed: {str(e)}",
                operation="search",
                component="sharded_index"
            )
    
    @with_performance_monitoring(operation="optimize", component="sharded_index")
    def optimize(self) -> None:
        """Optimize index shards."""
        try:
            for i, shard in enumerate(self.shards):
                with performance_section(f"optimize_shard_{i}", "sharded_index"):
                    # Perform index-specific optimizations
                    if isinstance(shard["index"], faiss.IndexIVFFlat):
                        # Optimize IVF clustering
                        if shard["info"].num_vectors > self.nlist * 10:
                            shard["index"].train(self._sample_vectors(shard["index"], 100000))
                    
                    elif isinstance(shard["index"], faiss.IndexIVFPQ):
                        # Optimize PQ codebooks
                        if shard["info"].num_vectors > self.nlist * 10:
                            shard["index"].train(self._sample_vectors(shard["index"], 100000))
                    
                    # Set number of probes based on index size
                    num_vectors = shard["info"].num_vectors
                    if num_vectors < 100000:
                        probe_multiplier = 0.1
                    elif num_vectors < 1000000:
                        probe_multiplier = 0.05
                    else:
                        probe_multiplier = 0.02
                    
                    nprobe = max(1, int(self.nlist * probe_multiplier))
                    shard["index"].nprobe = nprobe
            
            logger.info("Optimized all shards")
            
        except Exception as e:
            logger.error(f"Optimization failed: {str(e)}")
            raise IndexError(
                f"Optimization failed: {str(e)}",
                operation="optimize",
                component="sharded_index"
            )
    
    def _sample_vectors(self, index: faiss.Index, n: int) -> np.ndarray:
        """Sample vectors from index for optimization."""
        total = index.ntotal
        if total <= n:
            return faiss.vector_float_to_array(index.codes)
        
        # Sample random indices
        indices = np.random.choice(total, n, replace=False)
        return faiss.vector_float_to_array(index.codes)[indices]
    
    def save(self, directory: str) -> None:
        """Save sharded index to directory."""
        try:
            save_path = Path(directory)
            save_path.mkdir(parents=True, exist_ok=True)
            
            # Save each shard
            for i, shard in enumerate(self.shards):
                # Save index
                index_path = save_path / f"shard_{i}.index"
                faiss.write_index(
                    faiss.index_gpu_to_cpu(shard["index"])
                    if self.use_gpu else shard["index"],
                    str(index_path)
                )
                
                # Save shard info
                info_path = save_path / f"shard_{i}.json"
                with open(info_path, "w") as f:
                    json.dump(vars(shard["info"]), f)
            
            # Save config
            config_path = save_path / "config.json"
            with open(config_path, "w") as f:
                json.dump({
                    "dimension": self.dimension,
                    "num_shards": self.num_shards,
                    "index_type": self.index_type,
                    "nlist": self.nlist,
                    "use_gpu": self.use_gpu
                }, f)
            
            logger.info(f"Saved sharded index to {directory}")
            
        except Exception as e:
            logger.error(f"Failed to save index: {str(e)}")
            raise IndexError(
                f"Index save failed: {str(e)}",
                operation="save",
                component="sharded_index"
            )
    
    @classmethod
    def load(cls, directory: str) -> "ShardedIndex":
        """Load sharded index from directory."""
        try:
            load_path = Path(directory)
            
            # Load config
            config_path = load_path / "config.json"
            with open(config_path) as f:
                config = json.load(f)
            
            # Create instance
            instance = cls(
                dimension=config["dimension"],
                num_shards=config["num_shards"],
                index_type=config["index_type"],
                nlist=config["nlist"],
                use_gpu=config["use_gpu"]
            )
            
            # Load each shard
            for i in range(config["num_shards"]):
                # Load index
                index_path = load_path / f"shard_{i}.index"
                index = faiss.read_index(str(index_path))
                
                if config["use_gpu"]:
                    index = faiss.index_cpu_to_gpu(
                        faiss.StandardGpuResources(),
                        i % faiss.get_num_gpus(),
                        index
                    )
                
                # Load shard info
                info_path = load_path / f"shard_{i}.json"
                with open(info_path) as f:
                    info_dict = json.load(f)
                    info = ShardInfo(**info_dict)
                
                instance.shards[i] = {
                    "index": index,
                    "is_trained": True,
                    "info": info
                }
            
            logger.info(f"Loaded sharded index from {directory}")
            return instance
            
        except Exception as e:
            logger.error(f"Failed to load index: {str(e)}")
            raise IndexError(
                f"Index load failed: {str(e)}",
                operation="load",
                component="sharded_index"
            ) 