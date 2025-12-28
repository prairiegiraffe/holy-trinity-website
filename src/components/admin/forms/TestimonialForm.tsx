import { useState } from 'react';
import type { Testimonial } from '@/types/cms';

interface TestimonialFormProps {
  testimonial?: Testimonial;
  onSuccess?: () => void;
}

const RATINGS = [
  { value: 'five', label: '5 Stars' },
  { value: 'four', label: '4 Stars' },
  { value: 'three', label: '3 Stars' },
  { value: 'two', label: '2 Stars' },
  { value: 'one', label: '1 Star' },
];

export default function TestimonialForm({ testimonial, onSuccess }: TestimonialFormProps) {
  const [formData, setFormData] = useState({
    author: testimonial?.author || '',
    organization: testimonial?.organization || '',
    rating: testimonial?.rating || 'five',
    content: testimonial?.content || '',
    is_active: testimonial?.is_active ?? true,
    sort_order: testimonial?.sort_order || 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isEditing = !!testimonial?.id;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const url = isEditing ? `/api/testimonials/${testimonial.id}` : '/api/testimonials';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save testimonial');
      }

      setSuccess(isEditing ? 'Testimonial updated!' : 'Testimonial created!');

      if (onSuccess) {
        onSuccess();
      } else if (!isEditing) {
        setTimeout(() => {
          window.location.href = '/admin/testimonials';
        }, 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!testimonial?.id || !confirm('Are you sure you want to delete this testimonial?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/testimonials/${testimonial.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete testimonial');
      }

      window.location.href = '/admin/testimonials';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      {error && <div className="form-error">{error}</div>}
      {success && <div className="form-success">{success}</div>}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="author">Author Name *</label>
          <input
            type="text"
            id="author"
            name="author"
            value={formData.author}
            onChange={handleChange}
            required
            placeholder="e.g., Jane Doe"
          />
        </div>

        <div className="form-group">
          <label htmlFor="organization">Organization (optional)</label>
          <input
            type="text"
            id="organization"
            name="organization"
            value={formData.organization}
            onChange={handleChange}
            placeholder="e.g., Parish Member"
          />
        </div>
      </div>

      <div className="form-row three-col">
        <div className="form-group">
          <label htmlFor="rating">Rating</label>
          <select
            id="rating"
            name="rating"
            value={formData.rating}
            onChange={handleChange}
          >
            {RATINGS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="sort_order">Sort Order</label>
          <input
            type="number"
            id="sort_order"
            name="sort_order"
            value={formData.sort_order}
            onChange={handleChange}
            min="0"
          />
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
            />
            Active (visible on site)
          </label>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="content">Testimonial Content *</label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          rows={5}
          required
          placeholder="What they said about the church..."
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : isEditing ? 'Update Testimonial' : 'Create Testimonial'}
        </button>

        <a href="/admin/testimonials" className="btn btn-secondary">
          Cancel
        </a>

        {isEditing && (
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

      <style>{`
        .admin-form {
          max-width: 800px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .form-row.three-col {
          grid-template-columns: 1fr 120px 200px;
        }

        @media (max-width: 768px) {
          .form-row,
          .form-row.three-col {
            grid-template-columns: 1fr;
          }
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--color-text);
        }

        .checkbox-group {
          display: flex;
          align-items: center;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          cursor: pointer;
        }

        .checkbox-group input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--color-border);
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px rgba(var(--color-accent-rgb), 0.1);
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

        .btn-danger {
          background: #dc2626;
          color: white;
          margin-left: auto;
        }

        .btn-danger:hover:not(:disabled) {
          background: #b91c1c;
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
