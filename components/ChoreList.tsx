"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface Chore {
  _id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed" | "verified" | "rejected";
  priority: "low" | "medium" | "high";
  points: number;
  dueDate?: string;
  estimatedMinutes?: number;
  requiresPhotoVerification: boolean;
  category?: string;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
    image?: string;
  };
  createdBy?: {
    _id: string;
    name: string;
  };
  family: {
    _id: string;
    name: string;
  };
  completedAt?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ChoreListProps {
  familyId: string;
  refreshTrigger: number;
  onRefresh: () => void;
}

const ChoreList = ({ familyId, refreshTrigger, onRefresh }: ChoreListProps) => {
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{
    status: string;
    assignedTo: string;
    search: string;
  }>({
    status: "all",
    assignedTo: "all",
    search: "",
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    skip: 0,
    hasMore: false,
  });

  // Fetch chores
  useEffect(() => {
    const fetchChores = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          familyId,
          limit: pagination.limit.toString(),
          skip: pagination.skip.toString(),
        });

        if (filter.status !== "all") {
          params.append("status", filter.status);
        }
        if (filter.assignedTo !== "all") {
          params.append("assignedTo", filter.assignedTo);
        }

        const response = await fetch(`/api/chores?${params}`);
        if (!response.ok) throw new Error("Failed to fetch chores");

        const data = await response.json();
        setChores(data.chores || []);
        setPagination(data.pagination || pagination);
      } catch (error) {
        console.error("Error fetching chores:", error);
        toast.error("Failed to fetch chores");
      } finally {
        setLoading(false);
      }
    };

    if (familyId) {
      fetchChores();
    }
  }, [familyId, filter, pagination.skip, refreshTrigger]);

  const updateChoreStatus = async (choreId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/chores/${choreId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update chore status");
      }

      toast.success("Chore status updated successfully");
      onRefresh();
    } catch (error) {
      console.error("Error updating chore status:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update chore status",
      );
    }
  };

  const deleteChore = async (choreId: string) => {
    if (!confirm("Are you sure you want to delete this chore?")) return;

    try {
      const response = await fetch(`/api/chores/${choreId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete chore");
      }

      toast.success("Chore deleted successfully");
      onRefresh();
    } catch (error) {
      console.error("Error deleting chore:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete chore",
      );
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: "badge-warning",
      in_progress: "badge-info",
      completed: "badge-success",
      verified: "badge-primary",
      rejected: "badge-error",
    };
    return badges[status as keyof typeof badges] || "badge-ghost";
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      low: "badge-ghost",
      medium: "badge-warning",
      high: "badge-error",
    };
    return badges[priority as keyof typeof badges] || "badge-ghost";
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredChores = chores.filter((chore) => {
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      return (
        chore.title.toLowerCase().includes(searchLower) ||
        chore.description?.toLowerCase().includes(searchLower) ||
        chore.assignedTo?.name.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <div className="flex items-center justify-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-200 shadow-lg">
      <div className="card-body">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <h2 className="card-title text-xl">Chore Management</h2>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Search chores..."
              value={filter.search}
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, search: e.target.value }))
              }
              className="input input-bordered input-sm"
            />

            <select
              value={filter.status}
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, status: e.target.value }))
              }
              className="select select-bordered select-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="verified">Verified</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        {filteredChores.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-base-content/60 mb-4">
              {filter.search || filter.status !== "all"
                ? "No chores match your filters"
                : "No chores found"}
            </div>
            {!filter.search && filter.status === "all" && (
              <p className="text-sm text-base-content/40">
                Create your first chore to get started!
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredChores.map((chore) => (
              <div
                key={chore._id}
                className={`card bg-base-100 shadow-sm border-l-4 ${
                  isOverdue(chore.dueDate) &&
                  !["completed", "verified"].includes(chore.status)
                    ? "border-l-error"
                    : chore.priority === "high"
                      ? "border-l-error"
                      : chore.priority === "medium"
                        ? "border-l-warning"
                        : "border-l-success"
                }`}
              >
                <div className="card-body p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">
                              {chore.title}
                            </h3>
                            <div
                              className={`badge ${getStatusBadge(chore.status)} badge-sm`}
                            >
                              {chore.status.replace("_", " ")}
                            </div>
                            <div
                              className={`badge ${getPriorityBadge(chore.priority)} badge-sm`}
                            >
                              {chore.priority}
                            </div>
                            {isOverdue(chore.dueDate) &&
                              !["completed", "verified"].includes(
                                chore.status,
                              ) && (
                                <div className="badge badge-error badge-sm">
                                  overdue
                                </div>
                              )}
                          </div>

                          {chore.description && (
                            <p className="text-base-content/70 mb-2">
                              {chore.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-sm text-base-content/60">
                            {chore.assignedTo && (
                              <div className="flex items-center gap-2">
                                <div className="avatar">
                                  <div className="w-6 h-6 rounded-full">
                                    {chore.assignedTo.image ? (
                                      <img
                                        src={chore.assignedTo.image}
                                        alt={chore.assignedTo.name}
                                      />
                                    ) : (
                                      <div className="bg-primary text-primary-content flex items-center justify-center text-xs">
                                        {chore.assignedTo.name
                                          .charAt(0)
                                          .toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <span>{chore.assignedTo.name}</span>
                              </div>
                            )}

                            {chore.dueDate && (
                              <div className="flex items-center gap-1">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                <span>Due {formatDate(chore.dueDate)}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-1">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                />
                              </svg>
                              <span>{chore.points} pts</span>
                            </div>

                            {chore.requiresPhotoVerification && (
                              <div className="flex items-center gap-1">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                                <span>Photo required</span>
                              </div>
                            )}

                            {chore.category && (
                              <div className="badge badge-outline badge-sm">
                                {chore.category}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {chore.status === "pending" && (
                        <button
                          onClick={() =>
                            updateChoreStatus(chore._id, "in_progress")
                          }
                          className="btn btn-info btn-sm"
                        >
                          Start
                        </button>
                      )}

                      {chore.status === "in_progress" && (
                        <button
                          onClick={() =>
                            updateChoreStatus(chore._id, "completed")
                          }
                          className="btn btn-success btn-sm"
                        >
                          Complete
                        </button>
                      )}

                      {chore.status === "completed" &&
                        !chore.requiresPhotoVerification && (
                          <button
                            onClick={() =>
                              updateChoreStatus(chore._id, "verified")
                            }
                            className="btn btn-primary btn-sm"
                          >
                            Verify
                          </button>
                        )}

                      {chore.status === "rejected" && (
                        <button
                          onClick={() =>
                            updateChoreStatus(chore._id, "pending")
                          }
                          className="btn btn-warning btn-sm"
                        >
                          Reset
                        </button>
                      )}

                      <div className="dropdown dropdown-end">
                        <div
                          tabIndex={0}
                          role="button"
                          className="btn btn-ghost btn-sm"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                            />
                          </svg>
                        </div>
                        <ul
                          tabIndex={0}
                          className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                        >
                          <li>
                            <a
                              onClick={() =>
                                updateChoreStatus(chore._id, "pending")
                              }
                            >
                              Reset to Pending
                            </a>
                          </li>
                          <li>
                            <a
                              onClick={() =>
                                updateChoreStatus(chore._id, "cancelled")
                              }
                            >
                              Cancel Chore
                            </a>
                          </li>
                          <li>
                            <a
                              onClick={() => deleteChore(chore._id)}
                              className="text-error"
                            >
                              Delete Chore
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {pagination.hasMore && (
          <div className="text-center mt-6">
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  skip: prev.skip + prev.limit,
                }))
              }
              className="btn btn-outline"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Loading...
                </>
              ) : (
                "Load More"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChoreList;
