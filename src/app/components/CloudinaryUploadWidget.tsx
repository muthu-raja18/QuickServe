"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";

declare global {
  interface Window {
    cloudinary: any;
  }
}

interface CloudinaryUploadWidgetProps {
  onUploadSuccess: (url: string) => void;
  onUploadError: (error: string) => void;
  buttonText?: string;
  folder?: string;
  disabled?: boolean;
  // Add these new props for better organization
  email?: string; // Provider's email for folder structure
  fileType?: "photo" | "document"; // Type of file being uploaded
  maxFileSize?: number; // Custom file size limit
  allowedFormats?: string[]; // Custom allowed formats
}

const CloudinaryUploadWidget: React.FC<CloudinaryUploadWidgetProps> = ({
  onUploadSuccess,
  onUploadError,
  buttonText = "Upload",
  folder = "quickserve/providers",
  disabled = false,
  email = "",
  fileType = "document",
  maxFileSize = 10,
  allowedFormats = ["jpg", "jpeg", "png", "webp", "pdf"],
}) => {
  const widgetRef = useRef<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Load Cloudinary script
    const script = document.createElement("script");
    script.src = "https://upload-widget.cloudinary.com/global/all.js";
    script.async = true;
    script.onload = () => {
      console.log("Cloudinary widget loaded");
    };
    document.body.appendChild(script);

    return () => {
      if (widgetRef.current) {
        widgetRef.current.destroy();
      }
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Function to create folder path
  const getFolderPath = () => {
    // If email is provided, create organized folder structure
    if (email) {
      // Sanitize email for folder name (remove special characters)
      const sanitizedEmail = email
        .toLowerCase()
        .replace(/@/g, "_at_")
        .replace(/\./g, "_dot_")
        .replace(/[^a-zA-Z0-9_]/g, "");

      // Create folder structure: quickserve/providers/{email}/photos or documents
      return `quickserve/providers/${sanitizedEmail}/${
        fileType === "photo" ? "photos" : "documents"
      }`;
    }

    // Default folder if no email provided
    return folder;
  };

  // Function to get allowed formats based on file type
  const getAllowedFormats = () => {
    if (fileType === "photo") {
      return ["jpg", "jpeg", "png", "webp"]; // Only images for photos
    }
    return allowedFormats; // Default for documents (images + PDF)
  };

  // Function to get max file size based on file type
  const getMaxFileSize = () => {
    if (fileType === "photo") {
      return 5 * 1024 * 1024; // 5MB for photos
    }
    return maxFileSize * 1024 * 1024; // Default for documents
  };

  const handleClick = () => {
    if (typeof window.cloudinary === "undefined") {
      onUploadError("Cloudinary widget not loaded. Please refresh the page.");
      return;
    }

    setIsUploading(true);

    const folderPath = getFolderPath();
    const formats = getAllowedFormats();
    const fileSize = getMaxFileSize();

    console.log("Uploading to folder:", folderPath);
    console.log("Allowed formats:", formats);
    console.log("Max file size:", fileSize);

    // Create widget instance
    widgetRef.current = window.cloudinary.createUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
        folder: folderPath,
        multiple: false,
        clientAllowedFormats: formats,
        maxFileSize: fileSize,
        showPoweredBy: false,
        cropping: fileType === "photo", // Enable cropping only for photos
        croppingAspectRatio: fileType === "photo" ? 1 : undefined, // Square crop for photos
        croppingDefaultSelectionRatio: fileType === "photo" ? 1 : undefined,
        showCompletedButton: true,
        singleUploadAutoClose: true,
        styles: {
          palette: {
            window: "#FFFFFF",
            windowBorder: "#90A0B3",
            tabIcon: "#0078FF",
            menuIcons: "#5A616A",
            textDark: "#000000",
            textLight: "#FFFFFF",
            link: "#0078FF",
            action: "#FF620C",
            inactiveTabIcon: "#0E2F5A",
            error: "#F44235",
            inProgress: "#0078FF",
            complete: "#20B832",
            sourceBg: "#E4EBF1",
          },
        },
      },
      (error: any, result: any) => {
        setIsUploading(false);

        if (!error && result && result.event === "success") {
          console.log("Upload successful:", result.info);
          onUploadSuccess(result.info.secure_url);
        } else if (error) {
          console.error("Upload error:", error);
          onUploadError(error.message || "Upload failed. Please try again.");
        }

        // Reset widget
        widgetRef.current = null;
      }
    );

    // Open the widget
    widgetRef.current.open();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isUploading}
      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isUploading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Uploading...
        </>
      ) : (
        <>
          <Upload className="w-4 h-4" />
          {buttonText}
        </>
      )}
    </button>
  );
};

export default CloudinaryUploadWidget;
