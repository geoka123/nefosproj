import { Link } from "react-router-dom";
import { Users, ChevronRight, Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface Team {
  id: string;
  name: string;
  leader: string;
  memberCount: number;
  taskCount: number;
}

interface TeamCardProps {
  team: Team;
  className?: string;
  onDelete?: (teamId: string) => void;
}

export const TeamCard = ({ team, className, onDelete }: TeamCardProps) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(team.id);
    }
  };

  return (
    <Link
      to={`/teams/${team.id}`}
      className={cn(
        "block p-6 rounded-xl bg-card border border-border transition-all duration-300 hover:border-primary/30 hover:shadow-lg group",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors">
              {team.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Led by {team.leader}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </div>

      <div className="flex items-center gap-6 mt-6 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-foreground">{team.memberCount}</span>
          <span className="text-sm text-muted-foreground">Members</span>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-foreground">{team.taskCount}</span>
          <span className="text-sm text-muted-foreground">Tasks</span>
        </div>
      </div>

      {onDelete && (
        <button
          onClick={handleDelete}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors group/delete"
          aria-label={`Delete ${team.name}`}
        >
          <Trash2 className="w-4 h-4 transition-colors" />
          <span className="text-sm font-medium group-hover/delete:text-red-500 transition-colors">Delete Team</span>
        </button>
      )}
    </Link>
  );
};
