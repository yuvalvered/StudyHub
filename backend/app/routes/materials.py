"""
Material routes: upload, download, search study materials.
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pathlib import Path

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.material import MaterialCreate, MaterialResponse, MaterialUpdate
from app.services.material_service import MaterialService

router = APIRouter(prefix="/materials", tags=["Materials"])


@router.post("", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
async def upload_material(
    material: MaterialCreate,
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a new study material.

    Can include:
    - A file (PDF, DOCX, PPTX, images)
    - An external link
    """
    # Handle file upload if provided
    if file:
        file_path, file_name, file_size = await MaterialService.save_file(file)
        new_material = MaterialService.create_material(db, material, current_user, file)
        # Update file info after creation
        new_material.file_path = file_path
        new_material.file_size = file_size
        db.commit()
        db.refresh(new_material)
        return new_material
    else:
        return MaterialService.create_material(db, material, current_user, None)


@router.get("", response_model=List[MaterialResponse])
async def get_materials(
    course_id: Optional[int] = None,
    material_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get list of materials with optional filters.
    """
    return MaterialService.get_materials(db, course_id, material_type, skip, limit)


@router.get("/{material_id}", response_model=MaterialResponse)
async def get_material(
    material_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific material by ID.
    """
    return MaterialService.get_material_by_id(db, material_id)


@router.put("/{material_id}", response_model=MaterialResponse)
async def update_material(
    material_id: int,
    material_update: MaterialUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update material metadata (only by uploader or admin).
    """
    return MaterialService.update_material(db, material_id, material_update, current_user)


@router.delete("/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_material(
    material_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a material (only by uploader or admin).
    """
    MaterialService.delete_material(db, material_id, current_user)


@router.get("/{material_id}/download")
async def download_material(
    material_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Download a material file.
    """
    material = MaterialService.get_material_by_id(db, material_id)

    # Check if material has a file
    if not material.file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This material does not have a downloadable file"
        )

    # Check if file exists
    file_path = Path(material.file_path)
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on server"
        )

    # Increment download count
    MaterialService.increment_download_count(db, material_id)

    # Return file
    return FileResponse(
        path=str(file_path),
        filename=material.file_name,
        media_type="application/octet-stream"
    )
