import { useState } from 'react';
import type { Member } from '@/types/cms';

interface MemberFormProps {
  member?: Member;
  onSuccess?: () => void;
}

const GROUP_TYPES = [
  { value: 'vestry', label: 'Vestry' },
  { value: 'music-team', label: 'Music Team' },
  { value: 'endowment', label: 'Endowment Committee' },
  { value: 'clergy', label: 'Clergy' },
];

export default function MemberForm({ member, onSuccess }: MemberFormProps) {
  const [formData, setFormData] = useState({
    group_type: member?.group_type || 'vestry',
    name: member?.name || '',
    title: member?.title || '',
    term: member?.term || '',
    image: member?.image || '',
    bio: member?.bio || '',
    sort_order: member?.sort_order || 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isEditing = !!member?.id;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const url = isEditing ? `/api/members/${member.id}` : '/api/members';
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
        throw new Error(result.error || 'Failed to save member');
      }

      setSuccess(isEditing ? 'Member updated successfully!' : 'Member created successfully!');

      if (onSuccess) {
        onSuccess();
      } else if (!isEditing) {
        // Redirect to members list after creating
        setTimeout(() => {
          window.location.href = '/admin/members';
        }, 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!member?.id || !confirm('Are you sure you want to delete this member?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/members/${member.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete member');
      }

      window.location.href = '/admin/members';
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
          <label htmlFor="group_type">Group *</label>
          <select
            id="group_type"
            name="group_type"
            value={formData.group_type}
            onChange={handleChange}
            required
          >
            {GROUP_TYPES.map((group) => (
              <option key={group.value} value={group.value}>
                {group.label}
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
          <small>Lower numbers appear first</small>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="name">Name *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="e.g., John Smith"
        />
      </div>

      <div className="form-group">
        <label htmlFor="title">Title / Position *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="e.g., Senior Warden, Organist"
        />
      </div>

      <div className="form-group">
        <label htmlFor="term">Term (optional)</label>
        <input
          type="text"
          id="term"
          name="term"
          value={formData.term}
          onChange={handleChange}
          placeholder="e.g., 2024-2027"
        />
      </div>

      <div className="form-group">
        <label htmlFor="image">Photo URL (optional)</label>
        <input
          type="url"
          id="image"
          name="image"
          value={formData.image}
          onChange={handleChange}
          placeholder="https://..."
        />
        {formData.image && (
          <div className="image-preview">
            <img src={formData.image} alt="Preview" />
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="bio">Bio (optional)</label>
        <textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          rows={4}
          placeholder="Brief biography..."
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : isEditing ? 'Update Member' : 'Create Member'}
        </button>

        <a href="/admin/members" className="btn btn-secondary">
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
          grid-template-columns: 1fr 150px;
          gap: 1.5rem;
        }

        @media (max-width: 640px) {
          .form-row {
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

        .form-group small {
          display: block;
          margin-top: 0.25rem;
          color: var(--color-text-secondary);
          font-size: 0.875rem;
        }

        .image-preview {
          margin-top: 0.75rem;
          max-width: 150px;
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
