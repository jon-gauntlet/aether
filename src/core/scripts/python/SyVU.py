"""
Equilibrium Manager for maintaining system balance and information preservation.
"""

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Set, Any
import json
import sqlite3

from ..context.manager import ContextManager, Context, Pattern
from ..autonomic.manager import AutonomicManager

logger = logging.getLogger(__name__)

@dataclass
class EquilibriumState:
    """Current state of system equilibrium."""
    timestamp: datetime
    stability_score: float  # 0-1 measure of system stability
    entropy_level: float  # Measure of information disorder
    coherence_score: float  # Measure of information linkage quality
    integration_rate: float  # Rate of successful re-integration
    preservation_score: float  # Measure of information preservation

@dataclass
class EquilibriumMetrics:
    """Metrics for tracking equilibrium maintenance."""
    total_integrations: int = 0
    successful_integrations: int = 0
    preservation_failures: int = 0
    linkage_breaks: int = 0
    entropy_spikes: int = 0
    recovery_attempts: int = 0
    last_reset: datetime = field(default_factory=datetime.now)

@dataclass
class EquilibriumConfig:
    """Configuration for equilibrium management."""
    min_stability_threshold: float = 0.7
    max_entropy_threshold: float = 0.3
    min_coherence_threshold: float = 0.8
    min_integration_rate: float = 0.9
    min_preservation_score: float = 0.95
    check_interval: timedelta = timedelta(minutes=5)
    recovery_cooldown: timedelta = timedelta(hours=1)
    max_recovery_attempts: int = 3
    preservation_window: timedelta = timedelta(days=30)

