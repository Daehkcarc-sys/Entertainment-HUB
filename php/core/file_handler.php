<?php
/**
 * File Handler
 * 
 * Manages file uploads, validation, and processing.
 */

// Include required files
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

/**
 * Upload a file
 * 
 * @param array $file File data ($_FILES element)
 * @param string $destination Destination directory
 * @param array $options Additional options
 * @return array Result with success or error information
 */
function uploadFile($file, $destination, $options = []) {
    // Merge default options with provided options
    $options = array_merge([
        'allowedTypes' => ALLOWED_FILE_TYPES,
        'maxSize' => MAX_UPLOAD_SIZE,
        'createDir' => true,
        'renameFile' => true,
        'prefix' => 'file_'
    ], $options);
    
    try {
        // Check if file was uploaded properly
        if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK) {
            $errorMessage = getFileUploadErrorMessage($file['error']);
            return ['error' => 'Upload failed: ' . $errorMessage];
        }
        
        // Validate file size
        if ($file['size'] > $options['maxSize']) {
            return ['error' => 'File too large. Maximum allowed size is ' . formatFileSize($options['maxSize'])];
        }
        
        // Validate file type
        $mimeType = mime_content_type($file['tmp_name']);
        if (!in_array($mimeType, $options['allowedTypes'])) {
            return ['error' => 'Invalid file type. Allowed types: ' . implode(', ', $options['allowedTypes'])];
        }
        
        // Create destination directory if it doesn't exist
        if ($options['createDir'] && !file_exists($destination)) {
            if (!mkdir($destination, 0755, true)) {
                return ['error' => 'Failed to create destination directory.'];
            }
        }
        
        // Generate unique filename if needed
        $filename = $file['name'];
        if ($options['renameFile']) {
            $extension = pathinfo($filename, PATHINFO_EXTENSION);
            $filename = $options['prefix'] . uniqid() . '.' . $extension;
        }
        
        // Sanitize filename to prevent directory traversal
        $filename = basename($filename);
        $filepath = $destination . '/' . $filename;
        
        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            return ['error' => 'Failed to move uploaded file.'];
        }
        
        // Set appropriate file permissions
        chmod($filepath, 0644);
        
        return [
            'success' => true,
            'filename' => $filename,
            'filepath' => $filepath,
            'size' => $file['size'],
            'mime_type' => $mimeType
        ];
    } catch (Exception $e) {
        logMessage('File upload error: ' . $e->getMessage(), 'error');
        return ['error' => 'An error occurred during file upload.'];
    }
}

/**
 * Upload an image with optional resizing
 * 
 * @param array $file File data ($_FILES element)
 * @param string $destination Destination directory
 * @param array $options Additional options including resize options
 * @return array Result with success or error information
 */
function uploadImage($file, $destination, $options = []) {
    // Set image-specific options
    $options = array_merge([
        'allowedTypes' => ALLOWED_IMAGE_TYPES,
        'maxSize' => MAX_UPLOAD_SIZE,
        'createDir' => true,
        'renameFile' => true,
        'prefix' => 'img_',
        'resize' => false,
        'maxWidth' => 1200,
        'maxHeight' => 1200,
        'quality' => 90,
        'createThumbnail' => false,
        'thumbWidth' => 200,
        'thumbHeight' => 200,
        'thumbPrefix' => 'thumb_'
    ], $options);
    
    // Upload the file
    $result = uploadFile($file, $destination, $options);
    
    if (isset($result['error'])) {
        return $result;
    }
    
    // Process image if needed
    if ($options['resize'] || $options['createThumbnail']) {
        $imgResult = processImage($result['filepath'], $options);
        
        if (isset($imgResult['error'])) {
            // Delete the original file if image processing failed
            if (file_exists($result['filepath'])) {
                unlink($result['filepath']);
            }
            return $imgResult;
        }
        
        // Add thumbnail information to result
        if ($options['createThumbnail'] && isset($imgResult['thumbnail'])) {
            $result['thumbnail'] = $imgResult['thumbnail'];
        }
        
        // Update dimensions in result
        if (isset($imgResult['width']) && isset($imgResult['height'])) {
            $result['width'] = $imgResult['width'];
            $result['height'] = $imgResult['height'];
        }
    }
    
    return $result;
}

/**
 * Process an image (resize and/or create thumbnail)
 * 
 * @param string $filepath Path to the image file
 * @param array $options Processing options
 * @return array Result with success or error information
 */
