"""
File upload utilities for pet photo management.
"""
import os
import uuid
import aiofiles
from datetime import datetime
from typing import Optional, Tuple, List
from pathlib import Path
from fastapi import UploadFile, HTTPException
from PIL import Image
import magic


class FileUploadConfig:
    """Configuration for file uploads."""
    
    # Allowed file types
    ALLOWED_IMAGE_TYPES = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp'
    }
    
    # File size limits (in bytes)
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    MAX_IMAGE_SIZE = 5 * 1024 * 1024   # 5MB
    
    # Image dimensions
    MAX_IMAGE_WIDTH = 2048
    MAX_IMAGE_HEIGHT = 2048
    THUMBNAIL_SIZE = (300, 300)
    
    # Upload directories
    UPLOAD_DIR = "uploads"
    PET_PHOTOS_DIR = "pet_photos"
    THUMBNAILS_DIR = "thumbnails"


class FileUploadService:
    """Service for handling file uploads with validation and processing."""
    
    def __init__(self, config: FileUploadConfig = None):
        self.config = config or FileUploadConfig()
        self._ensure_directories()
    
    def _ensure_directories(self) -> None:
        """Ensure upload directories exist."""
        directories = [
            self.config.UPLOAD_DIR,
            os.path.join(self.config.UPLOAD_DIR, self.config.PET_PHOTOS_DIR),
            os.path.join(self.config.UPLOAD_DIR, self.config.THUMBNAILS_DIR)
        ]
        
        for directory in directories:
            Path(directory).mkdir(parents=True, exist_ok=True)
    
    async def validate_file(self, file: UploadFile) -> None:
        """
        Validate uploaded file for type, size, and content.
        
        Args:
            file: The uploaded file to validate
            
        Raises:
            HTTPException: If validation fails
        """
        # Check file size
        file_content = await file.read()
        file_size = len(file_content)
        await file.seek(0)  # Reset file pointer
        
        if file_size > self.config.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size is {self.config.MAX_FILE_SIZE / (1024*1024):.1f}MB"
            )
        
        if file_size == 0:
            raise HTTPException(
                status_code=400,
                detail="Empty file uploaded"
            )
        
        # Validate MIME type using python-magic
        mime_type = magic.from_buffer(file_content, mime=True)
        
        if mime_type not in self.config.ALLOWED_IMAGE_TYPES:
            allowed_types = ", ".join(self.config.ALLOWED_IMAGE_TYPES.keys())
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed types: {allowed_types}"
            )
        
        # Additional validation for images
        if mime_type.startswith('image/'):
            await self._validate_image(file_content)
    
    async def _validate_image(self, file_content: bytes) -> None:
        """
        Validate image-specific properties.
        
        Args:
            file_content: The image file content
            
        Raises:
            HTTPException: If image validation fails
        """
        try:
            # Open image with PIL to validate and get dimensions
            image = Image.open(io.BytesIO(file_content))
            width, height = image.size
            
            if width > self.config.MAX_IMAGE_WIDTH or height > self.config.MAX_IMAGE_HEIGHT:
                raise HTTPException(
                    status_code=400,
                    detail=f"Image too large. Maximum dimensions: {self.config.MAX_IMAGE_WIDTH}x{self.config.MAX_IMAGE_HEIGHT}"
                )
            
            # Verify image integrity
            image.verify()
            
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid image file: {str(e)}"
            )
    
    def _generate_filename(self, original_filename: str, content_type: str) -> str:
        """
        Generate a unique filename for the uploaded file.
        
        Args:
            original_filename: Original filename from upload
            content_type: MIME type of the file
            
        Returns:
            Generated unique filename
        """
        # Get file extension from content type
        extension = self.config.ALLOWED_IMAGE_TYPES.get(content_type, '')
        
        # Generate unique filename with timestamp and UUID
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        
        return f"{timestamp}_{unique_id}{extension}"
    
    async def save_pet_photo(self, file: UploadFile, pet_id: int) -> Tuple[str, str]:
        """
        Save pet photo and create thumbnail.
        
        Args:
            file: The uploaded photo file
            pet_id: ID of the pet
            
        Returns:
            Tuple of (photo_path, thumbnail_path)
            
        Raises:
            HTTPException: If save operation fails
        """
        try:
            # Validate file
            await self.validate_file(file)
            
            # Generate filename
            filename = self._generate_filename(file.filename, file.content_type)
            
            # Create file paths
            photo_dir = os.path.join(self.config.UPLOAD_DIR, self.config.PET_PHOTOS_DIR)
            thumbnail_dir = os.path.join(self.config.UPLOAD_DIR, self.config.THUMBNAILS_DIR)
            
            photo_path = os.path.join(photo_dir, filename)
            thumbnail_path = os.path.join(thumbnail_dir, f"thumb_{filename}")
            
            # Save original file
            async with aiofiles.open(photo_path, 'wb') as f:
                content = await file.read()
                await f.write(content)
            
            # Create thumbnail
            await self._create_thumbnail(photo_path, thumbnail_path)
            
            return photo_path, thumbnail_path
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save file: {str(e)}"
            )
    
    async def _create_thumbnail(self, source_path: str, thumbnail_path: str) -> None:
        """
        Create thumbnail from source image.
        
        Args:
            source_path: Path to source image
            thumbnail_path: Path for thumbnail
        """
        try:
            with Image.open(source_path) as image:
                # Convert to RGB if necessary (for JPEG compatibility)
                if image.mode in ('RGBA', 'LA', 'P'):
                    image = image.convert('RGB')
                
                # Create thumbnail
                image.thumbnail(self.config.THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
                image.save(thumbnail_path, 'JPEG', quality=85, optimize=True)
                
        except Exception as e:
            # Log error but don't fail the upload
            print(f"Failed to create thumbnail: {str(e)}")
    
    def delete_file(self, file_path: str) -> bool:
        """
        Delete a file from the filesystem.
        
        Args:
            file_path: Path to the file to delete
            
        Returns:
            True if deletion was successful, False otherwise
        """
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception as e:
            print(f"Failed to delete file {file_path}: {str(e)}")
            return False
    
    def delete_pet_photos(self, photo_path: str) -> bool:
        """
        Delete pet photo and its thumbnail.
        
        Args:
            photo_path: Path to the main photo
            
        Returns:
            True if deletion was successful
        """
        success = True
        
        # Delete main photo
        if photo_path and os.path.exists(photo_path):
            success &= self.delete_file(photo_path)
        
        # Delete thumbnail
        if photo_path:
            filename = os.path.basename(photo_path)
            thumbnail_dir = os.path.join(self.config.UPLOAD_DIR, self.config.THUMBNAILS_DIR)
            thumbnail_path = os.path.join(thumbnail_dir, f"thumb_{filename}")
            
            if os.path.exists(thumbnail_path):
                success &= self.delete_file(thumbnail_path)
        
        return success
    
    def get_file_info(self, file_path: str) -> Optional[dict]:
        """
        Get information about a file.
        
        Args:
            file_path: Path to the file
            
        Returns:
            Dictionary with file information or None if file doesn't exist
        """
        try:
            if not os.path.exists(file_path):
                return None
            
            stat = os.stat(file_path)
            return {
                'filename': os.path.basename(file_path),
                'size': stat.st_size,
                'created_at': datetime.fromtimestamp(stat.st_ctime),
                'modified_at': datetime.fromtimestamp(stat.st_mtime)
            }
        except Exception:
            return None


# Import required modules
import io

# Global instance
file_upload_service = FileUploadService()