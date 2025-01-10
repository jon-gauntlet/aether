#!/bin/bash

BOOK_PATH="/home/jon/Documents/PDFs/Data Structures and Algorithms in Python.pdf"
OUTPUT_DIR="/home/jon/git/python-dsa/resources/book_excerpts"

extract_topic() {
    local topic="$1"
    local start_page="$2"
    local end_page="$3"
    local output_file="$OUTPUT_DIR/${topic// /_}.txt"
    
    echo "Extracting $topic (pages $start_page-$end_page)..."
    pdftotext -f "$start_page" -l "$end_page" "$BOOK_PATH" "$output_file"
    
    # Add header
    sed -i "1i\\# $topic (Pages $start_page-$end_page)\n\nExtracted from 'Data Structures and Algorithms in Python'\n\n" "$output_file"
    
    echo "✓ Saved to $output_file"
}

# Create output directory
mkdir -p "$OUTPUT_DIR"

case "$1" in
    "arrays")
        extract_topic "Array-Based Sequences" 180 220
        ;;
    "linked-lists")
        extract_topic "Linked Lists" 240 280
        ;;
    "recursion")
        extract_topic "Recursion" 150 179
        ;;
    "analysis")
        extract_topic "Algorithm Analysis" 120 149
        ;;
    "all")
        # Extract all major topics
        extract_topic "Python Primer" 1 60
        extract_topic "Object-Oriented Programming" 61 119
        extract_topic "Algorithm Analysis" 120 149
        extract_topic "Recursion" 150 179
        extract_topic "Array-Based Sequences" 180 220
        extract_topic "Stacks Queues and Deques" 221 239
        extract_topic "Linked Lists" 240 280
        extract_topic "Trees" 281 320
        extract_topic "Priority Queues" 321 360
        extract_topic "Maps and Hash Tables" 361 400
        extract_topic "Search Trees" 401 440
        extract_topic "Sorting and Selection" 441 480
        extract_topic "Text Processing" 481 520
        extract_topic "Graph Algorithms" 521 560
        ;;
    *)
        echo "Usage: $0 [topic]"
        echo "Available topics:"
        echo "  - arrays"
        echo "  - linked-lists"
        echo "  - recursion"
        echo "  - analysis"
        echo "  - all"
        ;;
esac 