function processImage($filepath, $options) {
    if (!extension_loaded('gd') && !extension_loaded('imagick')) {
        return ['error' => 'Image processing requires GD or ImageMagick extension.'];
    }
    
    try {
        // Get image info
        list($origWidth, $origHeight, $type) = getimagesize($filepath);
        
        // Create image resource based on file type
        switch ($type) {
            case IMAGETYPE_JPEG:
                $image = imagecreatefromjpeg($filepath);
                break;
            case IMAGETYPE_PNG:
                $image = imagecreatefrompng($filepath);
                break;
            case IMAGETYPE_GIF:
                $image = imagecreatefromgif($filepath);
                break;
            case IMAGETYPE_WEBP:
                if (function_exists('imagecreatefromwebp')) {
                    $image = imagecreatefromwebp($filepath);
                } else {
                    return ['error' => 'WEBP format not supported by this PHP installation.'];
                }
                break;
            default:
                return ['error' => 'Unsupported image format.'];
        }
        
        if (!$image) {
            return ['error' => 'Failed to create image resource.'];
        }
        
        $result = ['width' => $origWidth, 'height' => $origHeight];
        
        // Resize image if required
        if ($options['resize'] && ($origWidth > $options['maxWidth'] || $origHeight > $options['maxHeight'])) {
            // Calculate new dimensions while maintaining aspect ratio
            $ratio = min($options['maxWidth'] / $origWidth, $options['maxHeight'] / $origHeight);
            $newWidth = round($origWidth * $ratio);
            $newHeight = round($origHeight * $ratio);
            
            // Create resized image
            $resizedImage = imagecreatetruecolor($newWidth, $newHeight);
            
            // Preserve transparency for PNG and GIF
            if ($type == IMAGETYPE_PNG || $type == IMAGETYPE_GIF) {
                imagealphablending($resizedImage, false);
                imagesavealpha($resizedImage, true);
                $transparent = imagecolorallocatealpha($resizedImage, 255, 255, 255, 127);
                imagefilledrectangle($resizedImage, 0, 0, $newWidth, $newHeight, $transparent);
            }
            
            // Resize
            imagecopyresampled($resizedImage, $image, 0, 0, 0, 0, $newWidth, $newHeight, $origWidth, $origHeight);
            
            // Save resized image
            saveImage($resizedImage, $filepath, $type, $options['quality']);
            
            // Update dimensions in result
            $result['width'] = $newWidth;
            $result['height'] = $newHeight;
            
            // Free memory
            imagedestroy($image);
            $image = $resizedImage;
        }
        
        // Create thumbnail if required
        if ($options['createThumbnail']) {
            $thumbPath = dirname($filepath) . '/' . $options['thumbPrefix'] . basename($filepath);
            $thumbWidth = $options['thumbWidth'];
            $thumbHeight = $options['thumbHeight'];
            
            // Create thumbnail image with exact dimensions (crop if necessary)
            $thumbnail = imagecreatetruecolor($thumbWidth, $thumbHeight);
            
            // Preserve transparency for PNG and GIF
            if ($type == IMAGETYPE_PNG || $type == IMAGETYPE_GIF) {
                imagealphablending($thumbnail, false);
                imagesavealpha($thumbnail, true);
                $transparent = imagecolorallocatealpha($thumbnail, 255, 255, 255, 127);
                imagefilledrectangle($thumbnail, 0, 0, $thumbWidth, $thumbHeight, $transparent);
            }
            
            // Calculate crop position for centered thumbnail
            $sourceWidth = $result['width'];
            $sourceHeight = $result['height'];
            
            $srcAspect = $sourceWidth / $sourceHeight;
            $thumbAspect = $thumbWidth / $thumbHeight;
            
            if ($srcAspect > $thumbAspect) {
                // Source image is wider than thumbnail (crop width)
                $sourceX = floor(($sourceWidth - $sourceHeight * $thumbAspect) / 2);
                $sourceY = 0;
                $sourceWidth = ceil($sourceHeight * $thumbAspect);
            } else {
                // Source image is taller than thumbnail (crop height)
                $sourceX = 0;
                $sourceY = floor(($sourceHeight - $sourceWidth / $thumbAspect) / 2);
                $sourceHeight = ceil($sourceWidth / $thumbAspect);
            }
            
            // Create the thumbnail
            imagecopyresampled(
                $thumbnail,
                $image,
                0, 0, $sourceX, $sourceY,
                $thumbWidth, $thumbHeight, $sourceWidth, $sourceHeight
            );
            
            // Save thumbnail
            saveImage($thumbnail, $thumbPath, $type, $options['quality']);
            
            // Free memory
            imagedestroy($thumbnail);
            
            // Add thumbnail info to result
            $result['thumbnail'] = [
                'path' => $thumbPath,
                'filename' => basename($thumbPath),
                'width' => $thumbWidth,
                'height' => $thumbHeight
            ];
        }
        
        // Free memory
        imagedestroy($image);
        
        return $result;
    } catch (Exception $e) {
        logMessage('Image processing error: ' . $e->getMessage(), 'error');
        return ['error' => 'An error occurred during image processing.'];
    }
}

/**
 * Save an image to file
 * 
 * @param resource $image Image resource
 * @param string $filepath Path to save the image
 * @param int $type Image type constant
 * @param int $quality JPEG/WEBP quality (0-100)
 * @return bool True on success, false on failure
 */
