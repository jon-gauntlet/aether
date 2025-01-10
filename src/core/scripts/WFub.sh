#!/bin/bash

# Gauntlet Advanced Context
# Tracks advanced metrics like code quality, test coverage, and documentation

set -euo pipefail

METRICS_DIR="${HOME}/.gauntlet/metrics"
CONTEXT_DIR="${HOME}/.gauntlet/contexts"
ADVANCED_DIR="${HOME}/.gauntlet/advanced"
STATE_DIR="${HOME}/.gauntlet/state"

mkdir -p "$ADVANCED_DIR"/{quality,coverage,docs,deps}

analyze_code_quality() {
    local project_path="$1"
    local output_file="${ADVANCED_DIR}/quality/$(basename "$project_path")_quality.json"
    
    if [[ -d "$project_path" ]]; then
        cd "$project_path" || exit
        
        # Initialize metrics
        local metrics
        metrics=$(mktemp)
        
        # Analyze shell scripts
        if find . -type f -name "*.sh" | grep -q .; then
            shellcheck --format=json ./*.sh > "$metrics" 2>/dev/null || true
            
            # Process shellcheck output
            jq -n --slurpfile sc "$metrics" \
                '{
                    shell_scripts: {
                        files_analyzed: ($sc | length),
                        total_issues: ($sc | map(.comments | length) | add // 0),
                        severity_breakdown: ($sc | map(.comments[].level) | group_by(.) | map({key: .[0], count: length}) | from_entries)
                    }
                }' > "${output_file}.tmp"
        fi
        
        # Analyze Python files
        if find . -type f -name "*.py" | grep -q .; then
            pylint --output-format=json ./*.py > "$metrics" 2>/dev/null || true
            
            # Process pylint output
            jq -n --slurpfile py "$metrics" \
                '{
                    python_files: {
                        files_analyzed: ($py | length),
                        total_issues: ($py | map(.messages | length) | add // 0),
                        score: ($py | map(.score) | add / length // 0)
                    }
                }' > "${output_file}.tmp2" 2>/dev/null || echo "{}" > "${output_file}.tmp2"
        fi
        
        # Merge results
        jq -s '.[0] * .[1]' "${output_file}.tmp" "${output_file}.tmp2" > "$output_file" 2>/dev/null || echo "{}" > "$output_file"
        rm -f "${output_file}.tmp"* "$metrics"
    fi
}

analyze_test_coverage() {
    local project_path="$1"
    local output_file="${ADVANCED_DIR}/coverage/$(basename "$project_path")_coverage.json"
    
    if [[ -d "$project_path" ]]; then
        cd "$project_path" || exit
        
        # Initialize coverage data
        local coverage_data
        coverage_data=$(mktemp)
        
        # Python coverage
        if [[ -d "tests" ]] || find . -type f -name "test_*.py" | grep -q .; then
            coverage run -m pytest 2>/dev/null || true
            coverage json -o "$coverage_data" 2>/dev/null || true
            
            if [[ -f "$coverage_data" ]]; then
                jq '{
                    python_coverage: {
                        total_coverage: .totals.percent_covered,
                        files_tested: (.files | length),
                        lines_covered: .totals.covered_lines,
                        total_lines: .totals.num_statements
                    }
                }' "$coverage_data" > "$output_file"
            else
                echo "{}" > "$output_file"
            fi
        fi
        
        rm -f "$coverage_data" .coverage
    fi
}

analyze_documentation() {
    local project_path="$1"
    local output_file="${ADVANCED_DIR}/docs/$(basename "$project_path")_docs.json"
    
    if [[ -d "$project_path" ]]; then
        cd "$project_path" || exit
        
        # Count documentation files
        local readme_count
        readme_count=$(find . -type f -iname "README*" | wc -l)
        local doc_count
        doc_count=$(find . -type f -iname "*.md" -o -iname "*.rst" | wc -l)
        
        # Analyze documentation quality
        local total_words=0
        local files_with_examples=0
        local files_with_usage=0
        
        while IFS= read -r doc_file; do
            if [[ -f "$doc_file" ]]; then
                # Count words
                words=$(wc -w < "$doc_file")
                total_words=$((total_words + words))
                
                # Check for examples
                if grep -qi "example" "$doc_file" || grep -qi "usage" "$doc_file"; then
                    files_with_examples=$((files_with_examples + 1))
                fi
                
                # Check for usage instructions
                if grep -qi "how to" "$doc_file" || grep -qi "installation" "$doc_file"; then
                    files_with_usage=$((files_with_usage + 1))
                fi
            fi
        done < <(find . -type f \( -iname "*.md" -o -iname "*.rst" \))
        
        # Generate documentation report
        jq -n \
            --arg path "$project_path" \
            --argjson rc "$readme_count" \
            --argjson dc "$doc_count" \
            --argjson tw "$total_words" \
            --argjson fe "$files_with_examples" \
            --argjson fu "$files_with_usage" \
            '{
                project: $path,
                documentation: {
                    readme_files: $rc,
                    doc_files: $dc,
                    total_words: $tw,
                    files_with_examples: $fe,
                    files_with_usage: $fu,
                    doc_score: (($rc * 10 + $dc * 5 + $fe * 15 + $fu * 20) / 50.0)
                }
            }' > "$output_file"
    fi
}

analyze_dependencies() {
    local project_path="$1"
    local output_file="${ADVANCED_DIR}/deps/$(basename "$project_path")_deps.json"
    
    if [[ -d "$project_path" ]]; then
        cd "$project_path" || exit
        
        # Initialize dependency data
        local deps_data
        deps_data=$(mktemp)
        
        # Python dependencies
        if [[ -f "requirements.txt" ]]; then
            pip-audit -r requirements.txt -f json > "$deps_data" 2>/dev/null || true
            
            if [[ -f "$deps_data" ]]; then
                jq '{
                    python_dependencies: {
                        total_deps: (.dependencies | length),
                        vulnerabilities: (.dependencies | map(select(.vulnerabilities | length > 0)) | length),
                        outdated: (.dependencies | map(select(.version != .latest_version)) | length)
                    }
                }' "$deps_data" > "$output_file"
            else
                echo "{}" > "$output_file"
            fi
        fi
        
        # Shell script dependencies
        if find . -type f -name "*.sh" | grep -q .; then
            # Check for common utilities
            local shell_deps=()
            for util in awk sed grep jq curl wget git python3; do
                if grep -r "\\b${util}\\b" . >/dev/null 2>&1; then
                    shell_deps+=("$util")
                fi
            done
            
            # Add shell dependencies to output
            if [[ -f "$output_file" ]]; then
                jq --arg deps "${shell_deps[*]}" \
                    '. + {shell_dependencies: {required_utils: ($deps | split(" "))}}' "$output_file" > "${output_file}.tmp" \
                    && mv "${output_file}.tmp" "$output_file"
            else
                jq -n --arg deps "${shell_deps[*]}" \
                    '{shell_dependencies: {required_utils: ($deps | split(" "))}}' > "$output_file"
            fi
        fi
        
        rm -f "$deps_data"
    fi
}

generate_advanced_context() {
    local project_path="$1"
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local context_file="${ADVANCED_DIR}/context_${timestamp}.json"
    
    # Combine all advanced metrics
    jq -s '.[0] * .[1] * .[2] * .[3]' \
        "${ADVANCED_DIR}/quality/$(basename "$project_path")_quality.json" \
        "${ADVANCED_DIR}/coverage/$(basename "$project_path")_coverage.json" \
        "${ADVANCED_DIR}/docs/$(basename "$project_path")_docs.json" \
        "${ADVANCED_DIR}/deps/$(basename "$project_path")_deps.json" \
        > "$context_file"
    
    # Update state file with latest context
    echo "$context_file" > "${STATE_DIR}/latest_advanced_context"
}

# Main loop
while true; do
    # Monitor for active projects
    while IFS= read -r context_file; do
        if [[ -f "$context_file" ]]; then
            project_path=$(jq -r '.project_path' "$context_file")
            
            if [[ -d "$project_path" ]]; then
                # Run advanced analysis
                analyze_code_quality "$project_path"
                analyze_test_coverage "$project_path"
                analyze_documentation "$project_path"
                analyze_dependencies "$project_path"
                
                # Generate combined context
                generate_advanced_context "$project_path"
            fi
        fi
    done < <(find "$CONTEXT_DIR" -type f -name "session_*.json" -mmin -5)
    
    sleep 300  # Run every 5 minutes
done 