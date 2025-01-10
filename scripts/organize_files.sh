#!/bin/bash

# Create necessary directories
mkdir -p src/core/config/shell
mkdir -p src/core/config/cursor
mkdir -p src/core/config/tailwind
mkdir -p src/core/config/typescript
mkdir -p src/core/config/router
mkdir -p src/core/config/context
mkdir -p src/core/scripts
mkdir -p src/core/types/system
mkdir -p src/core/types/flow
mkdir -p src/core/types/energy
mkdir -p src/core/types/space
mkdir -p src/core/types/protection
mkdir -p src/core/types/consciousness
mkdir -p src/core/types/validation
mkdir -p src/core/types/utils/space
mkdir -p src/core/types/utils/flow
mkdir -p src/core/types/utils/energy
mkdir -p src/core/types/utils/protection
mkdir -p src/core/types/utils/consciousness
mkdir -p src/core/types/utils/ai
mkdir -p src/core/types/utils/feedback
mkdir -p src/core/types/utils/test

# Function to check file type
get_file_type() {
    local file="$1"
    
    # Check if it's a shell script
    if head -n1 "$file" | grep -q '^#!'; then
        echo "shell"
        return
    fi
    
    # Check if it's a shell config file
    if head -n5 "$file" | grep -q 'ZSH="\$HOME'; then
        echo "shell_config"
        return
    fi
    
    # Check if it's a cursor config file
    if head -n5 "$file" | grep -q '# ChatGenius Project'; then
        echo "cursor_config"
        return
    fi
    
    # Check if it's a Tailwind config file
    if head -n5 "$file" | grep -q 'import.*tailwindcss'; then
        echo "tailwind_config"
        return
    fi
    
    # Check if it's a TypeScript config file
    if head -n5 "$file" | grep -q 'tsconfig' || head -n5 "$file" | grep -q 'compilerOptions'; then
        echo "typescript_config"
        return
    fi
    
    # Check if it's a barrel file
    if head -n5 "$file" | grep -q '^export.*{.*}.*from' || head -n5 "$file" | grep -q '^export.*\*.*from'; then
        echo "barrel"
        return
    fi
    
    # Check if it's a TypeScript file
    if [[ "$file" == *.ts ]]; then
        echo "typescript"
        return
    fi
    
    echo "unknown"
}

# Function to get TypeScript module type
get_ts_module() {
    local file="$1"
    
    # Check for router configuration
    if grep -q "router.*({" "$file" || grep -q "type.*Router" "$file"; then
        echo "router_config"
        return
    fi
    
    # Check for context configuration
    if grep -q "createContext" "$file" || grep -q "type.*Context" "$file"; then
        echo "context_config"
        return
    fi
    
    # Check for test types and utilities
    if grep -q "jest" "$file" || grep -q "test" "$file" || grep -q "describe" "$file" || grep -q "it(" "$file" || grep -q "expect" "$file"; then
        echo "test_utils"
        return
    fi
    
    # Check for pattern types
    if grep -q "interface.*Pattern" "$file" || grep -q "type.*Pattern" "$file" || grep -q "enum.*Pattern" "$file"; then
        echo "patterns"
        return
    fi
    
    # Check for validation utilities
    if grep -q "validate.*\(.*\): boolean" "$file"; then
        echo "validation"
        return
    fi
    
    # Check for AI utilities
    if grep -q "import.*OpenAI" "$file" || grep -q "openai" "$file"; then
        echo "ai_utils"
        return
    fi
    
    # Check for feedback utilities
    if grep -q "type.*Feedback" "$file" || grep -q "function.*Feedback" "$file"; then
        echo "feedback_utils"
        return
    fi
    
    # Check for space utilities
    if grep -q "import.*Space" "$file" || grep -q "export.*space" "$file"; then
        if ! grep -q "class.*System" "$file" && ! grep -q "interface.*Space" "$file"; then
            echo "space_utils"
            return
        fi
    fi
    
    # Check for flow utilities
    if grep -q "import.*Flow" "$file" || grep -q "export.*flow" "$file"; then
        if ! grep -q "class.*System" "$file" && ! grep -q "interface.*Flow" "$file"; then
            echo "flow_utils"
            return
        fi
    fi
    
    # Check for energy utilities
    if grep -q "import.*Energy" "$file" || grep -q "export.*energy" "$file"; then
        if ! grep -q "class.*System" "$file" && ! grep -q "interface.*Energy" "$file"; then
            echo "energy_utils"
            return
        fi
    fi
    
    # Check for protection utilities
    if grep -q "import.*Protection" "$file" || grep -q "export.*protection" "$file"; then
        if ! grep -q "class.*System" "$file" && ! grep -q "interface.*Protection" "$file"; then
            echo "protection_utils"
            return
        fi
    fi
    
    # Check for consciousness utilities
    if grep -q "import.*Consciousness" "$file" || grep -q "export.*consciousness" "$file"; then
        if ! grep -q "class.*System" "$file" && ! grep -q "interface.*Consciousness" "$file"; then
            echo "consciousness_utils"
            return
        fi
    fi
    
    # Check for general utilities
    if grep -q "export const.*=.*=>" "$file" || grep -q "export function" "$file"; then
        if ! grep -q "class.*System" "$file" && ! grep -q "interface.*[A-Z]" "$file"; then
            echo "utils"
            return
        fi
    fi
    
    # Check for system classes
    if grep -q "class.*System" "$file"; then
        echo "system"
        return
    fi
    
    # Check for type interfaces
    if grep -q "interface.*Flow" "$file" || grep -q "type.*Flow" "$file"; then
        echo "flow"
    elif grep -q "interface.*Energy" "$file" || grep -q "type.*Energy" "$file"; then
        echo "energy"
    elif grep -q "interface.*Space" "$file" || grep -q "type.*Space" "$file"; then
        echo "space"
    elif grep -q "interface.*Protection" "$file" || grep -q "type.*Protection" "$file"; then
        echo "protection"
    elif grep -q "interface.*Consciousness" "$file" || grep -q "type.*Consciousness" "$file"; then
        echo "consciousness"
    else
        echo "base"
    fi
}

