import React, { useState } from 'react';
import {
  GripVertical,
  MoreHorizontal,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit2,
  X,
} from 'lucide-react';
import { ItineraryResult, DayPlan, Stop } from '../types/result';

interface ItineraryViewProps {
  itinerary: ItineraryResult;
  onUpdateItinerary: (updated: ItineraryResult) => void;
  onEditTrip?: () => void;
  onRegenerate?: () => void;
}

export const ItineraryView: React.FC<ItineraryViewProps> = ({
  itinerary,
  onUpdateItinerary,
  onEditTrip,
  onRegenerate,
}) => {
  // Active selected day tab index (0 to days.length - 1)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Set of expanded stop IDs
  const [expandedStopIds, setExpandedStopIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    // Expand the first stop of the first day by default
    if (itinerary.days[0]?.stops[0]) {
      initial[itinerary.days[0].stops[0].id] = true;
    }
    return initial;
  });

  // Context menu open state: stopId -> boolean
  const [activeMenuStopId, setActiveMenuStopId] = useState<string | null>(null);

  // Add / Edit Stop drawer state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStop, setEditingStop] = useState<Stop | null>(null);

  // Form input state
  const [formName, setFormName] = useState('');
  const [formTime, setFormTime] = useState('09:00');
  const [formDuration, setFormDuration] = useState('1h 30m');
  const [formCategory, setFormCategory] = useState<'Cultural' | 'Food' | 'Sightseeing' | string>('Cultural');
  const [formDescription, setFormDescription] = useState('');
  const [formLocation, setFormLocation] = useState('');

  // Drag and drop state
  const [draggedStopIndex, setDraggedStopIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Active day object
  const activeDay: DayPlan | undefined = itinerary.days[selectedDayIndex] || itinerary.days[0];

  // Derive trip title and summary for the workspace header (Slide 02)
  const tripTitle = itinerary.title || (activeDay?.title ? `${activeDay.title.split('&')[0].trim()} Adventure` : 'Japan Adventure');
  
  // Extract distinct cities across days
  const cities = Array.from(
    new Set(
      itinerary.days
        .map((d) => d.city || d.title.split(' ')[0])
        .filter(Boolean)
    )
  );
  const citiesSummary = cities.length > 0 ? cities.join(' → ') : 'Tokyo → Kyoto → Osaka';
  const totalDays = itinerary.days.length;
  const tripSubtitle = itinerary.summary || `${citiesSummary} · ${totalDays} days · ${Math.max(cities.length, 1)} cities`;

  // Toggle card expansion
  const toggleExpand = (stopId: string) => {
    setExpandedStopIds((prev) => ({
      ...prev,
      [stopId]: !prev[stopId],
    }));
  };

  // Reordering helpers
  const moveStop = (dayNum: number, fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= (activeDay?.stops.length || 0)) return;

    const updatedDays = itinerary.days.map((day) => {
      if (day.day !== dayNum) return day;
      const newStops = [...day.stops];
      const [moved] = newStops.splice(fromIndex, 1);
      newStops.splice(toIndex, 0, moved);
      return { ...day, stops: newStops };
    });

    onUpdateItinerary({ ...itinerary, days: updatedDays });
  };

  // Delete stop helper
  const deleteStop = (dayNum: number, stopId: string) => {
    const updatedDays = itinerary.days.map((day) => {
      if (day.day !== dayNum) return day;
      return {
        ...day,
        stops: day.stops.filter((s) => s.id !== stopId),
      };
    });
    onUpdateItinerary({ ...itinerary, days: updatedDays });
    setActiveMenuStopId(null);
  };

  // Open Form to Add Stop
  const handleOpenAddForm = () => {
    setEditingStop(null);
    setFormName('');
    setFormTime('14:00');
    setFormDuration('1h 30m');
    setFormCategory('Cultural');
    setFormDescription('');
    setFormLocation(activeDay?.city || 'Local Area');
    setIsFormOpen(true);
  };

  // Open Form to Edit Stop
  const handleOpenEditForm = (stop: Stop) => {
    setEditingStop(stop);
    setFormName(stop.name);
    setFormTime(stop.time);
    setFormDuration(stop.duration || '1h');
    setFormCategory(stop.category || 'Cultural');
    setFormDescription(stop.description || '');
    setFormLocation(stop.location || '');
    setIsFormOpen(true);
    setActiveMenuStopId(null);
  };

  // Submit Add or Edit Stop Form
  const handleSaveStop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !activeDay) return;

    if (editingStop) {
      // Edit existing stop
      const updatedDays = itinerary.days.map((day) => {
        if (day.day !== activeDay.day) return day;
        return {
          ...day,
          stops: day.stops.map((s) =>
            s.id === editingStop.id
              ? {
                  ...s,
                  name: formName.trim(),
                  time: formTime.trim(),
                  duration: formDuration.trim(),
                  category: formCategory,
                  description: formDescription.trim(),
                  location: formLocation.trim() || s.location,
                }
              : s
          ),
        };
      });
      onUpdateItinerary({ ...itinerary, days: updatedDays });
    } else {
      // Create new stop
      const newStop: Stop = {
        id: `stop-${Date.now()}`,
        name: formName.trim(),
        time: formTime.trim() || '12:00',
        duration: formDuration.trim() || '1h',
        category: formCategory,
        description: formDescription.trim() || `Explore ${formName.trim()}`,
        location: formLocation.trim() || activeDay.city || 'Central Area',
      };

      const updatedDays = itinerary.days.map((day) => {
        if (day.day !== activeDay.day) return day;
        return {
          ...day,
          stops: [...day.stops, newStop],
        };
      });
      onUpdateItinerary({ ...itinerary, days: updatedDays });
    }

    setIsFormOpen(false);
    setEditingStop(null);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedStopIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent or custom drag image
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedStopIndex !== null && draggedStopIndex !== targetIndex && activeDay) {
      moveStop(activeDay.day, draggedStopIndex, targetIndex);
    }
    setDraggedStopIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedStopIndex(null);
    setDragOverIndex(null);
  };

  // Helper for category badge styling
  const getCategoryClass = (category?: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('food') || cat.includes('culinary') || cat.includes('dining')) return 'food';
    if (cat.includes('sight') || cat.includes('landmark')) return 'sightseeing';
    if (cat.includes('nature') || cat.includes('park') || cat.includes('garden')) return 'nature';
    return 'cultural';
  };

  return (
    <div className="workspace-container">
      {/* Browser Outer Frame (Slide 02) */}
      <div className="workspace-browser-frame">
        <div className="browser-header-dots">
          <span className="browser-dot" />
          <span className="browser-dot" />
          <span className="browser-dot" />
        </div>

        <div className="workspace-inner-content">
          {/* Trip Header (Slide 02) */}
          <div className="trip-header-row">
            <div>
              <h2 className="trip-title">{tripTitle}</h2>
              <p className="trip-subtitle">{tripSubtitle}</p>
            </div>

            <div className="trip-header-actions">
              {onEditTrip && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onEditTrip}
                  id="edit-trip-button"
                >
                  Edit trip
                </button>
              )}
              {onRegenerate && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onRegenerate}
                  id="regenerate-trip-button"
                >
                  Regenerate
                </button>
              )}
            </div>
          </div>

          {/* Day Selector Tabs (Slide 02) */}
          <div className="day-tabs-wrapper" role="tablist" aria-label="Day selection">
            {itinerary.days.map((day, idx) => {
              const isActive = idx === selectedDayIndex;
              const dayPillTag = `DAY 0${day.day}`.slice(-6);
              // Extract or guess city name
              const cityName =
                day.city ||
                day.title.replace(/day\s*\d+[:\-]?/i, '').split('—')[0].split('-')[0].trim().split(' ')[0] ||
                'Tokyo';

              return (
                <button
                  key={day.day}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`day-tab-pill ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedDayIndex(idx);
                    setActiveMenuStopId(null);
                  }}
                >
                  <span className="day-tab-tag">{dayPillTag}</span>
                  <span className="day-tab-city">{cityName}</span>
                </button>
              );
            })}
          </div>

          {/* Main Grid: Stops Timeline on Left, Add/Edit Stop Drawer on Right (Slide 07) */}
          <div className={`workspace-grid ${isFormOpen ? 'with-drawer' : ''}`}>
            {/* Timeline Stops Column */}
            <div className="stops-list" role="list">
              {activeDay && activeDay.stops.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-muted)' }}>
                  No stops scheduled for Day {activeDay.day}. Click "+ Add stop" below to add one!
                </div>
              ) : (
                activeDay?.stops.map((stop, index) => {
                  const isExpanded = Boolean(expandedStopIds[stop.id]);
                  const isDragging = draggedStopIndex === index;
                  const isDropTarget = dragOverIndex === index && draggedStopIndex !== null && draggedStopIndex !== index;
                  const categoryClass = getCategoryClass(stop.category);
                  const displayDuration = stop.duration || (index === 0 ? '1h 30m' : '1h');
                  const displayLocation = stop.location || (stop.name.includes('Temple') ? 'Asakusa, Tokyo' : 'Central Tokyo');

                  return (
                    <div
                      key={stop.id}
                      className={`stop-card ${isDragging ? 'is-dragging' : ''} ${
                        isDropTarget ? (index < (draggedStopIndex || 0) ? 'drop-target-above' : 'drop-target-below') : ''
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      role="listitem"
                    >
                      {/* Collapsed Top Header (Slide 02, 06) */}
                      <div className="stop-card-main-row">
                        <div
                          className="stop-card-left"
                          onClick={() => toggleExpand(stop.id)}
                          role="button"
                          tabIndex={0}
                          aria-expanded={isExpanded}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              toggleExpand(stop.id);
                            }
                          }}
                        >
                          <span
                            className="drag-handle"
                            title="Drag to reorder stop"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <GripVertical size={16} />
                          </span>

                          <span className="stop-time">{stop.time}</span>

                          <div className="stop-title-wrap">
                            <span className="stop-title">{stop.name}</span>
                            <span className={`category-badge ${categoryClass}`}>
                              {stop.category || 'Cultural'}
                            </span>
                          </div>

                          <span className="stop-duration">{displayDuration}</span>
                        </div>

                        {/* Stop Action Context Menu */}
                        <div className="stop-card-actions">
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() =>
                              setActiveMenuStopId((prev) => (prev === stop.id ? null : stop.id))
                            }
                            title="More options"
                            aria-label="Stop options"
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          {activeMenuStopId === stop.id && (
                            <div className="context-menu-popover">
                              <button
                                type="button"
                                className="context-menu-item"
                                onClick={() => handleOpenEditForm(stop)}
                              >
                                <Edit2 size={13} />
                                <span>Edit stop</span>
                              </button>
                              <button
                                type="button"
                                className="context-menu-item"
                                disabled={index === 0}
                                onClick={() => {
                                  moveStop(activeDay.day, index, index - 1);
                                  setActiveMenuStopId(null);
                                }}
                              >
                                <ArrowUp size={13} />
                                <span>Move up</span>
                              </button>
                              <button
                                type="button"
                                className="context-menu-item"
                                disabled={index === activeDay.stops.length - 1}
                                onClick={() => {
                                  moveStop(activeDay.day, index, index + 1);
                                  setActiveMenuStopId(null);
                                }}
                              >
                                <ArrowDown size={13} />
                                <span>Move down</span>
                              </button>
                              <button
                                type="button"
                                className="context-menu-item danger"
                                onClick={() => deleteStop(activeDay.day, stop.id)}
                              >
                                <Trash2 size={13} />
                                <span>Delete stop</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expanded View with Description & Metadata (Slide 06) */}
                      {isExpanded && (
                        <div className="stop-card-expanded-content">
                          <p className="stop-description-text">
                            {stop.description || `Explore ${stop.name} and experience the local surroundings.`}
                          </p>

                          <div className="stop-expanded-divider" />

                          <div className="stop-meta-list">
                            <div className="stop-meta-row">
                              <span className="stop-meta-label">Location —</span>
                              <span>{displayLocation}</span>
                            </div>
                            <div className="stop-meta-row">
                              <span className="stop-meta-label">Duration —</span>
                              <span>{displayDuration}</span>
                            </div>
                            <div className="stop-meta-row">
                              <span className="stop-meta-label">Category —</span>
                              <span>{stop.category || 'Cultural'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Add Stop Button (Slide 07) */}
              {!isFormOpen && (
                <button
                  type="button"
                  className="btn-add-stop-trigger"
                  onClick={handleOpenAddForm}
                  id="add-stop-trigger-button"
                >
                  <Plus size={16} />
                  <span>+ Add stop</span>
                </button>
              )}
            </div>

            {/* Add / Edit Stop Side Panel (Slide 07 & Slide 09) */}
            {isFormOpen && (
              <aside className="add-stop-panel" aria-label="Stop details form">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 className="add-stop-title">
                    {editingStop ? 'Edit Stop' : 'Add Stop'}
                  </h3>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingStop(null);
                    }}
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSaveStop} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                  <div className="form-group">
                    <label className="form-label">Stop name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Fushimi Inari Shrine"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Time</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="09:00"
                        value={formTime}
                        onChange={(e) => setFormTime(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Duration</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="1h 30m"
                        value={formDuration}
                        onChange={(e) => setFormDuration(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <div className="category-pills-row">
                      {['Cultural', 'Food', 'Sightseeing', 'Nature'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          className={`category-choice-pill ${formCategory === cat ? 'selected' : ''}`}
                          onClick={() => setFormCategory(cat)}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Location (optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Asakusa, Tokyo"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Optional notes..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="form-actions-row">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        setIsFormOpen(false);
                        setEditingStop(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      id="save-stop-button"
                    >
                      {editingStop ? 'Save changes' : 'Add stop'}
                    </button>
                  </div>
                </form>
              </aside>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
