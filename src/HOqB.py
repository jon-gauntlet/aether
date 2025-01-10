from setuptools import setup, find_packages

setup(
    name="ai_system_evolution",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "asyncio",
        "typing",
        "dataclasses",
    ],
    python_requires=">=3.7",
    author="Jon",
    description="AI System Evolution Framework",
    entry_points={
        "console_scripts": [
            "context-service=ai_system_evolution.services.context_service:main",
        ],
    },
) 