"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

import ChoreCreationModal from "./ChoreCreationModal";
import ChoreList from "./ChoreList";
import QuickActions from "./QuickActions";

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

interface FamilyContext {
  activeFamily: {
    id: string;
    name: string;
    createdBy: string;
    memberCount: number;
    createdAt: string;
    updatedAt: string;
  } | null;
  role: string | null;
  familyCount: number;
}

interface DashboardStats {
  totalChores: number;
  pendingChores: number;
  completedToday: number;
  overdueChores: number;
}

const ParentDashboard = () => {
  const { data: session } = useSession();
  const [familyContext, setFamilyContext] = useState<FamilyContext | null>(
    null,
  );
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalChores: 0,
    pendingChores: 0,
    completedToday: 0,
    overdueChores: 0,
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch family context
  useEffect(() => {
    const fetchFamilyContext = async () => {
      try {
        const response = await fetch("/api/families/context");
        if (!response.ok) throw new Error("Failed to fetch family context");
        const data = await response.json();
        setFamilyContext(data);
      } catch (error) {
        console.error("Error fetching family context:", error);
      }
    };

    if (session?.user) {
      fetchFamilyContext();
    }
  }, [session]);

  // Fetch family members
  useEffect(() => {
    const fetchFamilyMembers = async () => {
      if (!familyContext?.activeFamily?.id) return;

      try {
        const response = await fetch(
          `/api/families/${familyContext.activeFamily.id}/members`,
        );
        if (!response.ok) throw new Error("Failed to fetch family members");
        const data = await response.json();
        setFamilyMembers(data.members || []);
      } catch (error) {
        console.error("Error fetching family members:", error);
      }
    };

    fetchFamilyMembers();
  }, [familyContext]);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!familyContext?.activeFamily?.id) return;

      try {
        setLoading(true);
        const response = await fetch(
          `/api/chores?familyId=${familyContext.activeFamily.id}`,
        );
        if (!response.ok) throw new Error("Failed to fetch chores");
        const data = await response.json();

        const chores = data.chores || [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        setStats({
          totalChores: chores.length,
          pendingChores: chores.filter((c: any) => c.status === "pending")
            .length,
          completedToday: chores.filter(
            (c: any) =>
              c.status === "completed" &&
              new Date(c.completedAt) >= today &&
              new Date(c.completedAt) < tomorrow,
          ).length,
          overdueChores: chores.filter(
            (c: any) =>
              c.dueDate &&
              new Date(c.dueDate) < new Date() &&
              !["completed", "verified"].includes(c.status),
          ).length,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [familyContext, refreshTrigger]);

  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (loading && !familyContext) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!familyContext?.activeFamily) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Active Family</h2>
          <p className="text-base-content/70 mb-6">
            You need to join or create a family to access the dashboard.
          </p>
          <a href="/families" className="btn btn-primary">
            Manage Families
          </a>
        </div>
      </div>
    );
  }

  const children = familyMembers.filter((member) => member.role === "child");

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-primary-content">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Parent Dashboard</h1>
              <p className="text-primary-content/80">
                Welcome back! Manage chores for{" "}
                {familyContext.activeFamily.name}
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-accent btn-lg shadow-lg"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Chore
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stats shadow bg-base-200">
            <div className="stat">
              <div className="stat-figure text-primary">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div className="stat-title">Total Chores</div>
              <div className="stat-value text-primary">{stats.totalChores}</div>
              <div className="stat-desc">All time</div>
            </div>
          </div>

          <div className="stats shadow bg-base-200">
            <div className="stat">
              <div className="stat-figure text-warning">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="stat-title">Pending</div>
              <div className="stat-value text-warning">
                {stats.pendingChores}
              </div>
              <div className="stat-desc">Awaiting completion</div>
            </div>
          </div>

          <div className="stats shadow bg-base-200">
            <div className="stat">
              <div className="stat-figure text-success">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="stat-title">Completed Today</div>
              <div className="stat-value text-success">
                {stats.completedToday}
              </div>
              <div className="stat-desc">Great progress!</div>
            </div>
          </div>

          <div className="stats shadow bg-base-200">
            <div className="stat">
              <div className="stat-figure text-error">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="stat-title">Overdue</div>
              <div className="stat-value text-error">{stats.overdueChores}</div>
              <div className="stat-desc">Need attention</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <QuickActions 
            familyMembers={children} 
            familyId={familyContext.activeFamily.id}
            onRefresh={refreshData} 
          />
        </div>

        {/* Family Members Overview */}
        <div className="card bg-base-200 shadow-lg mb-8">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">Family Members</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {familyMembers.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center gap-3 p-3 bg-base-100 rounded-lg"
                >
                  <div className="avatar">
                    <div className="w-10 h-10 rounded-full">
                      {member.user.image ? (
                        <img src={member.user.image} alt={member.user.name} />
                      ) : (
                        <div className="bg-primary text-primary-content flex items-center justify-center">
                          {member.user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{member.user.name}</div>
                    <div className="text-sm text-base-content/70 capitalize">
                      {member.role}
                    </div>
                  </div>
                  <div
                    className={`badge ${member.role === "parent" ? "badge-primary" : "badge-secondary"}`}
                  >
                    {member.role}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chore List */}
        <ChoreList
          familyId={familyContext.activeFamily.id}
          refreshTrigger={refreshTrigger}
          onRefresh={refreshData}
        />
      </div>

      {/* Create Chore Modal */}
      <ChoreCreationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        familyMembers={children}
        familyId={familyContext.activeFamily.id}
        onChoreCreated={refreshData}
      />
    </div>
  );
};

export default ParentDashboard;
