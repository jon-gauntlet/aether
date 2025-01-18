from pydantic import BaseModel, Field
from typing import Optional, List
import numpy as np
from datetime import datetime

class Document(BaseModel):
    id: str
    content: str
    title: Optional[str] = None
    metadata: dict = Field(default_factory=dict)
    embedding: Optional[List[float]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        arbitrary_types_allowed = True 