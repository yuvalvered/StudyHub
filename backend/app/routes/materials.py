"""
Material routes: upload, download, search study materials.
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pathlib import Path

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.material import MaterialType
from app.models.discussion import Discussion
from app.schemas.material import MaterialCreate, MaterialResponse, MaterialUpdate
from app.schemas.material_report import MaterialReportResponse
from app.schemas.discussion import DiscussionResponse
from app.services.material_service import MaterialService

router = APIRouter(prefix="/materials", tags=["Materials"])


@router.post("", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
async def upload_material(
    title: str = Form(...),
    material_type: str = Form(...),
    course_id: int = Form(...),
    description: Optional[str] = Form(None),
    external_url: Optional[str] = Form(None),
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
    # Create MaterialCreate object from form data
    material_data = MaterialCreate(
        title=title,
        description=description,
        material_type=MaterialType(material_type.lower()),
        course_id=course_id,
        external_url=external_url
    )

    # Handle file upload if provided
    if file:
        file_path, file_name, file_size = await MaterialService.save_file(file)
        new_material = MaterialService.create_material(db, material_data, current_user, file)
        # Update file info after creation
        new_material.file_path = file_path
        new_material.file_size = file_size
        db.commit()
        db.refresh(new_material)
        return new_material
    else:
        return MaterialService.create_material(db, material_data, current_user, None)


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


@router.get("/{material_id}/preview")
async def preview_material(
    material_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Preview a material file in the browser (inline display).
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
            detail=f"File not found on server. Looking at: {file_path.absolute()}"
        )

    # Determine media type based on file extension
    media_type_map = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
    }

    file_extension = material.file_extension.lower() if material.file_extension else ""
    media_type = media_type_map.get(file_extension, "application/octet-stream")

    # Return file for inline display
    return FileResponse(
        path=str(file_path),
        media_type=media_type,
        headers={"Content-Disposition": "inline"}
    )


@router.get("/{material_id}/download")
async def download_material(
    material_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Download a material file (forces download).
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
    print(f"DEBUG: Looking for file at: {file_path}")
    print(f"DEBUG: Absolute path: {file_path.absolute()}")
    print(f"DEBUG: File exists: {file_path.exists()}")

    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File not found on server. Looking at: {file_path.absolute()}"
        )

    # Increment download count
    MaterialService.increment_download_count(db, material_id)

    # Return file for download (attachment)
    return FileResponse(
        path=str(file_path),
        filename=material.file_name,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{material.file_name}"'}
    )


@router.post("/{material_id}/report", response_model=MaterialReportResponse, status_code=status.HTTP_201_CREATED)
async def report_material(
    material_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Report a material (toggle report on).

    Simple one-click report - no reason or description needed.
    Each user can only report a material once.
    """
    return MaterialService.report_material(db, material_id, current_user)


@router.delete("/{material_id}/report", status_code=status.HTTP_204_NO_CONTENT)
async def unreport_material(
    material_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove a report on a material (toggle report off).
    """
    MaterialService.unreport_material(db, material_id, current_user)


@router.get("/{material_id}/discussion", response_model=DiscussionResponse)
async def get_material_discussion(
    material_id: int,
    db: Session = Depends(get_db)
):
    """
    Get the discussion for a specific material.

    Each material automatically gets a discussion when created.
    """
    material = MaterialService.get_material_by_id(db, material_id)

    # Find discussion for this material
    discussion = db.query(Discussion).filter(
        Discussion.material_id == material_id
    ).first()

    if not discussion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Discussion not found for this material"
        )

    return discussion


# ============================================================================
# Material Rating Endpoints (Stage 3)
# ============================================================================
# Rating endpoints moved to ratings.py router
