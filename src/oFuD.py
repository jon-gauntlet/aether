import os
import glob

def find_requirement_files():
    """Find all requirements.txt and Pipfile files in the project"""
    requirement_files = []
    
    # Walk through all directories
    for root, _, files in os.walk('.'):
        # Skip .git and virtual environment directories
        if '.git' in root or '.venv' in root or 'node_modules' in root:
            continue
            
        for file in files:
            if file in ['requirements.txt', 'Pipfile', 'setup.py']:
                full_path = os.path.join(root, file)
                requirement_files.append(full_path)
    
    return requirement_files

def extract_requirements():
    """Extract package names from found requirement files"""
    packages = set()
    
    for file_path in find_requirement_files():
        with open(file_path, 'r') as f:
            if file_path.endswith('requirements.txt'):
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        # Remove version specifiers
                        package = line.split('==')[0].split('>=')[0].split('<=')[0]
                        packages.add(package)
            elif file_path.endswith('Pipfile'):
                reading_packages = False
                for line in f:
                    if '[packages]' in line:
                        reading_packages = True
                        continue
                    if reading_packages and line.strip() and '=' in line:
                        package = line.split('=')[0].strip()
                        packages.add(package)
    
    return sorted(packages)

if __name__ == '__main__':
    packages = extract_requirements()
    
    # Write consolidated requirements
    with open('consolidated_requirements.txt', 'w') as f:
        for package in packages:
            f.write(f'{package}\n')
    
    print("Found the following packages:")
    for package in packages:
        print(f"- {package}")
    
    print("\nTo install these in your Pipenv, run:")
    print("pipenv install -r consolidated_requirements.txt") 