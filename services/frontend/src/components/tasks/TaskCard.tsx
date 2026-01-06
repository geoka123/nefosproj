import { Link } from "react-router-dom";
import { Calendar, User } from "lucide-react";
import { StatusBadge, PriorityBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string;
  assignee: string;
}

interface TaskCardProps {
  task: Task;
  showAssignee?: boolean;
  className?: string;
}

export const TaskCard = ({ task, showAssignee = true, className }: TaskCardProps) => {
  return (
    <Link
      to={`/tasks/${task.id}`}
      className={cn(
        "block p-5 rounded-xl bg-card border border-border transition-all duration-300 hover:border-primary/30 hover:shadow-lg group",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
            {task.title}
          </h4>
          <div className="flex items-center gap-4 mt-3">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{task.dueDate}</span>
        </div>
        {showAssignee && (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>{task.assignee}</span>
          </div>
        )}
      </div>
    </Link>
  );
};