class EquilibriumManager:
    """Manages system equilibrium and information preservation."""
    
    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or Path("/home/jon/ai_system_evolution/data/equilibrium")
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.state_file = self.data_dir / "equilibrium_state.json"
        self.metrics_file = self.data_dir / "equilibrium_metrics.db"
        
        self.config = EquilibriumConfig()
        self.metrics = EquilibriumMetrics()
        self.context_manager = ContextManager()
        self.autonomic_manager = AutonomicManager()
        
        self._init_db()
        
    def _init_db(self) -> None:
        """Initialize the SQLite database for metrics tracking."""
        with sqlite3.connect(self.metrics_file) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS equilibrium_states (
                    timestamp TIMESTAMP PRIMARY KEY,
                    stability_score REAL,
                    entropy_level REAL,
                    coherence_score REAL,
                    integration_rate REAL,
                    preservation_score REAL
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS information_links (
                    source_id TEXT,
                    target_id TEXT,
                    link_type TEXT,
                    strength REAL,
                    created_at TIMESTAMP,
                    last_verified TIMESTAMP,
                    metadata JSON,
                    PRIMARY KEY (source_id, target_id, link_type)
                )
            """)
            
    async def initialize(self) -> None:
        """Initialize the equilibrium manager."""
        await self.context_manager.initialize()
        await self.autonomic_manager.initialize()
        await self._load_state()
        logger.info("Equilibrium manager initialized")
        
    async def _load_state(self) -> None:
        """Load the last known equilibrium state."""
        if self.state_file.exists():
            try:
                with open(self.state_file, 'r') as f:
                    data = json.load(f)
                    self.metrics = EquilibriumMetrics(**data)
            except Exception as e:
                logger.error(f"Error loading equilibrium state: {e}")
                
    async def preserve_state(self) -> None:
        """Preserve current equilibrium state."""
        try:
            with open(self.state_file, 'w') as f:
                json.dump(self.metrics.__dict__, f)
        except Exception as e:
            logger.error(f"Error preserving equilibrium state: {e}")
            
    async def check_equilibrium(self) -> EquilibriumState:
        """Check current system equilibrium state."""
        stability = await self._calculate_stability()
        entropy = await self._calculate_entropy()
        coherence = await self._calculate_coherence()
        integration = await self._calculate_integration_rate()
        preservation = await self._calculate_preservation()
        
        state = EquilibriumState(
            timestamp=datetime.now(),
            stability_score=stability,
            entropy_level=entropy,
            coherence_score=coherence,
            integration_rate=integration,
            preservation_score=preservation
        )
        
        await self._store_state(state)
        return state
        
    async def _store_state(self, state: EquilibriumState) -> None:
        """Store equilibrium state measurement."""
        with sqlite3.connect(self.metrics_file) as conn:
            conn.execute(
                """
                INSERT INTO equilibrium_states
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    state.timestamp.isoformat(),
                    state.stability_score,
                    state.entropy_level,
                    state.coherence_score,
                    state.integration_rate,
                    state.preservation_score
                )
            )
            
    async def _calculate_stability(self) -> float:
        """Calculate system stability score."""
        # Get recent evolution metrics
        metrics = await self.autonomic_manager.get_evolution_status()
        patterns = await self.context_manager.get_patterns(
            pattern_type='stability',
            min_confidence=0.8
        )
        
        # Combine multiple stability indicators
        pattern_stability = sum(p.confidence for p in patterns) / max(1, len(patterns))
        evolution_stability = 1.0 - (metrics['changes_today'] / self.autonomic_manager.policy.max_daily_changes)
        
        return 0.7 * pattern_stability + 0.3 * evolution_stability
        
    async def _calculate_entropy(self) -> float:
        """Calculate information entropy level."""
        contexts = await self.context_manager.get_contexts(
            start_time=datetime.now() - self.config.preservation_window
        )
        
        if not contexts:
            return 0.0
            
        # Calculate entropy based on context organization
        total_links = await self._count_information_links()
        max_possible_links = len(contexts) * (len(contexts) - 1) / 2
        
        return 1.0 - (total_links / max_possible_links if max_possible_links > 0 else 0)
        
    async def _calculate_coherence(self) -> float:
        """Calculate information coherence score."""
        links = await self._get_information_links()
        if not links:
            return 0.0
            
        # Calculate average link strength
        total_strength = sum(link['strength'] for link in links)
        return total_strength / len(links)
        
    async def _calculate_integration_rate(self) -> float:
        """Calculate successful integration rate."""
        if self.metrics.total_integrations == 0:
            return 1.0
        return self.metrics.successful_integrations / self.metrics.total_integrations
        
    async def _calculate_preservation(self) -> float:
        """Calculate information preservation score."""
        total_contexts = len(await self.context_manager.get_contexts())
        if total_contexts == 0:
            return 1.0
            
        preservation_rate = 1.0 - (self.metrics.preservation_failures / total_contexts)
        return max(0.0, min(1.0, preservation_rate))
        
    async def create_information_link(
        self,
        source_id: str,
        target_id: str,
        link_type: str,
        strength: float,
        metadata: Optional[Dict] = None
    ) -> None:
        """Create a new information link."""
        with sqlite3.connect(self.metrics_file) as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO information_links
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    source_id,
                    target_id,
                    link_type,
                    strength,
                    datetime.now().isoformat(),
                    datetime.now().isoformat(),
                    json.dumps(metadata or {})
                )
            )
            
    async def verify_information_links(self) -> None:
        """Verify and update information links."""
        links = await self._get_information_links()
        for link in links:
            source = await self.context_manager.get_context(link['source_id'])
            target = await self.context_manager.get_context(link['target_id'])
            
            if source and target:
                # Verify link is still valid
                strength = await self._calculate_link_strength(source, target)
                if strength >= 0.5:  # Minimum threshold for valid link
                    await self._update_link_verification(
                        link['source_id'],
                        link['target_id'],
                        link['link_type'],
                        strength
                    )
                else:
                    await self._remove_information_link(
                        link['source_id'],
                        link['target_id'],
                        link['link_type']
                    )
                    self.metrics.linkage_breaks += 1
            else:
                # Remove link if either context is missing
                await self._remove_information_link(
                    link['source_id'],
                    link['target_id'],
                    link['link_type']
                )
                self.metrics.preservation_failures += 1
                
    async def _get_information_links(self) -> List[Dict]:
        """Get all information links."""
        with sqlite3.connect(self.metrics_file) as conn:
            cursor = conn.execute("SELECT * FROM information_links")
            return [
                {
                    'source_id': row[0],
                    'target_id': row[1],
                    'link_type': row[2],
                    'strength': row[3],
                    'created_at': datetime.fromisoformat(row[4]),
                    'last_verified': datetime.fromisoformat(row[5]),
                    'metadata': json.loads(row[6])
                }
                for row in cursor.fetchall()
            ]
            
    async def _count_information_links(self) -> int:
        """Count total number of valid information links."""
        with sqlite3.connect(self.metrics_file) as conn:
            cursor = conn.execute("SELECT COUNT(*) FROM information_links")
            return cursor.fetchone()[0]
            
    async def _calculate_link_strength(self, source: Context, target: Context) -> float:
        """Calculate strength of relationship between contexts."""
        # Compare context data for similarity
        common_keys = set(source.data.keys()) & set(target.data.keys())
        if not common_keys:
            return 0.0
            
        matches = sum(1 for k in common_keys if source.data[k] == target.data[k])
        return matches / len(common_keys)
        
    async def _update_link_verification(
        self,
        source_id: str,
        target_id: str,
        link_type: str,
        strength: float
    ) -> None:
        """Update link verification timestamp and strength."""
        with sqlite3.connect(self.metrics_file) as conn:
            conn.execute(
                """
                UPDATE information_links
                SET last_verified = ?, strength = ?
                WHERE source_id = ? AND target_id = ? AND link_type = ?
                """,
                (
                    datetime.now().isoformat(),
                    strength,
                    source_id,
                    target_id,
                    link_type
                )
            )
            
    async def _remove_information_link(
        self,
        source_id: str,
        target_id: str,
        link_type: str
    ) -> None:
        """Remove an information link."""
        with sqlite3.connect(self.metrics_file) as conn:
            conn.execute(
                """
                DELETE FROM information_links
                WHERE source_id = ? AND target_id = ? AND link_type = ?
                """,
                (source_id, target_id, link_type)
            )
            
    async def maintain_equilibrium(self) -> None:
        """Main equilibrium maintenance loop."""
        while True:
            try:
                state = await self.check_equilibrium()
                
                # Check if system needs rebalancing
                if (
                    state.stability_score < self.config.min_stability_threshold or
                    state.entropy_level > self.config.max_entropy_threshold or
                    state.coherence_score < self.config.min_coherence_threshold or
                    state.integration_rate < self.config.min_integration_rate or
                    state.preservation_score < self.config.min_preservation_score
                ):
                    await self._rebalance_system(state)
                    
                # Verify information links periodically
                await self.verify_information_links()
                
                # Preserve current state
                await self.preserve_state()
                
            except Exception as e:
                logger.error(f"Error in equilibrium maintenance: {e}")
                
            await asyncio.sleep(self.config.check_interval.total_seconds())
            
    async def _rebalance_system(self, state: EquilibriumState) -> None:
        """Attempt to rebalance system state."""
        if (
            self.metrics.recovery_attempts >= self.config.max_recovery_attempts or
            datetime.now() - self.metrics.last_reset < self.config.recovery_cooldown
        ):
            logger.warning("Recovery attempts exceeded or in cooldown")
            return
            
        logger.info("Initiating system rebalancing")
        self.metrics.recovery_attempts += 1
        
        try:
            # Reorganize information links
            if state.entropy_level > self.config.max_entropy_threshold:
                await self._reorganize_information()
                
            # Strengthen weak links
            if state.coherence_score < self.config.min_coherence_threshold:
                await self._strengthen_links()
                
            # Recover lost information
            if state.preservation_score < self.config.min_preservation_score:
                await self._recover_information()
                
            self.metrics.successful_integrations += 1
            
        except Exception as e:
            logger.error(f"Error during system rebalancing: {e}")
            self.metrics.entropy_spikes += 1
            
    async def _reorganize_information(self) -> None:
        """Reorganize information to reduce entropy."""
        contexts = await self.context_manager.get_contexts()
        for i, source in enumerate(contexts):
            for target in contexts[i+1:]:
                strength = await self._calculate_link_strength(source, target)
                if strength >= 0.7:  # High similarity threshold
                    await self.create_information_link(
                        source.id,
                        target.id,
                        'similarity',
                        strength,
                        {'auto_organized': True}
                    )
                    
    async def _strengthen_links(self) -> None:
        """Strengthen weak information links."""
        links = await self._get_information_links()
        weak_links = [l for l in links if 0.3 <= l['strength'] < 0.7]
        
        for link in weak_links:
            source = await self.context_manager.get_context(link['source_id'])
            target = await self.context_manager.get_context(link['target_id'])
            
            if source and target:
                # Try to find intermediate contexts that strengthen the link
                intermediates = await self._find_intermediate_contexts(source, target)
                if intermediates:
                    # Create reinforcing links
                    for intermediate in intermediates:
                        await self.create_information_link(
                            source.id,
                            intermediate.id,
                            'reinforcement',
                            0.8,
                            {'strengthening': True}
                        )
                        await self.create_information_link(
                            intermediate.id,
                            target.id,
                            'reinforcement',
                            0.8,
                            {'strengthening': True}
                        )
                        
    async def _find_intermediate_contexts(
        self,
        source: Context,
        target: Context
    ) -> List[Context]:
        """Find contexts that can serve as intermediate links."""
        all_contexts = await self.context_manager.get_contexts()
        intermediates = []
        
        for context in all_contexts:
            if context.id not in (source.id, target.id):
                source_strength = await self._calculate_link_strength(source, context)
                target_strength = await self._calculate_link_strength(context, target)
                
                if source_strength >= 0.6 and target_strength >= 0.6:
                    intermediates.append(context)
                    
        return intermediates
        
    async def _recover_information(self) -> None:
        """Attempt to recover lost information through pattern analysis."""
        patterns = await self.context_manager.get_patterns(min_confidence=0.9)
        
        for pattern in patterns:
            # Find missing contexts that should exist based on pattern
            existing_contexts = set()
            for context_id in pattern.contexts:
                context = await self.context_manager.get_context(context_id)
                if context:
                    existing_contexts.add(context)
                    
            if len(existing_contexts) >= 2:
                # Use pattern to reconstruct missing links
                for source in existing_contexts:
                    for target in existing_contexts:
                        if source.id < target.id:  # Avoid duplicate links
                            await self.create_information_link(
                                source.id,
                                target.id,
                                'pattern_recovery',
                                0.9,
                                {
                                    'pattern_id': pattern.id,
                                    'recovered': True
                                }
                            ) 