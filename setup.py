from setuptools import setup, find_namespace_packages

setup(
    name="aether-backend",
    version="0.1.0",
    packages=find_namespace_packages(include=["src.*"]),
    package_dir={"": "src"},
    install_requires=[
        "fastapi",
        "uvicorn",
        "websockets",
        "pydantic",
        "pyjwt",
        "httpx",
        "pytest",
        "pytest-asyncio"
    ]
) 