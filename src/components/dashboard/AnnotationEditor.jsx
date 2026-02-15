import { useState, useEffect } from 'react';
import { X, Save, Trash2, CheckCircle, Plus } from 'lucide-react';

export default function AnnotationEditor({ annotation, onSave, onDelete, onClose }) {
    const [description, setDescription] = useState(annotation.description || '');
    const [objects, setObjects] = useState(annotation.detected_objects || []);
    const [actions, setActions] = useState(annotation.detected_actions || []);
    const [newTag, setNewTag] = useState('');
    const [tagType, setTagType] = useState('object'); // 'object' or 'action'

    // Update local state when annotation changes
    useEffect(() => {
        setDescription(annotation.description || '');
        setObjects(annotation.detected_objects || []);
        setActions(annotation.detected_actions || []);
    }, [annotation]);

    const handleSave = () => {
        onSave({
            ...annotation,
            description,
            detected_objects: objects,
            detected_actions: actions,
        });
    };

    const addTag = () => {
        if (!newTag.trim()) return;
        const tag = {
            label: newTag.trim(),
            confidence_score: 1.0, // Manual tags are 100% confident
            start_timestamp: annotation.start_timestamp, // Default to full segment
            end_timestamp: annotation.end_timestamp
        };

        if (tagType === 'object') {
            setObjects([...objects, tag]);
        } else {
            setActions([...actions, tag]);
        }
        setNewTag('');
    };

    const removeTag = (index, type) => {
        if (type === 'object') {
            setObjects(objects.filter((_, i) => i !== index));
        } else {
            setActions(actions.filter((_, i) => i !== index));
        }
    };

    return (
        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]">
                <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-indigo-500" />
                    Edit Annotation
                </h3>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-[var(--surface-hover)] rounded-md transition-colors text-[var(--text-secondary)]"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Left Column: Description */}
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-[var(--text-secondary)]">
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={5}
                        className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                        placeholder="Describe the scene..."
                    />
                    <p className="text-xs text-[var(--text-tertiary)]">
                        Refine the description to better match the video content.
                    </p>
                </div>

                {/* Right Column: Tags */}
                <div className="space-y-6">

                    {/* Tag Input */}
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">
                            Add Tags
                        </label>
                        <div className="flex gap-2">
                            <select
                                value={tagType}
                                onChange={(e) => setTagType(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            >
                                <option value="object">Object</option>
                                <option value="action">Action</option>
                            </select>
                            <input
                                type="text"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                                placeholder="Tag name..."
                                className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                            <button
                                onClick={addTag}
                                className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                                title="Add Tag"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Objects List */}
                    <div>
                        <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Objects</h4>
                        <div className="flex flex-wrap gap-2">
                            {objects.map((obj, i) => (
                                <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                                    {obj.label || obj.object}
                                    <button onClick={() => removeTag(i, 'object')} className="hover:text-blue-900 dark:hover:text-blue-100">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                            {objects.length === 0 && <span className="text-xs text-[var(--text-tertiary)] italic">No objects detected</span>}
                        </div>
                    </div>

                    {/* Actions List */}
                    <div>
                        <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Actions</h4>
                        <div className="flex flex-wrap gap-2">
                            {actions.map((act, i) => (
                                <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">
                                    {act.label || act.action}
                                    <button onClick={() => removeTag(i, 'action')} className="hover:text-purple-900 dark:hover:text-purple-100">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                            {actions.length === 0 && <span className="text-xs text-[var(--text-tertiary)] italic">No actions detected</span>}
                        </div>
                    </div>

                </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-[var(--background)] border-t border-[var(--border)] flex justify-between items-center">
                <button
                    onClick={onDelete}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                    Delete Annotation
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg shadow-lg shadow-green-600/20 transition-all hover:-translate-y-0.5"
                    >
                        <Save className="w-4 h-4" />
                        Save & Verify
                    </button>
                </div>
            </div>
        </div>
    );
}
