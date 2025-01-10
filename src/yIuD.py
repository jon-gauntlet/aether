from setuptools import setup, find_packages

setup(
    name="ai_system_evolution",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "asyncio",
        "systemd-python",
        "aiofiles",
        "python-json-logger",
    ],
    python_requires=">=3.8",
    author="Jon",
    description="AI System Evolution Framework",
    entry_points={
        "console_scripts": [
            "context-service=services.context_service:main",
        ],
    },
) 