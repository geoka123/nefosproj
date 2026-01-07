import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ArrowLeft, Users } from "lucide-react";
import { toast } from "../hooks/use-toast";
import { authAPI, teamsAPI, type User as APIUser } from "../lib/api";

const AddTeam = () => {
  const { id: teamId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!teamId;
  
  const [formData, setFormData] = useState({
    teamName: "",
    description: "",
    leader: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [users, setUsers] = useState<APIUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Fetch all users for the dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const apiUsers = await authAPI.getAllUsers();
        // Filter to only active users with Team Leader role
        const teamLeaders = apiUsers.filter(user => 
          user.is_active && (user.role === 'TEAM_LEADER' || user.role_display === 'Team Leader')
        );
        setUsers(teamLeaders);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch users";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoadingUsers(false);
        if (!isEditMode) {
          setIsDataLoaded(true);
        }
      }
    };

    fetchUsers();
  }, [isEditMode]);

  // Load team data if editing (after users are loaded)
  useEffect(() => {
    const loadTeamData = async () => {
      if (isEditMode && teamId && !isLoadingUsers) {
        try {
          setIsLoadingTeam(true);
          const teamDetails = await teamsAPI.getTeamDetails(parseInt(teamId));
          
          // Find the current leader (member with role "Team Leader")
          const currentLeader = teamDetails.members.find(m => m.role === "Team Leader");
          
          // Find the user ID for the current leader by matching full name
          let leaderId = "";
          if (currentLeader) {
            const leaderUser = users.find(u => {
              const firstName = u.first_name || '';
              const lastName = u.last_name || '';
              const fullName = `${firstName} ${lastName}`.trim() || u.email;
              return fullName === currentLeader.user_full_name;
            });
            if (leaderUser) {
              leaderId = leaderUser.id.toString();
            }
          }
          
          // Pre-populate form with team data
          setFormData({
            teamName: teamDetails.name,
            description: teamDetails.description,
            leader: leaderId,
          });
          
          setIsDataLoaded(true);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to load team data";
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
          navigate("/teams");
        } finally {
          setIsLoadingTeam(false);
        }
      }
    };

    loadTeamData();
  }, [teamId, isEditMode, navigate, users, isLoadingUsers]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.teamName || !formData.description) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.leader) {
      toast({
        title: "Missing required fields",
        description: "Please select a team leader.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      if (isEditMode && teamId) {
        // Find the selected user to get their full name
        const selectedUser = users.find(u => u.id.toString() === formData.leader);
        if (!selectedUser) {
          toast({
            title: "Error",
            description: "Selected leader not found.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Get full name from user
        const firstName = selectedUser.first_name || '';
        const lastName = selectedUser.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim() || selectedUser.email;

        // Update team via API
        await teamsAPI.updateTeam(parseInt(teamId), formData.teamName, formData.description, fullName, selectedUser.id);
        
        toast({
          title: "Team updated!",
          description: `${formData.teamName} has been updated successfully.`,
        });
        navigate(`/teams/${teamId}`);
      } else {
        // Find the selected user to get their full name
        const selectedUser = users.find(u => u.id.toString() === formData.leader);
        if (!selectedUser) {
          toast({
            title: "Error",
            description: "Selected leader not found.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Get full name from user
        const firstName = selectedUser.first_name || '';
        const lastName = selectedUser.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim() || selectedUser.email;

        // Create team via API with user ID
        await teamsAPI.createTeam(formData.teamName, formData.description, fullName, selectedUser.id);
        
        toast({
          title: "Team created!",
          description: `${formData.teamName} has been created successfully with ${fullName} as leader.`,
        });
        navigate("/teams");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : (isEditMode ? "Failed to update team" : "Failed to create team");
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-3xl">
        {/* Back Button */}
        <Link
          to={isEditMode && teamId ? `/teams/${teamId}` : "/teams"}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {isEditMode ? "Back to Team" : "Back to Teams"}
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{isEditMode ? "Edit Team" : "Create New Team"}</h1>
          <p className="text-muted-foreground mt-1">
            {isEditMode ? "Update team information" : "Add a new team to organize your projects"}
          </p>
        </div>

        {/* Loading state for edit mode */}
        {isEditMode && isLoadingTeam && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading team data...</p>
          </div>
        )}

        {/* Form */}
        {(!isEditMode || isDataLoaded) && (
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Team Name */}
          <div className="space-y-2">
            <Label htmlFor="teamName">
              Team Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="teamName"
              value={formData.teamName}
              onChange={(e) => handleInputChange("teamName", e.target.value)}
              placeholder="Enter team name"
              className="h-12 bg-card border-border"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Team Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter team description"
              className="min-h-[120px] bg-card border-border"
              required
            />
          </div>

          {/* Leader */}
          <div className="space-y-2">
            <Label htmlFor="leader">
              Team Leader <span className="text-destructive">*</span>
            </Label>
            {isLoadingUsers ? (
              <div className="h-12 flex items-center text-muted-foreground">
                Loading users...
              </div>
            ) : isDataLoaded ? (
              <Select 
                value={formData.leader || undefined} 
                onValueChange={(value) => handleInputChange("leader", value)}
                key={`leader-select-${formData.leader}`}
              >
                <SelectTrigger className="h-12 bg-card border-border">
                  <SelectValue placeholder="Select a team leader" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {users.map((user) => {
                    const firstName = user.first_name || '';
                    const lastName = user.last_name || '';
                    const fullName = `${firstName} ${lastName}`.trim() || user.email;
                    return (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {fullName} ({user.role_display || user.role})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            ) : null}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(isEditMode && teamId ? `/teams/${teamId}` : "/teams")}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isLoadingTeam}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? (isEditMode ? "Updating Team..." : "Creating Team...") : (isEditMode ? "Update Team" : "Create Team")}
            </Button>
          </div>
        </form>
        )}
      </div>
    </AppLayout>
  );
};

export default AddTeam;

