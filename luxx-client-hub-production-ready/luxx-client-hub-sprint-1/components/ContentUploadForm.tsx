'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, X } from 'lucide-react';

import { createClient } from '@/lib/supabase/browser';

type ContentType =
  | 'Reel'
  | 'Carousel'
  | 'Photo'
  | 'Story'
  | 'TikTok'
  | 'Video';

type ContentStatus =
  | 'draft'
  | 'internal_review'
  | 'client_review'
  | 'changes_requested'
  | 'approved'
  | 'scheduled'
  | 'posted';

type SelectedFile = {
  file: File;
  previewUrl: string;
};

export default function ContentUploadForm({
  clientId,
}: {
  clientId: string;
}) {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [contentType, setContentType] =
    useState<ContentType>('Reel');
  const [caption, setCaption] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [status, setStatus] =
    useState<ContentStatus>('draft');
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState('');

  const acceptedFiles = useMemo(() => {
    if (
      contentType === 'Reel' ||
      contentType === 'Video' ||
      contentType === 'TikTok'
    ) {
      return 'video/mp4,video/quicktime,video/webm';
    }

    return 'image/jpeg,image/png,image/webp';
  }, [contentType]);

  function handleFiles(selectedFiles: FileList | null) {
    if (!selectedFiles) return;

    files.forEach((item) =>
      URL.revokeObjectURL(item.previewUrl),
    );

    const nextFiles = Array.from(selectedFiles).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setFiles(nextFiles);
    setError('');
  }

  function removeFile(index: number) {
    setFiles((current) => {
      const target = current[index];

      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return current.filter((_, fileIndex) => fileIndex !== index);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setProgressText('');

    if (!title.trim()) {
      setError('Enter a content title.');
      return;
    }

    if (!files.length) {
      setError('Choose at least one file.');
      return;
    }

    if (
      contentType !== 'Carousel' &&
      files.length > 1
    ) {
      setError(
        'Only carousel posts can contain multiple files.',
      );
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();

      setProgressText('Creating content item...');

      const { data: contentItem, error: contentError } =
        await supabase
          .from('content_items')
          .insert({
            client_id: clientId,
            title: title.trim(),
            content_type: contentType,
            caption: caption.trim() || null,
            scheduled_for: scheduledFor || null,
            status,
          })
          .select('id')
          .single();

      if (contentError || !contentItem) {
        throw new Error(
          contentError?.message ||
            'Unable to create the content item.',
        );
      }

      const uploadedAssetIds: string[] = [];

      for (let index = 0; index < files.length; index += 1) {
        const selected = files[index];
        const safeFileName = selected.file.name
          .toLowerCase()
          .replace(/[^a-z0-9._-]+/g, '-');

        const storagePath = `${clientId}/${contentItem.id}/${String(
          index + 1,
        ).padStart(2, '0')}-${safeFileName}`;

        setProgressText(
          `Uploading file ${index + 1} of ${files.length}...`,
        );

        const { error: uploadError } = await supabase.storage
          .from('content-assets')
          .upload(storagePath, selected.file, {
            cacheControl: '3600',
            upsert: false,
            contentType: selected.file.type,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { data: asset, error: assetError } =
          await supabase
            .from('content_assets')
            .insert({
              content_item_id: contentItem.id,
              client_id: clientId,
              storage_path: storagePath,
              file_name: selected.file.name,
              mime_type: selected.file.type,
              file_size: selected.file.size,
              sort_order: index,
            })
            .select('id')
            .single();

        if (assetError || !asset) {
          throw new Error(
            assetError?.message ||
              'Unable to save the uploaded file.',
          );
        }

        uploadedAssetIds.push(asset.id);
      }

      setProgressText('Upload complete.');

      files.forEach((item) =>
        URL.revokeObjectURL(item.previewUrl),
      );

      setTitle('');
      setCaption('');
      setScheduledFor('');
      setStatus('draft');
      setFiles([]);

      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to upload content.',
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <p className="eyebrow">NEW CONTENT</p>
          <h2>Upload Content</h2>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="admin-form"
      >
        {error && (
          <div className="alert error">{error}</div>
        )}

        {progressText && (
          <div className="alert success">
            {progressText}
          </div>
        )}

        <label>
          Content title
          <input
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            required
          />
        </label>

        <label>
          Content type
          <select
            value={contentType}
            onChange={(event) => {
              const nextType =
                event.target.value as ContentType;

              setContentType(nextType);
              setFiles([]);
            }}
          >
            <option value="Reel">Reel</option>
            <option value="Carousel">Carousel</option>
            <option value="Photo">Photo</option>
            <option value="Story">Story</option>
            <option value="TikTok">TikTok</option>
            <option value="Video">Video</option>
          </select>
        </label>

        <label>
          Caption
          <textarea
            value={caption}
            onChange={(event) =>
              setCaption(event.target.value)
            }
            rows={8}
          />
        </label>

        <label>
          Scheduled date and time
          <input
            value={scheduledFor}
            onChange={(event) =>
              setScheduledFor(event.target.value)
            }
            type="datetime-local"
          />
        </label>

        <label>
          Status
          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value as ContentStatus,
              )
            }
          >
            <option value="draft">Draft</option>
            <option value="internal_review">
              Internal review
            </option>
            <option value="client_review">
              Client review
            </option>
            <option value="changes_requested">
              Changes requested
            </option>
            <option value="approved">Approved</option>
            <option value="scheduled">Scheduled</option>
            <option value="posted">Posted</option>
          </select>
        </label>

        <label className="upload-field">
          <span>
            {contentType === 'Carousel'
              ? 'Upload carousel images'
              : 'Upload file'}
          </span>

          <div className="upload-dropzone">
            <UploadCloud size={24} />

            <strong>Choose files</strong>

            <small>
              {contentType === 'Carousel'
                ? 'Select multiple images in the order they should appear.'
                : 'Select one image or video.'}
            </small>

            <input
              type="file"
              accept={acceptedFiles}
              multiple={contentType === 'Carousel'}
              onChange={(event) =>
                handleFiles(event.target.files)
              }
              required
            />
          </div>
        </label>

        {files.length > 0 && (
          <div className="upload-preview-grid">
            {files.map((selected, index) => (
              <div
                className="upload-preview"
                key={`${selected.file.name}-${index}`}
              >
                {selected.file.type.startsWith('video/') ? (
                  <video
                    src={selected.previewUrl}
                    controls
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={selected.previewUrl}
                    alt={selected.file.name}
                  />
                )}

                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  aria-label={`Remove ${selected.file.name}`}
                >
                  <X size={15} />
                </button>

                <small>
                  {contentType === 'Carousel'
                    ? `Slide ${index + 1}`
                    : selected.file.name}
                </small>
              </div>
            ))}
          </div>
        )}

        <button
          className="button primary"
          type="submit"
          disabled={uploading}
        >
          {uploading
            ? 'Uploading...'
            : 'Create Content'}
        </button>
      </form>
    </div>
  );
}
