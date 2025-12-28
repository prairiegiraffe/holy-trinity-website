import { useState, useEffect } from 'react';
import RichTextEditor from '../ui/RichTextEditor';
import type { PageContent } from '@/types/cms';

interface PageEditorProps {
  pageKey: string;
  pageTitle: string;
  initialContent?: PageContent;
  contentFields?: {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'richtext' | 'image';
    required?: boolean;
  }[];
  onSuccess?: () => void;
}

export default function PageEditor({
  pageKey,
  pageTitle,
  initialContent,
  contentFields = [{ key: 'body', label: 'Content', type: 'richtext' }],
  onSuccess,
}: PageEditorProps) {
  const [contentJson, setContentJson] = useState<Record<string, string>>(() => {
    if (initialContent?.content_json) {
      if (typeof initialContent.content_json === 'string') {
        try {
          return JSON.parse(initialContent.content_json);
        } catch {
          return {};
        }
      }
      return initialContent.content_json as Record<string, string>;
    }
    return {};
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFieldChange = (key: string, value: string) => {
    setContentJson((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/pages/${pageKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_json: contentJson,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save page');
      }

      setSuccess('Page updated successfully!');

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="page-editor">
      {error && <div className="form-error">{error}</div>}
      {success && <div className="form-success">{success}</div>}

      <div className="editor-header">
        <h2>{pageTitle}</h2>
        <span className="page-key">Key: {pageKey}</span>
      </div>

      <div className="editor-fields">
        {contentFields.map((field) => (
          <div key={field.key} className="form-group">
            <label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>

            {field.type === 'text' && (
              <input
                type="text"
                id={field.key}
                value={contentJson[field.key] || ''}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                required={field.required}
              />
            )}

            {field.type === 'textarea' && (
              <textarea
                id={field.key}
                value={contentJson[field.key] || ''}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                rows={4}
                required={field.required}
              />
            )}

            {field.type === 'richtext' && (
              <RichTextEditor
                content={contentJson[field.key] || ''}
                onChange={(value) => handleFieldChange(field.key, value)}
              />
            )}

            {field.type === 'image' && (
              <div className="image-field">
                <input
                  type="url"
                  id={field.key}
                  value={contentJson[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder="https://..."
                  required={field.required}
                />
                {contentJson[field.key] && (
                  <div className="image-preview">
                    <img src={contentJson[field.key]} alt="Preview" />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>

        <a href="/admin/pages" className="btn btn-secondary">
          Back to Pages
        </a>
      </div>

      <style>{`
        .page-editor {
          max-width: 1000px;
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--color-border);
        }

        .editor-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-text);
          margin: 0;
        }

        .page-key {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          font-family: monospace;
          background: var(--color-background);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }

        .editor-fields {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          margin-bottom: 0;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--color-text);
        }

        .required {
          color: #dc2626;
          margin-left: 0.25rem;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--color-border);
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px rgba(var(--color-accent-rgb), 0.1);
        }

        .image-field {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .image-preview {
          max-width: 300px;
        }

        .image-preview img {
          width: 100%;
          border-radius: 8px;
          border: 1px solid var(--color-border);
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--color-border);
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-primary {
          background: var(--color-accent);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--color-primary);
        }

        .btn-secondary {
          background: var(--color-surface);
          color: var(--color-text);
          border: 1px solid var(--color-border);
        }

        .btn-secondary:hover {
          background: var(--color-background);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-error {
          background: #fef2f2;
          color: #dc2626;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1.5rem;
          border: 1px solid #fecaca;
        }

        .form-success {
          background: #f0fdf4;
          color: #16a34a;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1.5rem;
          border: 1px solid #bbf7d0;
        }
      `}</style>
    </form>
  );
}
