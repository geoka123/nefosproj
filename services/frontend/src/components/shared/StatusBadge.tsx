import { cn } from "@/lib/utils";

type Status = "TODO" | "IN_PROGRESS" | "DONE";
type Priority = "LOW" | "MEDIUM" | "HIGH";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const statusStyles = {
    TODO: "bg-status-todo/20 text-status-todo",
    IN_PROGRESS: "bg-status-in-progress/20 text-status-in-progress",
    DONE: "bg-status-done/20 text-status-done",
  };

  const statusLabels = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    DONE: "Done",
  };

  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-xs font-medium",
      statusStyles[status],
      className
    )}>
      {statusLabels[status]}
    </span>
  );
};

export const PriorityBadge = ({ priority, className }: PriorityBadgeProps) => {
  const priorityStyles = {
    LOW: "bg-[hsl(var(--priority-low))]/20 text-[hsl(var(--priority-low))]",
    MEDIUM: "bg-[hsl(var(--priority-medium))]/20 text-[hsl(var(--priority-medium))]",
    HIGH: "bg-[hsl(var(--priority-high))]/20 text-[hsl(var(--priority-high))]",
  };

  const priorityLabels = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
  };

  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5",
      priorityStyles[priority],
      className
    )}>
      <span className={cn(
        "w-2 h-2 rounded-full",
        priority === "LOW" && "bg-[hsl(var(--priority-low))]",
        priority === "MEDIUM" && "bg-[hsl(var(--priority-medium))]",
        priority === "HIGH" && "bg-[hsl(var(--priority-high))]",
      )} />
      {priorityLabels[priority]}
    </span>
  );
};
