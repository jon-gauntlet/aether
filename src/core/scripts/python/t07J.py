import pytest
import asyncio
from datetime import datetime
import uuid
from typing import List

from lib.context.learner import Pattern
from lib.context.synthesizer import PatternSynthesizer

@pytest.fixture
def code_patterns() -> List[Pattern]:
    """Generate test code patterns."""
    return [
        Pattern(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            pattern_type='code',
            data={
                'complexity': 0.5,
                'dependencies': ['numpy', 'pandas'],
                'tests': ['test_1', 'test_2'],
                'coverage': 0.8
            },
            confidence=0.9,
            source_contexts=['ctx1', 'ctx2']
        ),
        Pattern(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            pattern_type='code',
            data={
                'complexity': 0.6,
                'dependencies': ['numpy', 'sklearn'],
                'tests': ['test_1', 'test_3'],
                'coverage': 0.7
            },
            confidence=0.8,
            source_contexts=['ctx2', 'ctx3']
        ),
        Pattern(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            pattern_type='code',
            data={
                'complexity': 0.4,
                'dependencies': ['pandas', 'sklearn'],
                'tests': ['test_2', 'test_3'],
                'coverage': 0.9
            },
            confidence=0.85,
            source_contexts=['ctx1', 'ctx3']
        )
    ]

@pytest.fixture
def workflow_patterns() -> List[Pattern]:
    """Generate test workflow patterns."""
    return [
        Pattern(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            pattern_type='workflow',
            data={
                'steps': ['step1', 'step2', 'step3'],
                'success_rate': 0.9,
                'completion_time': 120
            },
            confidence=0.8,
            source_contexts=['ctx1', 'ctx2']
        ),
        Pattern(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            pattern_type='workflow',
            data={
                'steps': ['step1', 'step2', 'step4'],
                'success_rate': 0.85,
                'completion_time': 150
            },
            confidence=0.75,
            source_contexts=['ctx2', 'ctx3']
        ),
        Pattern(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            pattern_type='workflow',
            data={
                'steps': ['step1', 'step3', 'step4'],
                'success_rate': 0.95,
                'completion_time': 90
            },
            confidence=0.9,
            source_contexts=['ctx1', 'ctx3']
        )
    ]

@pytest.fixture
def integration_patterns() -> List[Pattern]:
    """Generate test integration patterns."""
    return [
        Pattern(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            pattern_type='integration',
            data={
                'dependencies': ['service1', 'service2'],
                'success_rate': 0.95,
                'stability': 0.9
            },
            confidence=0.85,
            source_contexts=['ctx1', 'ctx2']
        ),
        Pattern(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            pattern_type='integration',
            data={
                'dependencies': ['service1', 'service3'],
                'success_rate': 0.9,
                'stability': 0.85
            },
            confidence=0.8,
            source_contexts=['ctx2', 'ctx3']
        ),
        Pattern(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            pattern_type='integration',
            data={
                'dependencies': ['service2', 'service3'],
                'success_rate': 0.85,
                'stability': 0.95
            },
            confidence=0.9,
            source_contexts=['ctx1', 'ctx3']
        )
    ]

@pytest.mark.asyncio
async def test_pattern_synthesis(code_patterns, workflow_patterns, integration_patterns):
    """Test pattern synthesis functionality."""
    synthesizer = PatternSynthesizer()
    
    # Test code pattern synthesis
    code_synthesized = await synthesizer.synthesize(code_patterns)
    assert len(code_synthesized) > 0
    assert code_synthesized[0].pattern_type == 'code'
    assert code_synthesized[0].metadata['synthesized']
    assert len(code_synthesized[0].source_contexts) >= 2
    
    # Test workflow pattern synthesis
    workflow_synthesized = await synthesizer.synthesize(workflow_patterns)
    assert len(workflow_synthesized) > 0
    assert workflow_synthesized[0].pattern_type == 'workflow'
    assert workflow_synthesized[0].metadata['synthesized']
    assert len(workflow_synthesized[0].source_contexts) >= 2
    
    # Test integration pattern synthesis
    integration_synthesized = await synthesizer.synthesize(integration_patterns)
    assert len(integration_synthesized) > 0
    assert integration_synthesized[0].pattern_type == 'integration'
    assert integration_synthesized[0].metadata['synthesized']
    assert len(integration_synthesized[0].source_contexts) >= 2

@pytest.mark.asyncio
async def test_synthesis_impact_analysis(code_patterns):
    """Test synthesis impact analysis."""
    synthesizer = PatternSynthesizer()
    
    # Synthesize patterns
    synthesized = await synthesizer.synthesize(code_patterns)
    
    # Analyze impact
    impact = await synthesizer.analyze_synthesis_impact(code_patterns, synthesized)
    
    # Verify metrics
    assert 'original_count' in impact
    assert 'synthesized_count' in impact
    assert 'compression_ratio' in impact
    assert 'average_confidence' in impact
    assert 'pattern_types' in impact
    assert 'complexity' in impact
    
    assert impact['original_count'] == len(code_patterns)
    assert impact['synthesized_count'] == len(synthesized)
    assert 0 < impact['compression_ratio'] <= 1
    assert 'original' in impact['average_confidence']
    assert 'synthesized' in impact['average_confidence']

@pytest.mark.asyncio
async def test_pattern_clustering(code_patterns):
    """Test pattern clustering functionality."""
    synthesizer = PatternSynthesizer()
    
    # Get clusters
    clusters = await synthesizer._cluster_patterns(code_patterns)
    
    # Verify clustering
    assert len(clusters) > 0
    for cluster in clusters:
        assert len(cluster) >= synthesizer.config.clustering_min_samples
        assert all(p.pattern_type == 'code' for p in cluster)

@pytest.mark.asyncio
async def test_feature_extraction(code_patterns):
    """Test pattern feature extraction."""
    synthesizer = PatternSynthesizer()
    
    # Extract features
    features = synthesizer._extract_features(code_patterns[0])
    
    # Verify features
    assert features is not None
    assert len(features) > 0
    assert all(isinstance(f, (int, float)) for f in features)

@pytest.mark.asyncio
async def test_pattern_merging(code_patterns):
    """Test pattern data merging."""
    synthesizer = PatternSynthesizer()
    
    # Merge patterns
    cluster = await synthesizer._synthesize_cluster(code_patterns)
    
    # Verify merged pattern
    assert cluster is not None
    assert cluster.pattern_type == 'code'
    assert cluster.confidence >= synthesizer.config.min_confidence
    assert len(cluster.source_contexts) >= len(code_patterns[0].source_contexts)
    assert 'synthesized' in cluster.metadata
    assert cluster.metadata['synthesized']

@pytest.mark.asyncio
async def test_complexity_calculation(code_patterns, workflow_patterns, integration_patterns):
    """Test pattern complexity calculation."""
    synthesizer = PatternSynthesizer()
    
    # Calculate complexities
    code_complexity = synthesizer._calculate_complexity(code_patterns)
    workflow_complexity = synthesizer._calculate_complexity(workflow_patterns)
    integration_complexity = synthesizer._calculate_complexity(integration_patterns)
    
    # Verify complexities
    assert 0 <= code_complexity <= 1
    assert 0 <= workflow_complexity <= 1
    assert 0 <= integration_complexity <= 1 