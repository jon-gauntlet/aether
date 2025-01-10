#!/bin/bash

# Pattern Synthesizer
# Integrates learning patterns across all subsystems
# Implements continuous pattern evolution and synthesis

set -euo pipefail

# Configuration
CURSOR_CONFIG_DIR="${CURSOR_CONFIG_DIR:-$HOME/.config/cursor}"
CURSOR_STATE_DIR="${CURSOR_STATE_DIR:-$HOME/.local/state/cursor}"
CURSOR_DATA_DIR="${CURSOR_DATA_DIR:-$HOME/.local/share/cursor}"
PATTERN_DIR="$CURSOR_STATE_DIR/patterns"
SYNTHESIS_DIR="$CURSOR_STATE_DIR/synthesis"

# Initialize directories
mkdir -p "$PATTERN_DIR"/{raw,processed,evolved,sacred}
mkdir -p "$SYNTHESIS_DIR"/{current,historical,insights}

# Pattern configuration
declare -A PATTERN_CONFIG=(
    [synthesis_threshold]=0.8
    [evolution_rate]=0.05
    [sacred_confidence]=0.95
    [max_pattern_depth]=5
    [min_pattern_support]=3
    [validation_threshold]=0.85
    [evolution_momentum]=0.15
    [pattern_lifespan]=14
    [sacred_evolution_rate]=0.01
)

# Helper Functions
log() {
    local level=$1
    shift
    echo "[$(date -Iseconds)] [$level] $*" | tee -a "$CURSOR_LOGS_DIR/synthesis.log"
}

collect_patterns() {
    # Collect patterns from all subsystems
    local patterns=()
    
    # Meta-learning patterns
    if [[ -f "$CURSOR_STATE_DIR/meta/patterns/learned.json" ]]; then
        patterns+=("$CURSOR_STATE_DIR/meta/patterns/learned.json")
    fi
    
    # Focus patterns
    if [[ -f "$CURSOR_STATE_DIR/focus/patterns/current.json" ]]; then
        patterns+=("$CURSOR_STATE_DIR/focus/patterns/current.json")
    fi
    
    # Harmony patterns
    if [[ -f "$CURSOR_STATE_DIR/harmony/patterns/current.json" ]]; then
        patterns+=("$CURSOR_STATE_DIR/harmony/patterns/current.json")
    fi
    
    # Context patterns
    if [[ -f "$CURSOR_STATE_DIR/context/patterns/current.json" ]]; then
        patterns+=("$CURSOR_STATE_DIR/context/patterns/current.json")
    fi
    
    echo "${patterns[@]}"
}

