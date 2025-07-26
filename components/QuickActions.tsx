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

interface QuickActionsProps {
  familyMembers: FamilyMember[];
  familyId: string;
  onRefresh: () => void;
}

const QuickActions = ({ familyMembers, familyId, onRefresh }: QuickActionsProps) => {
  const [selectedMember, setSelectedMember] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const quickChoreTemplates = [
    {
      id: "clean-room",
      title: "Clean Room",
      description: "Tidy up bedroom and make bed",
      category: "Cleaning",
      points: 15,
      estimatedMinutes: 30,
      icon: "🛏️",
    },
    {
      id: "dishes",
      title: "Do Dishes",
      description: "Wash, dry, and put away dishes",
      category: "Kitchen",
      points: 10,
      estimatedMinutes: 20,
      icon: "🍽️",
    },
    {
      id: "laundry",
      title: "Sort Laundry",
      description: "Sort dirty clothes into appropriate bins",
      category: "Laundry",
      points: 8,
      estimatedMinutes: 15,
      icon: "👕",
    },
    {
      id: "vacuum",
      title: "Vacuum Living Room",
      description: "Vacuum the living room and dining area",
      category: "Cleaning",
      points: 12,
      estimatedMinutes: 25,
      icon: "🏠",
    },
    {
      id: "trash",
      title: "Take Out Trash",
      description: "Empty trash bins and take to curb",
      category: "Outdoor",
      points: 5,
      estimatedMinutes: 10,
      icon: "🗑️",
    },
    {
      id: "homework",
      title: "Complete Homework",
      description: "Finish all assigned homework",
      category: "Homework",
      points: 20,
      estimatedMinutes: 60,
      icon: "📚",
    },
  ];

  const createQuickChore = async (
    template: (typeof quickChoreTemplates)[0],
  ) => {
    if (!selectedMember) {
      toast.error("Please select a family member first");
      return;
    }

    setLoading(template.id);

    try {
      const response = await fetch("/api/chores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: template.title,
          description: template.description,
          category: template.category,
          assignedTo: selectedMember,
          familyId,
          points: template.points,
          estimatedMinutes: template.estimatedMinutes,
          priority: "medium",
          requiresPhotoVerification: false,
          recurrence: { type: "none" },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create chore");
      }

      toast.success(`${template.title} assigned successfully!`);
      onRefresh();
    } catch (error) {
      console.error("Error creating quick chore:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create chore",
      );
    } finally {
      setLoading(null);
    }
  };

  const bulkAssignChores = async (choreIds: string[]) => {
    if (!selectedMember) {
      toast.error("Please select a family member first");
      return;
    }

    setLoading("bulk-assign");

    try {
      const createPromises = choreIds.map(async (choreId) => {
        const template = quickChoreTemplates.find((t) => t.id === choreId);
        if (!template) return;

        return fetch("/api/chores", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: template.title,
            description: template.description,
            category: template.category,
            assignedTo: selectedMember,
            familyId,
            points: template.points,
            estimatedMinutes: template.estimatedMinutes,
            priority: "medium",
            requiresPhotoVerification: false,
            recurrence: { type: "none" },
          }),
        });
      });

      await Promise.all(createPromises);
      toast.success(`${choreIds.length} chores assigned successfully!`);
      onRefresh();
    } catch (error) {
      console.error("Error bulk assigning chores:", error);
      toast.error("Failed to assign some chores");
    } finally {
      setLoading(null);
    }
  };

  const assignDailyChores = () => {
    bulkAssignChores(["clean-room", "dishes", "homework"]);
  };

  const assignWeekendChores = () => {
    bulkAssignChores(["vacuum", "laundry", "trash"]);
  };

  return (
    <div className="card bg-base-200 shadow-lg">
      <div className="card-body">
        <h2 className="card-title text-xl mb-6">Quick Actions</h2>

        {/* Member Selection */}
        <div className="form-control mb-6">
          <label className="label">
            <span className="label-text font-medium">Assign to:</span>
          </label>
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="select select-bordered w-full max-w-md"
          >
            <option value="">Select a family member</option>
            {familyMembers.map((member) => (
              <option key={member._id} value={member.user._id}>
                {member.user.name}
              </option>
            ))}
          </select>
        </div>

        {/* Bulk Assignment Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <button
            onClick={assignDailyChores}
            disabled={!selectedMember || loading === "bulk-assign"}
            className="btn btn-primary btn-lg"
          >
            {loading === "bulk-assign" ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <>
                <div className="text-2xl">📅</div>
                <div>
                  <div className="font-bold">Daily Chores</div>
                  <div className="text-sm opacity-70">
                    Room, Dishes, Homework
                  </div>
                </div>
              </>
            )}
          </button>

          <button
            onClick={assignWeekendChores}
            disabled={!selectedMember || loading === "bulk-assign"}
            className="btn btn-secondary btn-lg"
          >
            {loading === "bulk-assign" ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <>
                <div className="text-2xl">🏠</div>
                <div>
                  <div className="font-bold">Weekend Chores</div>
                  <div className="text-sm opacity-70">
                    Vacuum, Laundry, Trash
                  </div>
                </div>
              </>
            )}
          </button>

          <button
            onClick={() =>
              bulkAssignChores(quickChoreTemplates.map((t) => t.id))
            }
            disabled={!selectedMember || loading === "bulk-assign"}
            className="btn btn-accent btn-lg"
          >
            {loading === "bulk-assign" ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <>
                <div className="text-2xl">⚡</div>
                <div>
                  <div className="font-bold">All Chores</div>
                  <div className="text-sm opacity-70">Complete list</div>
                </div>
              </>
            )}
          </button>
        </div>

        {/* Individual Quick Chore Templates */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Individual Chores</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickChoreTemplates.map((template) => (
              <div
                key={template.id}
                className="card bg-base-100 shadow-sm border border-base-300 hover:shadow-md transition-shadow"
              >
                <div className="card-body p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-2xl">{template.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm">{template.title}</h4>
                      <p className="text-xs text-base-content/70">
                        {template.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-base-content/60 mb-3">
                    <span className="badge badge-outline badge-xs">
                      {template.category}
                    </span>
                    <span>{template.points} pts</span>
                    <span>{template.estimatedMinutes} min</span>
                  </div>

                  <button
                    onClick={() => createQuickChore(template)}
                    disabled={!selectedMember || loading === template.id}
                    className="btn btn-primary btn-sm w-full"
                  >
                    {loading === template.id ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        Assigning...
                      </>
                    ) : (
                      "Assign"
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="alert alert-info mt-6">
          <svg
            className="stroke-current shrink-0 w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <div>
            <h3 className="font-bold">Quick Tips:</h3>
            <div className="text-sm">
              • Select a family member before using quick actions • Daily chores
              are perfect for school days • Weekend chores help with weekly
              household tasks • Individual assignments allow for custom
              scheduling
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
