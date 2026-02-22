/**
 * TaskEditor.tsx
 *
 * Expandable panel for managing tasks and protocol settings.
 * Allows users to:
 *   - Add / remove custom tasks
 *   - Toggle task order enforcement
 *   - Toggle pomodoro enforcement
 *
 * Built-in tasks are view-only (cannot be deleted).
 * Expanded/collapsed state is local (not persisted).
 */

"use client";

import { useState } from "react";
import {
  TASK_DEFINITIONS,
  CustomTask,
  TaskCategory,
  useGrindStore,
} from "@/store/useGrindStore";
import { Trash2, ChevronDown, ChevronUp, Plus } from "lucide-react";

const CATEGORY_OPTIONS: TaskCategory[] = ["physical", "cognitive", "intellectual"];

const BLANK_FORM = {
  label: "",
  category: "cognitive" as TaskCategory,
  duration: "30m",
  description: "",
  pomoDurationMinutes: 30,
};

export function TaskEditor() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [formError, setFormError] = useState("");

  const customTasks = useGrindStore((s) => s.customTasks);
  const addCustomTask = useGrindStore((s) => s.addCustomTask);
  const removeCustomTask = useGrindStore((s) => s.removeCustomTask);
  const enforceTaskOrder = useGrindStore((s) => s.enforceTaskOrder);
  const enforcePomodoro = useGrindStore((s) => s.enforcePomodoro);
  const toggleEnforceTaskOrder = useGrindStore((s) => s.toggleEnforceTaskOrder);
  const toggleEnforcePomodoro = useGrindStore((s) => s.toggleEnforcePomodoro);

  function handleRemove(id: string) {
    if (window.confirm("Remove this task? Completion data will be lost.")) {
      removeCustomTask(id);
    }
  }

  function handleAdd() {
    if (!form.label.trim()) {
      setFormError("Task name is required.");
      return;
    }
    if (form.pomoDurationMinutes < 1 || form.pomoDurationMinutes > 480) {
      setFormError("Timer must be 1–480 minutes.");
      return;
    }
    addCustomTask({
      label: form.label.trim().toUpperCase(),
      category: form.category,
      duration: `${form.pomoDurationMinutes}m`,
      description: form.description.trim(),
      pomoDurationMinutes: form.pomoDurationMinutes,
    });
    setForm(BLANK_FORM);
    setFormError("");
    setShowAddForm(false);
  }

  return (
    <div className="border-t border-white/20">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="
          w-full flex items-center justify-between
          px-4 py-3
          text-white/40 hover:text-white
          text-xs tracking-[0.3em] uppercase font-mono
          transition-colors duration-75
          cursor-pointer
        "
        aria-expanded={isOpen}
        aria-label="Toggle task editor and settings"
      >
        <span>TASK EDITOR & SETTINGS</span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {isOpen && (
        <div className="border-t border-white/10 space-y-0">

          {/* ── Settings toggles ─────────────────────────────────────── */}
          <div className="px-4 py-4 space-y-3 border-b border-white/10">
            <p className="text-white/30 text-[10px] tracking-[0.4em] uppercase mb-3">
              ENFORCEMENT
            </p>

            <ToggleRow
              label="ENFORCE TASK ORDER"
              description="Tasks must be completed sequentially"
              value={enforceTaskOrder}
              onToggle={toggleEnforceTaskOrder}
            />
            <ToggleRow
              label="ENFORCE POMODORO"
              description="Must run timer to check off each task"
              value={enforcePomodoro}
              onToggle={toggleEnforcePomodoro}
            />
          </div>

          {/* ── Built-in tasks (read-only) ────────────────────────────── */}
          <div className="px-4 py-4 border-b border-white/10">
            <p className="text-white/30 text-[10px] tracking-[0.4em] uppercase mb-3">
              BUILT-IN TASKS ({TASK_DEFINITIONS.length})
            </p>
            <div className="space-y-1">
              {TASK_DEFINITIONS.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-1"
                >
                  <span className="text-white/40 text-xs font-mono tracking-wide">
                    {t.label}
                  </span>
                  <span className="text-white/20 text-[10px] tracking-widest">
                    {t.duration}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Custom tasks ─────────────────────────────────────────── */}
          <div className="px-4 py-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/30 text-[10px] tracking-[0.4em] uppercase">
                CUSTOM TASKS ({customTasks.length})
              </p>
              <button
                onClick={() => setShowAddForm((v) => !v)}
                className="flex items-center gap-1 text-white/40 hover:text-white text-[10px] tracking-widest uppercase transition-colors cursor-pointer"
                aria-label="Add a custom task"
              >
                <Plus size={12} />
                ADD
              </button>
            </div>

            {/* Add form */}
            {showAddForm && (
              <div className="border border-white/20 p-4 mb-3 space-y-3">
                <InputField
                  label="TASK NAME"
                  placeholder="E.G. COLD SHOWER"
                  value={form.label}
                  onChange={(v) => setForm({ ...form, label: v })}
                />
                <div className="space-y-1">
                  <label className="text-white/40 text-[10px] tracking-widest uppercase">
                    CATEGORY
                  </label>
                  <div className="flex gap-2">
                    {CATEGORY_OPTIONS.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setForm({ ...form, category: cat })}
                        className={`
                          flex-1 py-2 border text-[10px] tracking-widest uppercase font-mono
                          transition-colors cursor-pointer
                          ${form.category === cat
                            ? "border-white bg-white text-black"
                            : "border-white/20 bg-black text-white/40 hover:border-white/60"
                          }
                        `}
                      >
                        {cat.slice(0, 4)}
                      </button>
                    ))}
                  </div>
                </div>
                <InputField
                  label="DESCRIPTION (OPTIONAL)"
                  placeholder="Brief note"
                  value={form.description}
                  onChange={(v) => setForm({ ...form, description: v })}
                />
                <div className="space-y-1">
                  <label className="text-white/40 text-[10px] tracking-widest uppercase">
                    TIMER DURATION (MINUTES)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={480}
                    value={form.pomoDurationMinutes}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        pomoDurationMinutes: parseInt(e.target.value) || 25,
                        duration: `${e.target.value}m`,
                      })
                    }
                    className="
                      w-full bg-black border border-white/40 text-white
                      px-3 py-2 text-sm font-mono tracking-widest
                      focus:outline-none focus:border-white
                    "
                  />
                </div>
                {formError && (
                  <p className="text-terminal-red text-[10px] tracking-widest uppercase">
                    {formError}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    className="
                      flex-1 py-3 border border-white
                      text-white text-xs tracking-widest uppercase font-mono font-bold
                      hover:bg-white hover:text-black transition-colors cursor-pointer
                    "
                  >
                    ADD TASK
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setFormError("");
                      setForm(BLANK_FORM);
                    }}
                    className="
                      px-4 py-3 border border-white/20
                      text-white/40 text-xs tracking-widest uppercase font-mono
                      hover:border-white/60 transition-colors cursor-pointer
                    "
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}

            {/* Custom task list */}
            {customTasks.length === 0 && !showAddForm && (
              <p className="text-white/20 text-[10px] tracking-widest uppercase">
                NO CUSTOM TASKS
              </p>
            )}
            <div className="space-y-1">
              {customTasks.map((task: CustomTask) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between py-1.5 border-b border-white/5"
                >
                  <div>
                    <p className="text-white/60 text-xs font-mono tracking-wide">
                      {task.label}
                    </p>
                    <p className="text-white/20 text-[10px] tracking-widest uppercase">
                      {task.category} · {task.duration}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(task.id)}
                    className="text-white/20 hover:text-terminal-red transition-colors p-1 cursor-pointer"
                    aria-label={`Remove task ${task.label}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToggleRow({
  label,
  description,
  value,
  onToggle,
}: {
  label: string;
  description: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="text-white/60 text-xs font-mono tracking-widest uppercase">
          {label}
        </p>
        <p className="text-white/25 text-[10px] tracking-wide mt-0.5">
          {description}
        </p>
      </div>
      <button
        onClick={onToggle}
        className={`
          flex-shrink-0 w-10 h-5 border-2 relative transition-colors duration-150 cursor-pointer
          ${value ? "border-white bg-white" : "border-white/30 bg-black"}
        `}
        aria-pressed={value}
        aria-label={label}
        role="switch"
      >
        <span
          className={`
            absolute top-0.5 w-3 h-3
            transition-all duration-150
            ${value ? "left-5 bg-black" : "left-0.5 bg-white/30"}
          `}
        />
      </button>
    </div>
  );
}

function InputField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-white/40 text-[10px] tracking-widest uppercase">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full bg-black border border-white/40 text-white
          px-3 py-2 text-sm font-mono tracking-wide
          placeholder:text-white/20
          focus:outline-none focus:border-white
        "
      />
    </div>
  );
}
