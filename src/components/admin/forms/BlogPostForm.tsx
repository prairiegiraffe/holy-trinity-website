import { useState } from "react";
import RichTextEditor from "../ui/RichTextEditor";
import ImageUpload from "../ui/ImageUpload";

interface BlogPostFormProps {
  initialData?: {
    id?: number;
    title: string;
    content: string;
    excerpt: string;
    featured_image: string;
    status: "draft" | "published";
    meta_title: string;
    meta_description: string;
  };
  onSuccess?: (data: { id: number; slug: string }) => void;
}

export default function BlogPostForm({
  initialData,
  onSuccess,
}: BlogPostFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    content: initialData?.content || "",
    excerpt: initialData?.excerpt || "",
    featured_image: initialData?.featured_image || "",
    status: initialData?.status || "draft",
    meta_title: initialData?.meta_title || "",
    meta_description: initialData?.meta_description || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSeoFields, setShowSeoFields] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const url = initialData?.id
        ? `/api/blog/${initialData.id}`
        : "/api/blog";
      const method = initialData?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        if (onSuccess) {
          onSuccess(result.data);
        } else {
          window.location.href = `/admin/blog/${result.data.id}`;
        }
      } else {
        setError(result.error?.message || "Failed to save post");
      }
    } catch (err) {
      setError("An error occurred while saving");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (!confirm("Are you sure you want to delete this post?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/blog/${initialData.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        window.location.href = "/admin/blog";
      } else {
        setError(result.error?.message || "Failed to delete post");
      }
    } catch (err) {
      setError("An error occurred while deleting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}

      <div className="form-layout">
        <div className="form-main">
          <div className="form-group">
            <label className="form-label" htmlFor="title">
              Title
            </label>
            <input
              type="text"
              id="title"
              className="form-input"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter post title"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Content</label>
            <RichTextEditor
              content={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
              placeholder="Write your blog post..."
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="excerpt">
              Excerpt
            </label>
            <textarea
              id="excerpt"
              className="form-textarea"
              value={formData.excerpt}
              onChange={(e) =>
                setFormData({ ...formData, excerpt: e.target.value })
              }
              placeholder="Brief summary for listings and previews"
              rows={3}
            />
          </div>

          <div className="form-section">
            <button
              type="button"
              className="section-toggle"
              onClick={() => setShowSeoFields(!showSeoFields)}
            >
              SEO Settings {showSeoFields ? "▲" : "▼"}
            </button>

            {showSeoFields && (
              <div className="section-content">
                <div className="form-group">
                  <label className="form-label" htmlFor="meta_title">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    id="meta_title"
                    className="form-input"
                    value={formData.meta_title}
                    onChange={(e) =>
                      setFormData({ ...formData, meta_title: e.target.value })
                    }
                    placeholder="Custom title for search engines"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="meta_description">
                    Meta Description
                  </label>
                  <textarea
                    id="meta_description"
                    className="form-textarea"
                    value={formData.meta_description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        meta_description: e.target.value,
                      })
                    }
                    placeholder="Description for search engine results"
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="form-sidebar">
          <div className="sidebar-section">
            <h3>Publish</h3>
            <div className="form-group">
              <label className="form-label" htmlFor="status">
                Status
              </label>
              <select
                id="status"
                className="form-select"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as "draft" | "published",
                  })
                }
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="button-group">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : initialData?.id
                    ? "Update Post"
                    : "Create Post"}
              </button>

              {initialData?.id && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  Delete
                </button>
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Featured Image</h3>
            <ImageUpload
              value={formData.featured_image}
              onChange={(url) =>
                setFormData({ ...formData, featured_image: url })
              }
              label=""
            />
          </div>
        </div>
      </div>

      <style>{`
        .form-error {
          background: #fed7d7;
          color: #c53030;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1.5rem;
          border: 1px solid #fc8181;
        }

        .form-layout {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 1.5rem;
        }

        @media (max-width: 1024px) {
          .form-layout {
            grid-template-columns: 1fr;
          }
        }

        .form-main {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .sidebar-section {
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          padding: 1.25rem;
        }

        .sidebar-section h3 {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1a202c;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .button-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .form-section {
          background: #f7fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .section-toggle {
          width: 100%;
          padding: 1rem;
          background: none;
          border: none;
          text-align: left;
          font-weight: 500;
          color: #4a5568;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .section-toggle:hover {
          color: #2d3748;
        }

        .section-content {
          padding: 0 1rem 1rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #4a5568;
          margin-bottom: 0.5rem;
        }

        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.9375rem;
          transition: all 0.2s;
          background: white;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #4299e1;
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
        }

        .form-textarea {
          min-height: 80px;
          resize: vertical;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          border-radius: 6px;
          font-size: 0.9375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          text-decoration: none;
        }

        .btn-primary {
          background: #2c5282;
          color: white;
        }

        .btn-primary:hover {
          background: #1a365d;
        }

        .btn-danger {
          background: #c53030;
          color: white;
        }

        .btn-danger:hover {
          background: #9b2c2c;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </form>
  );
}