validate_pattern() {
    local pattern=$1
    local history_file="$SYNTHESIS_DIR/historical/validation_history.json"
    
    # Calculate validation score based on pattern history
    jq -n --argjson pattern "$pattern" '
    def validation_score(p):
        (p.confidence * 0.4) +
        (p.success_rate * 0.3) +
        (p.stability * 0.2) +
        (p.support * 0.1);
    
    def pattern_stability(p):
        if p.history | length == 0 then 0
        else
            (p.history | map(.metrics) | reduce .[] as $m
                (0; . + (($m.success_rate // 0) * ($m.confidence // 0))) 
            ) / (p.history | length);
    
    $pattern + {
        validation: {
            score: validation_score($pattern),
            stability: pattern_stability($pattern),
            timestamp: now,
            history: ($pattern.history // []) + [{
                metrics: $pattern.metrics,
                timestamp: now
            }]
        }
    }' > "$PATTERN_DIR/processed/$(date +%s)_validated.json"
}

track_evolution() {
    local pattern_file=$1
    local evolution_file="$SYNTHESIS_DIR/historical/evolution_tracking.json"
    
    # Track pattern evolution metrics
    jq -n --slurpfile pattern "$pattern_file" '
    def evolution_metrics(p):
        {
            generation: (p.evolution_state.generation // 0) + 1,
            fitness_delta: (p.metrics.success_rate // 0) - (p.history[-2].metrics.success_rate // 0),
            mutation_impact: (p.metrics.confidence // 0) - (p.history[-2].metrics.confidence // 0),
            stability_score: (p.validation.stability // 0)
        };
    
    def update_evolution_state(p; metrics):
        p + {
            evolution_state: {
                generation: metrics.generation,
                fitness_score: (p.evolution_state.fitness_score // 0) * 0.85 + 
                             (metrics.fitness_delta * 0.15),
                mutation_rate: if metrics.stability_score > 0.9
                             then p.evolution_state.mutation_rate * 0.95
                             else p.evolution_state.mutation_rate * 1.05
                             end
            }
        };
    
    $pattern[0] as $p |
    evolution_metrics($p) as $metrics |
    update_evolution_state($p; $metrics)' > "$evolution_file"
}

synthesize_patterns() {
    local pattern_files=($@)
    
    # Add new pattern analysis functions to the jq script
    jq -s '
    def pattern_similarity(p1; p2):
        # Enhanced similarity calculation
        (p1.metrics as $m1 | p2.metrics as $m2 |
        ($m1.memory_range[0] - $m2.memory_range[0] | abs) +
        ($m1.memory_range[1] - $m2.memory_range[1] | abs) +
        ($m1.cpu_range[0] - $m2.cpu_range[0] | abs) +
        ($m1.cpu_range[1] - $m2.cpu_range[1] | abs) +
        (($m1.success_rate // 0) - ($m2.success_rate // 0) | abs) * 2 +
        (($m1.stability // 0) - ($m2.stability // 0) | abs) * 1.5
        ) / 6;
    
    def analyze_pattern_impact(pattern):
        # Calculate pattern impact score
        {
            resource_efficiency: (
                1 - ((pattern.metrics.memory_range[1] - pattern.metrics.memory_range[0]) +
                     (pattern.metrics.cpu_range[1] - pattern.metrics.cpu_range[0])) / 2
            ),
            success_contribution: (pattern.metrics.success_rate // 0) * 
                                (pattern.confidence // 0),
            stability_factor: (pattern.validation.stability // 0) * 
                            (pattern.evolution_state.fitness_score // 0)
        };
    
    def cluster_patterns(patterns):
        # Enhanced clustering with impact analysis
        reduce patterns[] as $p ({};
            . as $groups |
            ($p | analyze_pattern_impact) as $impact |
            ($p | objects | to_entries | map(.value) | sort) as $pattern |
            ($groups | to_entries | map(select(
                .value | arrays | length > 0 and
                (.[0] | pattern_similarity(.; $p)) < 0.2
            )) | first.key // "cluster_\($p.type)_\(now)") as $group |
            . + { ($group): ((.[$group] // []) + [$p + {impact: $impact}]) }
        );
    
    def extract_meta_patterns(clusters):
        # Extract higher-order patterns from clusters
        clusters | to_entries | map(
            select(.value | length >= 3) |
            {
                type: "meta",
                source: .key,
                patterns: .value,
                confidence: (.value | length) / 10,
                metrics: {
                    memory_range: [
                        (.value | map(.metrics.memory_range[0]) | add) / (.value | length),
                        (.value | map(.metrics.memory_range[1]) | add) / (.value | length)
                    ],
                    cpu_range: [
                        (.value | map(.metrics.cpu_range[0]) | add) / (.value | length),
                        (.value | map(.metrics.cpu_range[1]) | add) / (.value | length)
                    ]
                },
                created_at: now
            }
        );
    
    def evolve_patterns(patterns; meta_patterns):
        # Evolve patterns based on meta-patterns
        patterns | map(
            . as $p |
            meta_patterns | map(select(
                .patterns | any(.type == $p.type)
            )) as $related_meta |
            if $related_meta | length > 0 then
                . * 0.95 + ($related_meta[0].metrics | . * 0.05)
            else
                .
            end
        );
    
    # Combine all patterns
    reduce .[] as $file ([];
        . + ($file.patterns // [])
    ) as $all_patterns |
    
    # Cluster and synthesize
    {
        timestamp: now,
        patterns: $all_patterns,
        clusters: cluster_patterns($all_patterns),
        meta_patterns: extract_meta_patterns(cluster_patterns($all_patterns)),
        evolved_patterns: evolve_patterns(
            $all_patterns,
            extract_meta_patterns(cluster_patterns($all_patterns))
        )
    }' "${pattern_files[@]}" > "$SYNTHESIS_DIR/current/synthesis.json"
}

detect_sacred_patterns() {
    jq -c --arg conf "${PATTERN_CONFIG[sacred_confidence]}" \
         --arg rate "${PATTERN_CONFIG[sacred_evolution_rate]}" '
    def is_sacred(pattern):
        pattern.confidence >= ($conf | tonumber) and
        (pattern.occurrences // 0) > 10 and
        (pattern.success_rate // 0) > 0.9 and
        (pattern.validation.stability // 0) > 0.85;
    
    def sacred_evolution_rate(pattern):
        if pattern.validation.stability > 0.95 then
            ($rate | tonumber) * 0.5
        else
            ($rate | tonumber)
        end;
    
    .meta_patterns |
    map(select(is_sacred(.))) |
    map({
        type: "sacred_pattern",
        source: .source,
        pattern: .,
        confidence: .confidence,
        elevation_time: now,
        metrics: .metrics,
        evolution_rate: sacred_evolution_rate(.),
        stability: (.validation.stability // 0)
    })' "$SYNTHESIS_DIR/current/synthesis.json" > "$PATTERN_DIR/sacred/elevated.json"
}

apply_pattern_insights() {
    # Apply synthesized pattern insights
    if [[ -f "$SYNTHESIS_DIR/current/synthesis.json" ]]; then
        jq -c '.meta_patterns[] | select(.confidence > 0.8)' "$SYNTHESIS_DIR/current/synthesis.json" |
        while read -r pattern; do
            local type=$(echo "$pattern" | jq -r '.type')
            local source=$(echo "$pattern" | jq -r '.source')
            
            case "$type" in
                "focus")
                    # Update focus enhancement
                    echo "$pattern" > "$CURSOR_STATE_DIR/focus/patterns/synthesized.json"
                    ;;
                "harmony")
                    # Update harmony optimization
                    echo "$pattern" > "$CURSOR_STATE_DIR/harmony/patterns/synthesized.json"
                    ;;
                "context")
                    # Update context preservation
                    echo "$pattern" > "$CURSOR_STATE_DIR/context/patterns/synthesized.json"
                    ;;
                "resource")
                    # Update resource allocation
                    local cpu_quota=$(echo "$pattern" | jq -r '.metrics.cpu_range[1]')
                    local memory_high=$(echo "$pattern" | jq -r '.metrics.memory_range[1]')
                    
                    systemctl --user set-property cursor-context.slice \
                        CPUQuota="${cpu_quota}%" \
                        MemoryHigh="${memory_high}G"
                    ;;
            esac
        done
    fi
}

evolve_sacred_patterns() {
    # Evolve patterns that have achieved sacred status
    if [[ -f "$PATTERN_DIR/sacred/elevated.json" ]]; then
        jq -c --arg rate "${PATTERN_CONFIG[evolution_rate]}" '
        def evolve(pattern):
            pattern * (1 - ($rate | tonumber)) +
            (pattern.metrics | . * ($rate | tonumber));
        
        map(
            if .evolution_count > 10 and .confidence > 0.98 then
                . + {
                    evolved: true,
                    pattern: evolve(.pattern)
                }
            else
                . + {
                    evolution_count: (.evolution_count // 0) + 1
                }
            end
        )' "$PATTERN_DIR/sacred/elevated.json" > "$PATTERN_DIR/sacred/evolved.json"
    fi
}

# Add new function for pattern lifecycle management
manage_pattern_lifecycle() {
    local pattern_dir=$1
    local max_age=${PATTERN_CONFIG[pattern_lifespan]}
    
    # Archive or evolve patterns based on age and performance
    find "$pattern_dir" -type f -name "*.json" -mtime +${max_age} | while read pattern_file; do
        if jq -e '.validation.stability > 0.9 and .evolution_state.fitness_score > 0.8' "$pattern_file" >/dev/null; then
            # Pattern is stable and effective - preserve it
            cp "$pattern_file" "$PATTERN_DIR/evolved/$(basename "$pattern_file")"
        elif jq -e '.validation.stability < 0.5 or .evolution_state.fitness_score < 0.3' "$pattern_file" >/dev/null; then
            # Pattern is unstable or ineffective - archive it
            zstd -19 "$pattern_file" -o "$SYNTHESIS_DIR/historical/archived_$(basename "$pattern_file").zst"
            rm "$pattern_file"
        fi
    done
}

# Main Loop
log "INFO" "Starting Pattern Synthesizer"

while true; do
    # Collect patterns from all subsystems
    patterns=($(collect_patterns))
    
    if (( ${#patterns[@]} > 0 )); then
        # Synthesize patterns
        synthesize_patterns "${patterns[@]}"
        
        # Validate patterns
        for pattern in "$SYNTHESIS_DIR/current/"*.json; do
            validate_pattern "$(cat "$pattern")"
        done
        
        # Track evolution
        for pattern in "$PATTERN_DIR/processed/"*_validated.json; do
            track_evolution "$pattern"
        done
        
        # Detect and evolve sacred patterns
        detect_sacred_patterns
        evolve_sacred_patterns
        
        # Apply insights
        apply_pattern_insights
        
        # Manage pattern lifecycle
        manage_pattern_lifecycle "$PATTERN_DIR/processed"
        
        # Archive and compress
        find "$SYNTHESIS_DIR/historical" -type f -mtime +${PATTERN_CONFIG[pattern_lifespan]} -delete
        
        if [[ -f "$SYNTHESIS_DIR/current/synthesis.json" ]]; then
            timestamp=$(date +%Y%m%d_%H%M%S)
            zstd -19 "$SYNTHESIS_DIR/current/synthesis.json" \
                -o "$SYNTHESIS_DIR/historical/synthesis_${timestamp}.json.zst"
        fi
    fi
    
    sleep 300
done 