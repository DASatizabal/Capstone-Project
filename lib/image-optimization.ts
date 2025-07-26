// lib/image-optimization.ts
// Basic image optimization utilities

interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "jpeg" | "png" | "webp";
}

// Canvas-based image resizing (works in browser environments)
export async function resizeImageCanvas(
  file: File,
  options: ImageOptimizationOptions = {},
): Promise<Blob> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = "jpeg",
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw resized image
      ctx?.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob"));
          }
        },
        `image/${format}`,
        quality,
      );
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

// Server-side image optimization (without sharp)
export async function optimizeImageBuffer(
  buffer: Buffer,
  contentType: string,
  options: ImageOptimizationOptions = {},
): Promise<Buffer> {
  // For now, just return the original buffer
  // This is where you would integrate sharp or another server-side image library

  const maxSize = 5 * 1024 * 1024; // 5MB

  // If image is already small enough, return as-is
  if (buffer.length <= maxSize) {
    return buffer;
  }

  // For now, just return the original buffer
  // In production, you would want to:
  // 1. Install sharp: npm install sharp
  // 2. Use sharp to resize/compress the image

  console.warn(
    "Image optimization not implemented. Consider installing sharp for production use.",
  );
  return buffer;
}

// Validate image file
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Only JPEG, PNG, and WebP are allowed.",
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File too large. Maximum size is 10MB.",
    };
  }

  return { valid: true };
}

// Get optimized filename
export function getOptimizedFilename(
  originalName: string,
  suffix: string = "optimized",
): string {
  const ext = originalName.split(".").pop() || "jpg";
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
  return `${nameWithoutExt}-${suffix}.${ext}`;
}

// Image metadata extractor (basic)
export async function getImageMetadata(file: File): Promise<{
  width?: number;
  height?: number;
  size: number;
  type: string;
  lastModified: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      });
    };

    img.onerror = () => {
      // If image can't be loaded, return basic metadata
      resolve({
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      });
    };

    img.src = URL.createObjectURL(file);
  });
}
