"use client";

import { useEffect } from "react";

export default function TestUpload() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://upload-widget.cloudinary.com/global/all.js";
    script.async = true;
    script.onload = () => {
      console.log("Cloudinary loaded!");
      console.log("Cloud Name:", process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
      console.log(
        "Upload Preset:",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      );
    };
    document.body.appendChild(script);
  }, []);

  const testUpload = () => {
    if (window.cloudinary) {
      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
          uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
        },
        (error: any, result: any) => {
          if (!error && result.event === "success") {
            console.log("Upload success!", result.info);
            alert("Uploaded! URL: " + result.info.secure_url);
          }
        }
      );
      widget.open();
    }
  };

  return (
    <div className="p-10">
      <h1>Test Cloudinary Upload</h1>
      <button
        onClick={testUpload}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Test Upload
      </button>
      <div className="mt-4">
        <p>Cloud Name: {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}</p>
        <p>Upload Preset: {process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}</p>
      </div>
    </div>
  );
}
