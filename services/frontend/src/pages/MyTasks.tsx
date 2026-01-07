import { useState, useEffect } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { TaskCard } from "../components/tasks/TaskCard";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Search, Filter } from "lucide-react";
import { tasksAPI } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../hooks/use-toast";

// Helper function to parse date string (e.g., "Dec 30, 2025")
const parseDate = (dateString: string): Date => {
  return new Date(dateString);
};

// Helper function to check if date is within this week
const isThisWeek = (date: Date): boolean => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
  endOfWeek.setHours(23, 59, 59, 999);
  
  return date >= startOfWeek && date <= endOfWeek;
};

// Helper function to check if date is within this month
const isThisMonth = (date: Date): boolean => {
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

interface TaskCardTask {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string;
  assignee: string;
}

const MyTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskCardTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [priorityFilters, setPriorityFilters] = useState<string[]>([]);
  const [timeFilters, setTimeFilters] = useState<string[]>([]);

  // Fetch tasks - all tasks for admin, assigned tasks for others
  useEffect(() => {
    const fetchTasks = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      // Check if user is admin
      const isAdmin = user && (user.role === 'ADMIN' || user.role_display === 'Admin');

      try {
        setIsLoading(true);
        // If admin, fetch all tasks; otherwise fetch only assigned tasks
        const fetchedTasks = await tasksAPI.listTasks(
          isAdmin ? {} : { assigned_to_user_id: user.id }
        );

        // Convert API tasks to TaskCard format
        const formattedTasks: TaskCardTask[] = fetchedTasks.map((task) => {
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

        setTasks(formattedTasks);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch tasks";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [user?.id, user?.role, user?.role_display]);

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || task.status === activeTab;
    
    // Priority filter
    const matchesPriority = 
      priorityFilters.length === 0 || 
      priorityFilters.includes(task.priority);
    
    // Time filter
    let matchesTime = true;
    if (timeFilters.length > 0) {
      const taskDate = parseDate(task.dueDate);
      matchesTime = timeFilters.some((filter) => {
        if (filter === "this-week") return isThisWeek(taskDate);
        if (filter === "this-month") return isThisMonth(taskDate);
        return false;
      });
    }
    
    return matchesSearch && matchesTab && matchesPriority && matchesTime;
  });

  const handlePriorityToggle = (priority: string) => {
    setPriorityFilters((prev) =>
      prev.includes(priority)
        ? prev.filter((p) => p !== priority)
        : [...prev, priority]
    );
  };

  const handleTimeToggle = (timeFilter: string) => {
    setTimeFilters((prev) =>
      prev.includes(timeFilter)
        ? prev.filter((t) => t !== timeFilter)
        : [...prev, timeFilter]
    );
  };

  const clearFilters = () => {
    setPriorityFilters([]);
    setTimeFilters([]);
  };

  const hasActiveFilters = priorityFilters.length > 0 || timeFilters.length > 0;

  const taskCounts = {
    all: tasks.length,
    TODO: tasks.filter((t) => t.status === "TODO").length,
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    DONE: tasks.filter((t) => t.status === "DONE").length,
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Tasks</h1>
          <p className="text-muted-foreground mt-1">
            {user && (user.role === 'ADMIN' || user.role_display === 'Admin')
              ? "View and manage all tasks from every team"
              : "View and manage all tasks assigned to you"}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-card border-border"
            />
          </div>
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={`gap-2 border-border hover:bg-secondary h-12 ${hasActiveFilters ? 'border-primary bg-primary/10' : ''}`}
              >
                <Filter className="w-4 h-4" />
                Filter
                {hasActiveFilters && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                    {priorityFilters.length + timeFilters.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-card border-border" align="end">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Filter Tasks</h3>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                {/* Priority Filters */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground">Priority</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="priority-high"
                        checked={priorityFilters.includes("HIGH")}
                        onCheckedChange={() => handlePriorityToggle("HIGH")}
                      />
                      <Label
                        htmlFor="priority-high"
                        className="text-sm font-normal cursor-pointer text-foreground"
                      >
                        High
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="priority-medium"
                        checked={priorityFilters.includes("MEDIUM")}
                        onCheckedChange={() => handlePriorityToggle("MEDIUM")}
                      />
                      <Label
                        htmlFor="priority-medium"
                        className="text-sm font-normal cursor-pointer text-foreground"
                      >
                        Medium
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="priority-low"
                        checked={priorityFilters.includes("LOW")}
                        onCheckedChange={() => handlePriorityToggle("LOW")}
                      />
                      <Label
                        htmlFor="priority-low"
                        className="text-sm font-normal cursor-pointer text-foreground"
                      >
                        Low
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Time Filters */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground">Due Date</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="time-this-week"
                        checked={timeFilters.includes("this-week")}
                        onCheckedChange={() => handleTimeToggle("this-week")}
                      />
                      <Label
                        htmlFor="time-this-week"
                        className="text-sm font-normal cursor-pointer text-foreground"
                      >
                        Due this week
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="time-this-month"
                        checked={timeFilters.includes("this-month")}
                        onCheckedChange={() => handleTimeToggle("this-month")}
                      />
                      <Label
                        htmlFor="time-this-month"
                        className="text-sm font-normal cursor-pointer text-foreground"
                      >
                        Due this month
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-card border border-border p-1">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              All ({taskCounts.all})
            </TabsTrigger>
            <TabsTrigger 
              value="TODO" 
              className="data-[state=active]:bg-status-todo data-[state=active]:text-foreground"
            >
              To Do ({taskCounts.TODO})
            </TabsTrigger>
            <TabsTrigger 
              value="IN_PROGRESS" 
              className="data-[state=active]:bg-status-in-progress data-[state=active]:text-foreground"
            >
              In Progress ({taskCounts.IN_PROGRESS})
            </TabsTrigger>
            <TabsTrigger 
              value="DONE" 
              className="data-[state=active]:bg-status-done data-[state=active]:text-foreground"
            >
              Done ({taskCounts.DONE})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading tasks...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No tasks found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTasks.map((task) => (
                  <TaskCard key={task.id} task={task} showAssignee={false} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default MyTasks;
