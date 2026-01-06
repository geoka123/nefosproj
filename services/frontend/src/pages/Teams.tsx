import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { TeamCard } from "@/components/teams/TeamCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { teamsAPI, type Team as APITeam } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface DisplayTeam {
  id: string;
  name: string;
  leader: string;
  memberCount: number;
  taskCount: number;
}

const Teams = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teams, setTeams] = useState<DisplayTeam[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if user is admin
  const isAdmin = user && (user.role === 'ADMIN' || user.role_display === 'Admin');

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      const apiTeams = await teamsAPI.listTeams();
      
      // Transform API teams to display format
      const transformedTeams: DisplayTeam[] = apiTeams.map((team: APITeam) => ({
        id: team.id.toString(),
        name: team.name,
        leader: team.leader_full_name || "No leader",
        memberCount: team.number_of_members,
        taskCount: 0, // Dummy number as API doesn't provide this yet
      }));
      
      setTeams(transformedTeams);
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
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteTeam = async (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;

    try {
      await teamsAPI.deleteTeam(parseInt(teamId));
      
      // Remove team from local state
      setTeams(teams.filter((t) => t.id !== teamId));
      
      toast({
        title: "Team deleted",
        description: `${team.name} has been deleted successfully.`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete team";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Teams</h1>
            <p className="text-muted-foreground mt-1">Manage and view all your teams</p>
          </div>
          {isAdmin && (
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              onClick={() => navigate("/teams/add")}
            >
              <Plus className="w-4 h-4" />
              Create Team
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-card border-border"
          />
        </div>

        {/* Teams Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading teams...</p>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? "No teams found matching your search." : "No teams found."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team) => (
              <TeamCard key={team.id} team={team} onDelete={isAdmin ? handleDeleteTeam : undefined} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Teams;
