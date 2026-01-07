import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { StatCard } from "../components/dashboard/StatCard";
import { TaskCard } from "../components/tasks/TaskCard";
import { TeamCard } from "../components/teams/TeamCard";
import { Button } from "../components/ui/button";
import { Users, CheckSquare, Clock, TrendingUp } from "lucide-react";
import { teamsAPI, tasksAPI, type Team as APITeam, type Task } from "../lib/api";
import { toast } from "../hooks/use-toast";
import { useAuth } from "../contexts/AuthContext";

interface TaskCardTask {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string;
  assignee: string;
}

interface DisplayTeam {
  id: string;
  name: string;
  leader: string;
  memberCount: number;
  taskCount: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<DisplayTeam[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [displayTasks, setDisplayTasks] = useState<TaskCardTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Fetch tasks - all tasks for admin, assigned tasks for others
  const fetchTasks = useCallback(async () => {
    if (!user?.id) {
      setIsLoadingTasks(false);
      return;
    }

    try {
      setIsLoadingTasks(true);
      // Check if user is admin
      const isAdmin = user && (user.role === 'ADMIN' || user.role_display === 'Admin');
      
      // If admin, fetch all tasks; otherwise fetch only assigned tasks
      const fetchedTasks = await tasksAPI.listTasks(
        isAdmin ? {} : { assigned_to_user_id: user.id }
      );

      setTasks(fetchedTasks);

      // Convert to TaskCard format for display (limit to 3 most recent)
      const formattedTasks: TaskCardTask[] = fetchedTasks
        .slice(0, 3)
        .map((task) => {
          const dueDate = new Date(task.due_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });

          return {
            id: task.id,
            title: task.title,
            status: task.status,
            priority: task.priority,
            dueDate,
            assignee: '', // Not used since showAssignee=false
          };
        });

      setDisplayTasks(formattedTasks);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch tasks";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingTasks(false);
    }
  }, [user?.id, user?.role, user?.role_display]);

  const fetchTeams = useCallback(async () => {
    try {
      setIsLoading(true);
      const apiTeams = await teamsAPI.listTeams();
      
      // Fetch tasks for each team to get task counts
      const teamsWithTaskCounts = await Promise.all(
        apiTeams.map(async (team: APITeam) => {
          try {
            const teamTasks = await tasksAPI.listTasks({ team_id: team.id });
            return {
              id: team.id.toString(),
              name: team.name,
              leader: team.leader_full_name || "No leader",
              memberCount: team.number_of_members,
              taskCount: teamTasks.length,
            };
          } catch (error) {
            // If fetching tasks fails for a team, just use 0
            return {
              id: team.id.toString(),
              name: team.name,
              leader: team.leader_full_name || "No leader",
              memberCount: team.number_of_members,
              taskCount: 0,
            };
          }
        })
      );
      
      setTeams(teamsWithTaskCounts);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch teams";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
    fetchTasks();
  }, [fetchTeams, fetchTasks]);

  // Calculate statistics from tasks
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
  
  // Calculate task counts by status
  const todoCount = tasks.filter((t) => t.status === 'TODO').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const doneCount = tasks.filter((t) => t.status === 'DONE').length;
  
  // Calculate percentages for progress bars
  const totalForPercentages = totalTasks || 1; // Avoid division by zero
  const todoPercentage = (todoCount / totalForPercentages) * 100;
  const inProgressPercentage = (inProgressCount / totalForPercentages) * 100;
  const donePercentage = (doneCount / totalForPercentages) * 100;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's an overview of your projects.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Teams"
            value={teams.length}
            icon={Users}
          />
          <StatCard
            title="Total Tasks"
            value={totalTasks}
            icon={CheckSquare}
          />
          <StatCard
            title="In Progress"
            value={inProgressTasks}
            icon={Clock}
          />
          <StatCard
            title="Completed"
            value={completedTasks}
            icon={TrendingUp}
          />
        </div>

        {/* Tasks by Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-status-todo" />
                To Do
              </h3>
              <span className="text-2xl font-bold text-foreground">{todoCount}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-status-todo rounded-full transition-all" 
                style={{ width: `${todoPercentage}%` }}
              />
            </div>
          </div>
          
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-status-in-progress" />
                In Progress
              </h3>
              <span className="text-2xl font-bold text-foreground">{inProgressCount}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-status-in-progress rounded-full transition-all" 
                style={{ width: `${inProgressPercentage}%` }}
              />
            </div>
          </div>
          
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-status-done" />
                Done
              </h3>
              <span className="text-2xl font-bold text-foreground">{doneCount}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-status-done rounded-full transition-all" 
                style={{ width: `${donePercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* My Teams and Recent Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Teams */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">My Teams</h2>
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading teams...</p>
              </div>
            ) : teams.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No teams found.</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {teams.slice(0, 3).map((team) => (
                    <TeamCard key={team.id} team={team} />
                  ))}
                </div>
                {teams.length > 3 && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      className="w-full border-border hover:bg-secondary"
                      onClick={() => navigate("/teams")}
                    >
                      Go to My Teams
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Personal Tasks */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">My Tasks</h2>
            {isLoadingTasks ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading tasks...</p>
              </div>
            ) : displayTasks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No tasks found.</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {displayTasks.map((task) => (
                    <TaskCard key={task.id} task={task} showAssignee={false} />
                  ))}
                </div>
                {tasks.length > 3 && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      className="w-full border-border hover:bg-secondary"
                      onClick={() => navigate("/my-tasks")}
                    >
                      Go to My Tasks
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
