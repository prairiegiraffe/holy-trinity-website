import { useState } from "react";
import RichTextEditor from "../ui/RichTextEditor";
import ImageUpload from "../ui/ImageUpload";

interface EventFormProps {
  initialData?: {
    id?: number;
    title: string;
    description: string;
    event_date: string;
    event_time: string;
    end_date: string;
    end_time: string;
    location: string;
    image: string;
    status: "draft" | "published";
    recurring: "none" | "weekly" | "monthly" | "yearly";
    rsvp_link: string;
    more_info_link: string;
    meta_title: string;
    meta_description: string;
  };
  onSuccess?: (data: { id: number; slug: string }) => void;
}

export default function EventForm({ initialData, onSuccess }: EventFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    event_date: initialData?.event_date || "",
    event_time: initialData?.event_time || "",
    end_date: initialData?.end_date || "",
    end_time: initialData?.end_time || "",
    location: initialData?.location || "",
    image: initialData?.image || "",
    status: initialData?.status || "draft",
    recurring: initialData?.recurring || "none",
    rsvp_link: initialData?.rsvp_link || "",
    more_info_link: initialData?.more_info_link || "",
    meta_title: initialData?.meta_title || "",
    meta_description: initialData?.meta_description || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const url = initialData?.id
        ? `/api/events/${initialData.id}`
        : "/api/events";
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
          window.location.href = `/admin/events/${result.data.id}`;
        }
      } else {
        setError(result.error?.message || "Failed to save event");
      }
    } catch (err) {
      setError("An error occurred while saving");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (!confirm("Are you sure you want to delete this event?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/events/${initialData.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        window.location.href = "/admin/events";
      } else {
        setError(result.error?.message || "Failed to delete event");
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
              Event Title
            </label>
            <input
              type="text"
              id="title"
              className="form-input"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter event title"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="event_date">
                Event Date
              </label>
              <input
                type="date"
                id="event_date"
                className="form-input"
                value={formData.event_date}
                onChange={(e) =>
                  setFormData({ ...formData, event_date: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="event_time">
                Start Time
              </label>
              <input
                type="time"
                id="event_time"
                className="form-input"
                value={formData.event_time}
                onChange={(e) =>
                  setFormData({ ...formData, event_time: e.target.value })
                }
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="end_date">
                End Date (optional)
              </label>
              <input
                type="date"
                id="end_date"
                className="form-input"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="end_time">
                End Time
              </label>
              <input
                type="time"
                id="end_time"
                className="form-input"
                value={formData.end_time}
                onChange={(e) =>
                  setFormData({ ...formData, end_time: e.target.value })
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="location">
              Location
            </label>
            <input
              type="text"
              id="location"
              className="form-input"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="e.g., Parish Hall, Main Sanctuary"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <RichTextEditor
              content={formData.description}
              onChange={(description) =>
                setFormData({ ...formData, description })
              }
              placeholder="Describe the event..."
            />
          </div>

          <div className="form-section">
            <button
              type="button"
              className="section-toggle"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              Advanced Options {showAdvanced ? "▲" : "▼"}
            </button>

            {showAdvanced && (
              <div className="section-content">
                <div className="form-group">
                  <label className="form-label" htmlFor="rsvp_link">
                    RSVP Link
                  </label>
                  <input
                    type="url"
                    id="rsvp_link"
                    className="form-input"
                    value={formData.rsvp_link}
                    onChange={(e) =>
                      setFormData({ ...formData, rsvp_link: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="more_info_link">
                    More Info Link
                  </label>
                  <input
                    type="url"
                    id="more_info_link"
                    className="form-input"
                    value={formData.more_info_link}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        more_info_link: e.target.value,
                      })
                    }
                    placeholder="https://..."
                  />
                </div>

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
                    placeholder="Description for search engines"
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

            <div className="form-group">
              <label className="form-label" htmlFor="recurring">
                Recurring
              </label>
              <select
                id="recurring"
                className="form-select"
                value={formData.recurring}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    recurring: e.target.value as
                      | "none"
                      | "weekly"
                      | "monthly"
                      | "yearly",
                  })
                }
              >
                <option value="none">One-time Event</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
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
                    ? "Update Event"
                    : "Create Event"}
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
            <h3>Event Image</h3>
            <ImageUpload
              value={formData.image}
              onChange={(url) => setFormData({ ...formData, image: url })}
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

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
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
