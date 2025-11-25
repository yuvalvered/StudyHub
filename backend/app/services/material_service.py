"""
Material service - handles material CRUD operations and file management.
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile
from typing import List, Optional
import os
from pathlib import Path
import shutil

from app.models.material import Material, MaterialType
from app.models.user import User
from app.schemas.material import MaterialCreate, MaterialUpdate


class MaterialService:
    """Service for handling material operations."""

    # Configuration for file uploads
    UPLOAD_DIR = Path("uploads/materials")
    ALLOWED_EXTENSIONS = {".pdf", ".docx", ".pptx", ".doc", ".ppt", ".txt", ".jpg", ".jpeg", ".png"}
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

    @staticmethod
    def _ensure_upload_dir():
        """Ensure upload directory exists."""
        MaterialService.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    @staticmethod
    async def save_file(file: UploadFile) -> tuple[str, str, int]:
        """
        Save uploaded file to disk.

        Args:
            file: Uploaded file

        Returns:
            Tuple of (file_path, file_name, file_size)

        Raises:
            HTTPException: If file is invalid or too large
        """
        # Validate file extension
        file_extension = Path(file.filename).suffix.lower()
        if file_extension not in MaterialService.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type {file_extension} not allowed. Allowed types: {MaterialService.ALLOWED_EXTENSIONS}"
            )

        # Ensure upload directory exists
        MaterialService._ensure_upload_dir()

        # Generate unique filename
        import uuid
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = MaterialService.UPLOAD_DIR / unique_filename

        # Save file
        try:
            with open(file_path, "wb") as buffer:
                content = await file.read()
                file_size = len(content)

                # Check file size
                if file_size > MaterialService.MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"File too large. Max size: {MaterialService.MAX_FILE_SIZE / 1024 / 1024}MB"
                    )

                buffer.write(content)

            return str(file_path), file.filename, file_size

        except Exception as e:
            # Clean up partial file if something went wrong
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error saving file: {str(e)}"
            )

    @staticmethod
    def create_material(
        db: Session,
        material_data: MaterialCreate,
        uploader: User,
        file: Optional[UploadFile] = None
    ) -> Material:
        """
        Create a new material.

        Args:
            db: Database session
            material_data: Material creation data
            uploader: User uploading the material
            file: Optional file upload

        Returns:
            Created material object

        Raises:
            HTTPException: If validation fails
        """
        # Validate: either file or external_url must be provided
        if not file and not material_data.external_url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either a file or external_url must be provided"
            )

        # Create material object
        new_material = Material(
            title=material_data.title,
            description=material_data.description,
            material_type=material_data.material_type,
            course_id=material_data.course_id,
            uploader_id=uploader.id,
            external_url=str(material_data.external_url) if material_data.external_url else None
        )

        # Handle file upload if provided
        if file:
            # Note: This is a synchronous function, but save_file is async
            # In real implementation, you'd need to handle this properly
            # For now, we'll store file info but not actually save it here
            new_material.file_name = file.filename
            file_extension = Path(file.filename).suffix.lower()
            new_material.file_extension = file_extension

        db.add(new_material)
        db.commit()
        db.refresh(new_material)

        return new_material

    @staticmethod
    def get_materials(
        db: Session,
        course_id: Optional[int] = None,
        material_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[Material]:
        """
        Get list of materials with optional filters.

        Args:
            db: Database session
            course_id: Filter by course
            material_type: Filter by material type
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of materials
        """
        query = db.query(Material)

        if course_id:
            query = query.filter(Material.course_id == course_id)

        if material_type:
            try:
                mt = MaterialType(material_type)
                query = query.filter(Material.material_type == mt)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid material type: {material_type}"
                )

        query = query.order_by(Material.created_at.desc())
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_material_by_id(db: Session, material_id: int) -> Material:
        """
        Get a material by ID.

        Args:
            db: Database session
            material_id: Material ID

        Returns:
            Material object

        Raises:
            HTTPException: If material not found
        """
        material = db.query(Material).filter(Material.id == material_id).first()
        if not material:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Material with id {material_id} not found"
            )
        return material

    @staticmethod
    def update_material(
        db: Session,
        material_id: int,
        material_update: MaterialUpdate,
        current_user: User
    ) -> Material:
        """
        Update material metadata.

        Args:
            db: Database session
            material_id: Material ID
            material_update: Update data
            current_user: Current user (must be uploader or admin)

        Returns:
            Updated material

        Raises:
            HTTPException: If not authorized or material not found
        """
        material = MaterialService.get_material_by_id(db, material_id)

        # Check authorization
        if material.uploader_id != current_user.id and not current_user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to update this material"
            )

        # Update fields
        if material_update.title is not None:
            material.title = material_update.title
        if material_update.description is not None:
            material.description = material_update.description
        if material_update.material_type is not None:
            material.material_type = material_update.material_type

        db.commit()
        db.refresh(material)

        return material

    @staticmethod
    def delete_material(
        db: Session,
        material_id: int,
        current_user: User
    ):
        """
        Delete a material.

        Args:
            db: Database session
            material_id: Material ID
            current_user: Current user (must be uploader or admin)

        Raises:
            HTTPException: If not authorized or material not found
        """
        material = MaterialService.get_material_by_id(db, material_id)

        # Check authorization
        if material.uploader_id != current_user.id and not current_user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete this material"
            )

        # Delete file if exists
        if material.file_path and Path(material.file_path).exists():
            try:
                Path(material.file_path).unlink()
            except Exception as e:
                # Log error but don't fail the deletion
                print(f"Error deleting file: {e}")

        db.delete(material)
        db.commit()

    @staticmethod
    def increment_download_count(db: Session, material_id: int):
        """
        Increment download count for a material.

        Args:
            db: Database session
            material_id: Material ID
        """
        material = MaterialService.get_material_by_id(db, material_id)
        material.download_count += 1
        db.commit()