function saveImage($image, $filepath, $type, $quality = 90) {
    switch ($type) {
        case IMAGETYPE_JPEG:
            return imagejpeg($image, $filepath, $quality);
        case IMAGETYPE_PNG:
            // PNG quality is 0-9, convert from 0-100
            $pngQuality = round((100 - $quality) / 11.111);
            return imagepng($image, $filepath, $pngQuality);
        case IMAGETYPE_GIF:
            return imagegif($image, $filepath);
        case IMAGETYPE_WEBP:
            if (function_exists('imagewebp')) {
                return imagewebp($image, $filepath, $quality);
            }
            return false;
        default:
            return false;
    }
}

/**
 * Delete a file with checks
 * 
 * @param string $filepath Path to the file
 * @param bool $checkPath Whether to check if the path is inside allowed directories
 * @return bool True on success, false on failure
 */
function deleteFile($filepath, $checkPath = true) {
    if ($checkPath) {
        // Ensure the file is within an allowed path
        $realpath = realpath($filepath);
        $uploadsPath = realpath(UPLOADS_PATH);
        
        if ($realpath === false || strpos($realpath, $uploadsPath) !== 0) {
            logMessage('Attempted to delete file outside allowed paths: ' . $filepath, 'error');
            return false;
        }
    }
    
    if (file_exists($filepath)) {
        return unlink($filepath);
    }
    
    return false;
}

/**
 * Get error message for file upload error code
 * 
 * @param int $errorCode Upload error code
 * @return string Error message
 */
function getFileUploadErrorMessage($errorCode) {
    switch ($errorCode) {
        case UPLOAD_ERR_INI_SIZE:
            return 'The uploaded file exceeds the upload_max_filesize directive in php.ini.';
        case UPLOAD_ERR_FORM_SIZE:
            return 'The uploaded file exceeds the MAX_FILE_SIZE directive in the HTML form.';
        case UPLOAD_ERR_PARTIAL:
            return 'The uploaded file was only partially uploaded.';
        case UPLOAD_ERR_NO_FILE:
            return 'No file was uploaded.';
        case UPLOAD_ERR_NO_TMP_DIR:
            return 'Missing a temporary folder.';
        case UPLOAD_ERR_CANT_WRITE:
            return 'Failed to write file to disk.';
        case UPLOAD_ERR_EXTENSION:
            return 'A PHP extension stopped the file upload.';
        default:
            return 'Unknown upload error.';
    }
}

/**
 * Get file information
 * 
 * @param string $filepath Path to the file
 * @return array|bool File information or false on failure
 */
function getFileInfo($filepath) {
    if (!file_exists($filepath)) {
        return false;
    }
    
    try {
        $info = [
            'filename' => basename($filepath),
            'filepath' => $filepath,
            'size' => filesize($filepath),
            'last_modified' => filemtime($filepath),
            'extension' => pathinfo($filepath, PATHINFO_EXTENSION),
            'mime_type' => mime_content_type($filepath)
        ];
        
        // Add image dimensions if it's an image
        if (in_array($info['mime_type'], ALLOWED_IMAGE_TYPES)) {
            list($width, $height) = getimagesize($filepath);
            $info['width'] = $width;
            $info['height'] = $height;
        }
        
        return $info;
    } catch (Exception $e) {
        logMessage('Error getting file info: ' . $e->getMessage(), 'error');
        return false;
    }
}

/**
 * Create a secure random filename
 * 
 * @param string $prefix Optional prefix for filename
 * @param string $extension File extension
 * @return string Randomized filename
 */
function createRandomFilename($prefix = '', $extension = '') {
    $random = bin2hex(random_bytes(8));
    $filename = $prefix . $random;
    
    if (!empty($extension)) {
        $filename .= '.' . ltrim($extension, '.');
    }
    
    return $filename;
}

/**
 * Check if a directory is writable and create it if it doesn't exist
 * 
 * @param string $directory Directory path
 * @return bool True if directory exists and is writable
 */
function ensureDirectoryExists($directory) {
    if (!file_exists($directory)) {
        return mkdir($directory, 0755, true);
    }
    
    return is_writable($directory);
}

/**
 * Sanitize filename to make it safe for storage
 * 
 * @param string $filename Original filename
 * @return string Sanitized filename
 */
function sanitizeFilename($filename) {
    // Remove any path components
    $filename = basename($filename);
    
    // Replace spaces with underscores
    $filename = str_replace(' ', '_', $filename);
    
    // Remove special characters
    $filename = preg_replace('/[^\w\.-]/', '', $filename);
    
    // Ensure filename doesn't start with a dot (hidden file)
    $filename = ltrim($filename, '.');
    
    return $filename;
}

/**
 * Generate a publicly accessible URL for a file
 * 
 * @param string $filepath Server path to the file
 * @return string|bool URL or false if file doesn't exist
 */
function getFileUrl($filepath) {
    if (!file_exists($filepath)) {
        return false;
    }
    
    // Convert server path to URL
    $uploadsPath = realpath(UPLOADS_PATH);
    $realFilePath = realpath($filepath);
    
    if ($realFilePath && strpos($realFilePath, $uploadsPath) === 0) {
        $relativePath = substr($realFilePath, strlen($uploadsPath));
        $relativePath = str_replace('\\', '/', $relativePath); // For Windows paths
        return UPLOADS_URL . $relativePath;
    }
    
    return false;
}