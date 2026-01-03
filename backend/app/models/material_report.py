"""
MaterialReport model for tracking user reports on materials.
Simple toggle system - user can report/unreport a material.
"""
from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base import Base


class MaterialReport(Base):
    __tablename__ = "material_reports"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign Keys
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    material = relationship("Material", back_populates="user_reports")
    user = relationship("User", back_populates="material_reports")

    # Ensure each user can only report a material once
    __table_args__ = (
        UniqueConstraint('material_id', 'user_id', name='uq_material_user_report'),
    )

    def __repr__(self):
        return f"<MaterialReport material_id={self.material_id} user_id={self.user_id}>"