# Function to get barrel module type
get_barrel_module() {
    local file="$1"
    
    if grep -q "autonomic" "$file"; then
        echo "autonomic"
    elif grep -q "flow" "$file"; then
        echo "flow"
    elif grep -q "energy" "$file"; then
        echo "energy"
    elif grep -q "space" "$file"; then
        echo "space"
    elif grep -q "protection" "$file"; then
        echo "protection"
    elif grep -q "consciousness" "$file"; then
        echo "consciousness"
    else
        echo "base"
    fi
}

# Process each file
for file in src/core/types/*; do
    if [ -f "$file" ]; then
        file_type=$(get_file_type "$file")
        base_name=$(basename "$file")
        
        case "$file_type" in
            "shell")
                mv "$file" "src/core/scripts/$base_name.sh"
                chmod +x "src/core/scripts/$base_name.sh"
                echo "Moved shell script: $base_name"
                ;;
            "shell_config")
                mv "$file" "src/core/config/shell/$base_name.zsh"
                echo "Moved shell config: $base_name"
                ;;
            "cursor_config")
                mv "$file" "src/core/config/cursor/$base_name.conf"
                echo "Moved cursor config: $base_name"
                ;;
            "tailwind_config")
                mv "$file" "src/core/config/tailwind/$base_name.js"
                echo "Moved Tailwind config: $base_name"
                ;;
            "typescript_config")
                mv "$file" "src/core/config/typescript/$base_name.json"
                echo "Moved TypeScript config: $base_name"
                ;;
            "barrel")
                module_type=$(get_barrel_module "$file")
                case "$module_type" in
                    "autonomic")
                        mv "$file" "src/core/types/autonomic/index.ts"
                        ;;
                    "flow")
                        mv "$file" "src/core/types/flow/index.ts"
                        ;;
                    "energy")
                        mv "$file" "src/core/types/energy/index.ts"
                        ;;
                    "space")
                        mv "$file" "src/core/types/space/index.ts"
                        ;;
                    "protection")
                        mv "$file" "src/core/types/protection/index.ts"
                        ;;
                    "consciousness")
                        mv "$file" "src/core/types/consciousness/index.ts"
                        ;;
                    *)
                        mv "$file" "src/core/types/index.ts"
                        ;;
                esac
                echo "Moved barrel file: $base_name"
                ;;
            "typescript")
                module_type=$(get_ts_module "$file")
                case "$module_type" in
                    "router_config")
                        mv "$file" "src/core/config/router/$base_name"
                        ;;
                    "context_config")
                        mv "$file" "src/core/config/context/$base_name"
                        ;;
                    "validation")
                        mv "$file" "src/core/types/validation/$base_name"
                        ;;
                    "ai_utils")
                        mv "$file" "src/core/types/utils/ai/$base_name"
                        ;;
                    "feedback_utils")
                        mv "$file" "src/core/types/utils/feedback/$base_name"
                        ;;
                    "test_utils")
                        mv "$file" "src/core/types/utils/test/$base_name"
                        ;;
                    "space_utils")
                        mv "$file" "src/core/types/utils/space/$base_name"
                        ;;
                    "flow_utils")
                        mv "$file" "src/core/types/utils/flow/$base_name"
                        ;;
                    "energy_utils")
                        mv "$file" "src/core/types/utils/energy/$base_name"
                        ;;
                    "protection_utils")
                        mv "$file" "src/core/types/utils/protection/$base_name"
                        ;;
                    "consciousness_utils")
                        mv "$file" "src/core/types/utils/consciousness/$base_name"
                        ;;
                    "utils")
                        mv "$file" "src/core/types/utils/$base_name"
                        ;;
                    "system")
                        mv "$file" "src/core/types/system/$base_name"
                        ;;
                    "flow")
                        mv "$file" "src/core/types/flow/$base_name"
                        ;;
                    "energy")
                        mv "$file" "src/core/types/energy/$base_name"
                        ;;
                    "space")
                        mv "$file" "src/core/types/space/$base_name"
                        ;;
                    "protection")
                        mv "$file" "src/core/types/protection/$base_name"
                        ;;
                    "consciousness")
                        mv "$file" "src/core/types/consciousness/$base_name"
                        ;;
                    *)
                        mv "$file" "src/core/types/$base_name"
                        ;;
                esac
                echo "Moved TypeScript file: $base_name"
                ;;
        esac
    fi
done

echo "File organization complete!" 