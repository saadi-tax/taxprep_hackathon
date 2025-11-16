import { Upload } from "lucide-react";
import { useRef, useState } from "react";

import { useUploadDocument } from "../../lib/hooks/useDocuments";

export const DocumentUpload = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const uploadMutation = useUploadDocument();

  const handleFileSelect = async (file: File) => {
    if (file.type !== "application/pdf") {
      alert("Only PDF files are supported");
      return;
    }

    try {
      await uploadMutation.mutateAsync(file);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      // Note: The document will appear in the list with "pending" status
      // and will automatically update when processing completes
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload document. Please try again.");
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      className={`relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-slate-300 hover:border-primary/50 hover:bg-slate-50"
      } ${uploadMutation.isPending ? "opacity-50" : ""}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={uploadMutation.isPending}
      />
      <Upload
        className={`mx-auto mb-3 h-12 w-12 ${
          isDragging ? "text-primary" : "text-slate-400"
        }`}
      />
      <p className="text-sm font-medium text-slate-700">
        {uploadMutation.isPending
          ? "Uploading..."
          : isDragging
            ? "Drop PDF here"
            : "Click or drag PDF to upload"}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Supports W-2, 1099, 1098, and other tax forms
      </p>
      {uploadMutation.isError && (
        <p className="mt-2 text-xs text-red-600">
          Upload failed. Please try again.
        </p>
      )}
    </div>
  );
};

