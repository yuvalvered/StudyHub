"""
Rating model for user ratings and reviews of materials.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base import Base


class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    comment = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)

    # Relationships
    user = relationship("User", back_populates="ratings")
    material = relationship("Material", back_populates="ratings")

    # Ensure a user can only rate a material once
    __table_args__ = (
        UniqueConstraint('user_id', 'material_id', name='unique_user_material_rating'),
    )

    def __repr__(self):
        return f"<Rating {self.rating}/5 by User {self.user_id}>"
