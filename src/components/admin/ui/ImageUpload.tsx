import { useState, useRef } from "react";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function ImageUpload({
  value,
  onChange,
  label = "Image",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        onChange(data.data.url);
      } else {
        setError(data.error?.message || "Upload failed");
      }
    } catch (err) {
      setError("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleUpload(file);
    } else {
      setError("Please drop an image file");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleRemove = () => {
    onChange("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="image-upload">
      <label className="upload-label">{label}</label>

      {value ? (
        <div className="preview-container">
          <img src={value} alt="Preview" className="preview-image" />
          <div className="preview-actions">
            <button
              type="button"
              className="preview-btn change"
              onClick={() => inputRef.current?.click()}
            >
              Change
            </button>
            <button
              type="button"
              className="preview-btn remove"
              onClick={handleRemove}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`upload-zone ${dragOver ? "drag-over" : ""} ${uploading ? "uploading" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <div className="upload-loading">
              <div className="spinner"></div>
              <span>Uploading...</span>
            </div>
          ) : (
            <>
              <div className="upload-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
              </div>
              <p className="upload-text">
                <span className="upload-link">Click to upload</span> or drag and
                drop
              </p>
              <p className="upload-hint">PNG, JPG, GIF, WebP up to 5MB</p>
            </>
          )}
        </div>
      )}

      {error && <p className="upload-error">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="upload-input"
      />

      <style>{`
        .image-upload {
          margin-bottom: 1.25rem;
        }

        .upload-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #4a5568;
          margin-bottom: 0.5rem;
        }

        .upload-zone {
          border: 2px dashed #e2e8f0;
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: #fafafa;
        }

        .upload-zone:hover {
          border-color: #4299e1;
          background: #f0f7ff;
        }

        .upload-zone.drag-over {
          border-color: #4299e1;
          background: #ebf8ff;
        }

        .upload-zone.uploading {
          pointer-events: none;
          opacity: 0.7;
        }

        .upload-icon {
          color: #a0aec0;
          margin-bottom: 0.75rem;
        }

        .upload-text {
          font-size: 0.9375rem;
          color: #4a5568;
          margin-bottom: 0.25rem;
        }

        .upload-link {
          color: #2c5282;
          font-weight: 500;
        }

        .upload-hint {
          font-size: 0.75rem;
          color: #a0aec0;
        }

        .upload-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          color: #4a5568;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e2e8f0;
          border-top-color: #4299e1;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .upload-input {
          display: none;
        }

        .upload-error {
          color: #c53030;
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }

        .preview-container {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }

        .preview-image {
          display: block;
          width: 100%;
          max-height: 300px;
          object-fit: cover;
        }

        .preview-actions {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          gap: 0.5rem;
          padding: 0.75rem;
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
        }

        .preview-btn {
          flex: 1;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .preview-btn.change {
          background: white;
          color: #2d3748;
        }

        .preview-btn.change:hover {
          background: #f7fafc;
        }

        .preview-btn.remove {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .preview-btn.remove:hover {
          background: rgba(197, 48, 48, 0.9);
        }
      `}</style>
    </div>
  );
}
