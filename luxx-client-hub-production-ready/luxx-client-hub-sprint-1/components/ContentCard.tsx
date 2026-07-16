'use client';

import { useState } from 'react';
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  MessageCircle,
  PenLine,
  Send,
  Video,
} from 'lucide-react';

import {
  addContentCommentAction,
  approveContentAction,
  requestContentChangesAction,
} from '@/lib/actions/portal';

import { Badge } from './UI';
import { dateLabel } from '@/lib/utils';

type ContentAsset = {
  id: string;
  file_name: string;
  mime_type: string | null;
  storage_path: string;
  sort_order: number;
  signed_url?: string | null;
};

type ContentFeedback = {
  id: string;
  message: string;
  feedback_type: string;
  created_at: string;
  profiles?:
    | {
        full_name: string | null;
      }
    | {
        full_name: string | null;
      }[]
    | null;
};

type ContentCardItem = {
  id: string;
  client_id: string;
  title: string;
  content_type: string | null;
  caption: string | null;
  preview_url?: string | null;
  scheduled_for: string | null;
  status: string;
  content_assets?: ContentAsset[] | null;
  content_feedback?: ContentFeedback[] | null;
};

export function ContentCard({
  item,
  isAdmin,
}: {
  item: ContentCardItem;
  isAdmin: boolean;
}) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const assets = [...(item.content_assets || [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  const feedback = [...(item.content_feedback || [])].sort(
    (a, b) =>
      new Date(a.created_at).getTime() -
      new Date(b.created_at).getTime(),
  );

  const activeAsset = assets[activeSlide];

  const canReview =
    !isAdmin &&
    ['client_review', 'changes_requested'].includes(item.status);

  function previousSlide() {
    setActiveSlide((current) =>
      current === 0 ? assets.length - 1 : current - 1,
    );
  }

  function nextSlide() {
    setActiveSlide((current) =>
      current === assets.length - 1 ? 0 : current + 1,
    );
  }

  return (
    <article className="content-card" id={item.id}>
      <div className="approval-preview">
        {activeAsset?.signed_url ? (
          isVideoAsset(activeAsset) ? (
            <video
              src={activeAsset.signed_url}
              controls
              preload="metadata"
            />
          ) : (
            <img
              src={activeAsset.signed_url}
              alt={`${item.title} ${
                assets.length > 1
                  ? `slide ${activeSlide + 1}`
                  : ''
              }`}
            />
          )
        ) : item.preview_url ? (
          isVideoUrl(item.preview_url) ? (
            <video
              src={item.preview_url}
              controls
              preload="metadata"
            />
          ) : (
            <img src={item.preview_url} alt={item.title} />
          )
        ) : (
          <div className="approval-placeholder">
            {isVideoContent(item.content_type) ? (
              <Video size={34} />
            ) : (
              <ImageIcon size={34} />
            )}

            <strong>Luxx Content</strong>
          </div>
        )}

        {assets.length > 1 && (
          <>
            <button
              type="button"
              className="carousel-arrow carousel-arrow-left"
              onClick={previousSlide}
              aria-label="Previous slide"
            >
              <ChevronLeft size={19} />
            </button>

            <button
              type="button"
              className="carousel-arrow carousel-arrow-right"
              onClick={nextSlide}
              aria-label="Next slide"
            >
              <ChevronRight size={19} />
            </button>

            <div className="carousel-position">
              {activeSlide + 1} / {assets.length}
            </div>
          </>
        )}
      </div>

      <div className="content-body">
        <div className="content-top">
          <div>
            <p className="eyebrow">
              {item.content_type || 'POST'}
            </p>

            <h2>{item.title}</h2>
          </div>

          <Badge value={item.status} />
        </div>

        <p className="schedule">
          <Calendar size={16} />

          {item.scheduled_for
            ? dateLabel(item.scheduled_for)
            : 'Not scheduled'}
        </p>

        <div className="caption">
          <strong>Caption</strong>

          <p>{item.caption || 'Caption coming soon.'}</p>
        </div>

        {canReview && (
          <div className="approval-actions">
            <form action={approveContentAction}>
              <input
                type="hidden"
                name="content_item_id"
                value={item.id}
              />

              <input
                type="hidden"
                name="client_id"
                value={item.client_id}
              />

              <button
                type="submit"
                className="button primary"
              >
                <Check size={17} />
                Approve Content
              </button>
            </form>

            <button
              type="button"
              className="button secondary"
              onClick={() =>
                setShowEditForm((current) => !current)
              }
            >
              <PenLine size={17} />
              Request Changes
            </button>
          </div>
        )}

        {canReview && showEditForm && (
          <form
            action={requestContentChangesAction}
            className="feedback-form"
          >
            <input
              type="hidden"
              name="content_item_id"
              value={item.id}
            />

            <input
              type="hidden"
              name="client_id"
              value={item.client_id}
            />

            <label>
              <span>
                <MessageCircle size={16} />
                What would you like changed?
              </span>

              <textarea
                name="message"
                rows={5}
                required
              />
            </label>

            <button
              type="submit"
              className="button secondary"
            >
              <Send size={16} />
              Submit Edit Request
            </button>
          </form>
        )}

        <div className="feedback-section">
          <button
            type="button"
            className="feedback-toggle"
            onClick={() =>
              setShowComments((current) => !current)
            }
          >
            <MessageCircle size={16} />

            {feedback.length
              ? `${feedback.length} ${
                  feedback.length === 1
                    ? 'message'
                    : 'messages'
                }`
              : 'Start a conversation'}
          </button>

          {showComments && (
            <div className="feedback-panel">
              {feedback.length > 0 && (
                <div className="feedback-history">
                  {feedback.map((entry) => {
                    const author = Array.isArray(
                      entry.profiles,
                    )
                      ? entry.profiles[0]
                      : entry.profiles;

                    return (
                      <div
                        className="feedback-entry"
                        key={entry.id}
                      >
                        <div className="feedback-entry-top">
                          <strong>
                            {author?.full_name ||
                              'Luxx Client Hub'}
                          </strong>

                          <small>
                            {new Intl.DateTimeFormat(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              },
                            ).format(
                              new Date(entry.created_at),
                            )}
                          </small>
                        </div>

                        <p>{entry.message}</p>

                        {entry.feedback_type !==
                          'comment' && (
                          <Badge
                            value={entry.feedback_type}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <form
                action={addContentCommentAction}
                className="comment-form"
              >
                <input
                  type="hidden"
                  name="content_item_id"
                  value={item.id}
                />

                <input
                  type="hidden"
                  name="client_id"
                  value={item.client_id}
                />

                <textarea
                  name="message"
                  rows={3}
                  required
                  aria-label="Add a comment"
                />

                <button
                  type="submit"
                  className="button primary"
                >
                  <Send size={16} />
                  Add Comment
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function isVideoContent(contentType: string | null) {
  const type = contentType?.toLowerCase() || '';

  return ['reel', 'video', 'tiktok'].includes(type);
}

function isVideoAsset(asset: ContentAsset) {
  return (
    asset.mime_type?.startsWith('video/') ||
    isVideoUrl(asset.file_name)
  );
}

function isVideoUrl(url: string) {
  return /\.(mp4|mov|webm)(\?.*)?$/i.test(url);
}
