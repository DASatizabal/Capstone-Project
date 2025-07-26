"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface FamilyMember {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    image?: string;
  };
  role: "parent" | "child" | "admin";
}

interface ChoreCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyMembers: FamilyMember[];
  familyId: string;
  onChoreCreated: () => void;
}

interface ChoreFormData {
  title: string;
  description: string;
  instructions: string;
  category: string;
  assignedTo: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  points: number;
  estimatedMinutes: number;
  requiresPhotoVerification: boolean;
  isRecurring: boolean;
  recurrence: {
    type: "daily" | "weekly" | "monthly" | "once";
    interval: number;
    daysOfWeek: number[];
  };
}

const categories = [
  "Cleaning",
  "Kitchen",
  "Laundry",
  "Outdoor",
  "Pet Care",
  "Homework",
  "Organization",
  "General",
];

const ChoreCreationModal = ({
  isOpen,
  onClose,
  familyMembers,
  familyId,
  onChoreCreated,
}: ChoreCreationModalProps) => {
  const [formData, setFormData] = useState<ChoreFormData>({
    title: "",
    description: "",
    instructions: "",
    category: "General",
    assignedTo: "",
    dueDate: "",
    priority: "medium",
    points: 10,
    estimatedMinutes: 30,
    requiresPhotoVerification: false,
    isRecurring: false,
    recurrence: {
      type: "once",
      interval: 1,
      daysOfWeek: [],
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleRecurrenceChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      recurrence: { ...prev.recurrence, [field]: value },
    }));
  };

  const handleDayOfWeekToggle = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      recurrence: {
        ...prev.recurrence,
        daysOfWeek: prev.recurrence.daysOfWeek.includes(day)
          ? prev.recurrence.daysOfWeek.filter((d) => d !== day)
          : [...prev.recurrence.daysOfWeek, day],
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.assignedTo) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/chores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          familyId,
          recurrence: formData.isRecurring
            ? formData.recurrence
            : { type: "none" },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create chore");
      }

      toast.success("Chore created successfully!");
      onChoreCreated();
      onClose();

      // Reset form
      setFormData({
        title: "",
        description: "",
        instructions: "",
        category: "General",
        assignedTo: "",
        dueDate: "",
        priority: "medium",
        points: 10,
        estimatedMinutes: 30,
        requiresPhotoVerification: false,
        isRecurring: false,
        recurrence: {
          type: "once",
          interval: 1,
          daysOfWeek: [],
        },
      });
    } catch (error) {
      console.error("Error creating chore:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create chore",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const daysOfWeek = [
    { value: 0, label: "Sun" },
    { value: 1, label: "Mon" },
    { value: 2, label: "Tue" },
    { value: 3, label: "Wed" },
    { value: 4, label: "Thu" },
    { value: 5, label: "Fri" },
    { value: 6, label: "Sat" },
  ];

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-lg mb-6">Create New Chore</h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Title *</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="input input-bordered"
                placeholder="Clean the kitchen"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Category</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="select select-bordered"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Description</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="textarea textarea-bordered h-20"
              placeholder="Brief description of the chore..."
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Instructions</span>
            </label>
            <textarea
              name="instructions"
              value={formData.instructions}
              onChange={handleInputChange}
              className="textarea textarea-bordered h-24"
              placeholder="Detailed instructions on how to complete this chore..."
            />
          </div>

          {/* Assignment and Timing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Assign to *</span>
              </label>
              <select
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleInputChange}
                className="select select-bordered"
                required
              >
                <option value="">Select a family member</option>
                {familyMembers.map((member) => (
                  <option key={member._id} value={member.user._id}>
                    {member.user.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Due Date</span>
              </label>
              <input
                type="datetime-local"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="input input-bordered"
              />
            </div>
          </div>

          {/* Priority and Points */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Priority</span>
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="select select-bordered"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Points</span>
              </label>
              <input
                type="number"
                name="points"
                value={formData.points}
                onChange={handleInputChange}
                className="input input-bordered"
                min="1"
                max="100"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Est. Minutes</span>
              </label>
              <input
                type="number"
                name="estimatedMinutes"
                value={formData.estimatedMinutes}
                onChange={handleInputChange}
                className="input input-bordered"
                min="5"
                max="480"
              />
            </div>
          </div>

          {/* Options */}
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Requires Photo Verification</span>
              <input
                type="checkbox"
                name="requiresPhotoVerification"
                checked={formData.requiresPhotoVerification}
                onChange={handleInputChange}
                className="checkbox checkbox-primary"
              />
            </label>
          </div>

          {/* Recurrence */}
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Make this a recurring chore</span>
              <input
                type="checkbox"
                name="isRecurring"
                checked={formData.isRecurring}
                onChange={handleInputChange}
                className="checkbox checkbox-primary"
              />
            </label>
          </div>

          {formData.isRecurring && (
            <div className="card bg-base-200 p-4">
              <h4 className="font-semibold mb-4">Recurrence Settings</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Repeat</span>
                  </label>
                  <select
                    value={formData.recurrence.type}
                    onChange={(e) =>
                      handleRecurrenceChange("type", e.target.value)
                    }
                    className="select select-bordered"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Every</span>
                  </label>
                  <input
                    type="number"
                    value={formData.recurrence.interval}
                    onChange={(e) =>
                      handleRecurrenceChange(
                        "interval",
                        parseInt(e.target.value) || 1,
                      )
                    }
                    className="input input-bordered"
                    min="1"
                    max="30"
                  />
                </div>
              </div>

              {formData.recurrence.type === "weekly" && (
                <div>
                  <label className="label">
                    <span className="label-text">Days of the week</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => handleDayOfWeekToggle(day.value)}
                        className={`btn btn-sm ${
                          formData.recurrence.daysOfWeek.includes(day.value)
                            ? "btn-primary"
                            : "btn-outline"
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="modal-action">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                isSubmitting || !formData.title.trim() || !formData.assignedTo
              }
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating...
                </>
              ) : (
                "Create Chore"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChoreCreationModal;
