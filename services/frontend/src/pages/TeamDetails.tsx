import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { TaskCard } from "@/components/tasks/TaskCard";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Users, Edit, UserPlus, Trash2, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { teamsAPI, authAPI, tasksAPI, type TeamDetails as APITeamDetails, type TeamMember as APITeamMember, type User as APIUser, type Task as APITask } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface DisplayMember {
  id: string;
  userId: number;
  name: string;
  role: string;
  initials: string;
}

const TeamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [team, setTeam] = useState<{
    id: string;
    name: string;
    description: string;
    leader: string;
    members: DisplayMember[];
  } | null>(null);
  const [tasks, setTasks] = useState<APITask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<APIUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [taskUsers, setTaskUsers] = useState<Record<number, APIUser>>({});

  // Check user role
  const isAdmin = user && (user.role === 'ADMIN' || user.role_display === 'Admin');
  const isTeamLeader = user && (user.role === 'TEAM_LEADER' || user.role_display === 'Team Leader');
  const isMember = user && !isAdmin && !isTeamLeader;

  // Fetch team details from API
  useEffect(() => {
    const fetchTeamDetails = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const teamDetails = await teamsAPI.getTeamDetails(parseInt(id));
        
        // Find the leader (member with role "Team Leader")
        const leader = teamDetails.members.find(m => m.role === "Team Leader");
        const leaderName = leader?.user_full_name || "No leader";
        
        // Transform API members to display format
        const displayMembers: DisplayMember[] = teamDetails.members.map((member: APITeamMember, index: number) => {
          const nameParts = member.user_full_name.split(' ');
          const initials = nameParts.length >= 2
            ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
            : member.user_full_name[0].toUpperCase();
          
          return {
            id: `member-${index}`,
            userId: member.user_id,
            name: member.user_full_name,
            role: member.role,
            initials,
          };
        });
        
        setTeam({
          id: teamDetails.id.toString(),
          name: teamDetails.name,
          description: teamDetails.description,
          leader: leaderName,
          members: displayMembers,
        });
        
        // Fetch tasks for this team
        try {
          setIsLoadingTasks(true);
          const teamTasks = await tasksAPI.listTasks({ team_id: parseInt(id) });
          setTasks(teamTasks);
          
          // Fetch user details for task assignees
          try {
            const allUsers = await authAPI.getAllUsers();
            const taskUserIds = [...new Set(teamTasks.map(t => t.assigned_to_user_id))];
            const usersMap: Record<number, APIUser> = {};
            taskUserIds.forEach(userId => {
              const user = allUsers.find(u => u.id === userId);
              if (user) usersMap[userId] = user;
            });
            setTaskUsers(usersMap);
          } catch (error) {
            console.error('Failed to fetch user details for tasks:', error);
          }
        } catch (error) {
          console.error('Failed to fetch tasks:', error);
          // Don't show error toast for tasks, just log it
        } finally {
          setIsLoadingTasks(false);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch team details";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamDetails();
  }, [id]);

  // Fetch available users for add member dropdown
  useEffect(() => {
    const fetchAvailableUsers = async () => {
      if (!id || !team) return;
      
      try {
        setIsLoadingUsers(true);
        const allUsers = await authAPI.getAllUsers();
        
        // Filter out users who are already team members (show all users regardless of active status)
        const teamMemberIds = team.members.map(m => m.userId);
        const available = allUsers.filter(user => 
          !teamMemberIds.includes(user.id)
        );
        
        setAvailableUsers(available);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch users";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoadingUsers(false);
      }
    };

    if (team) {
      fetchAvailableUsers();
    }
  }, [id, team]);

  // Show loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-8">
          <Link
            to="/teams"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Teams
          </Link>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading team details...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // If team not found, show error or redirect
  if (!team) {
    return (
      <AppLayout>
        <div className="space-y-8">
          <Link
            to="/teams"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Teams
          </Link>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Team not found.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const handleDeleteTeam = async () => {
    if (!id || !team) return;

    try {
      await teamsAPI.deleteTeam(parseInt(id));
      
      toast({
        title: "Team deleted",
        description: `${team.name} has been deleted successfully.`,
      });
      
      navigate("/teams");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete team";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleMemberToggle = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddMembers = async () => {
    if (!id || !team) return;
    
    if (selectedMembers.length === 0) {
      toast({
        title: "No members selected",
        description: "Please select at least one member to add.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Add each selected member
      for (const userIdStr of selectedMembers) {
        const userId = parseInt(userIdStr);
        const user = availableUsers.find(u => u.id === userId);
        
        if (!user) {
          toast({
            title: "Error",
            description: `User with ID ${userId} not found.`,
            variant: "destructive",
          });
          continue;
        }

        // Get full name from user
        const firstName = user.first_name || '';
        const lastName = user.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim() || user.email;

        await teamsAPI.addMember(parseInt(id), userId, fullName);
      }

      toast({
        title: "Members added!",
        description: `${selectedMembers.length} member(s) have been added to ${team.name}.`,
      });

      // Refresh team details
      const teamDetails = await teamsAPI.getTeamDetails(parseInt(id));
      const leader = teamDetails.members.find(m => m.role === "Team Leader");
      const leaderName = leader?.user_full_name || "No leader";
      
      const displayMembers: DisplayMember[] = teamDetails.members.map((member: APITeamMember, index: number) => {
        const nameParts = member.user_full_name.split(' ');
        const initials = nameParts.length >= 2
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
          : member.user_full_name[0].toUpperCase();
        
        return {
          id: `member-${index}`,
          userId: member.user_id,
          name: member.user_full_name,
          role: member.role,
          initials,
        };
      });
      
      setTeam({
        ...team,
        members: displayMembers,
        leader: leaderName,
      });

      setSelectedMembers([]);
      setIsAddMemberOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add members";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (memberUserId: number, memberName: string) => {
    if (!id || !team) return;
    
    // Don't allow removing the leader
    if (team.leader === memberName) {
      toast({
        title: "Cannot remove leader",
        description: "Please assign a new leader before removing the current leader.",
        variant: "destructive",
      });
      return;
    }

    try {
      await teamsAPI.removeMember(parseInt(id), memberUserId);

      toast({
        title: "Member removed",
        description: `${memberName} has been removed from ${team.name}.`,
      });

      // Refresh team details
      const teamDetails = await teamsAPI.getTeamDetails(parseInt(id));
      const leader = teamDetails.members.find(m => m.role === "Team Leader");
      const leaderName = leader?.user_full_name || "No leader";
      
      const displayMembers: DisplayMember[] = teamDetails.members.map((member: APITeamMember, index: number) => {
        const nameParts = member.user_full_name.split(' ');
        const initials = nameParts.length >= 2
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
          : member.user_full_name[0].toUpperCase();
        
        return {
          id: `member-${index}`,
          userId: member.user_id,
          name: member.user_full_name,
          role: member.role,
          initials,
        };
      });
      
      setTeam({
        ...team,
        members: displayMembers,
        leader: leaderName,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to remove member";
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
        {/* Back Button */}
        <Link
          to="/teams"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Teams
        </Link>

        {/* Team Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{team.name}</h1>
              <p className="text-muted-foreground mt-1 max-w-xl">{team.description}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Led by <span className="text-foreground font-medium">{team.leader}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {!isTeamLeader && !isMember && (
              <>
                <Button 
                  variant="outline" 
                  className="gap-2 border-border hover:bg-secondary"
                  onClick={() => navigate(`/teams/${id}/edit`)}
                >
                  <Edit className="w-4 h-4" />
                  Edit Team
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                  onClick={handleDeleteTeam}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Team
                </Button>
              </>
            )}
            {!isMember && !isAdmin && (
              <Button 
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                onClick={() => navigate(`/teams/${id}/add-task`)}
              >
                <Plus className="w-4 h-4" />
                Add Task
              </Button>
            )}
          </div>
        </div>

        {/* Team Members */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Team Members</h2>
            {!isAdmin && !isMember && (
              <Popover open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 text-primary hover:bg-primary/10">
                    <UserPlus className="w-4 h-4" />
                    Add Member
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-card border-border" align="end">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Add Team Members</h3>
                      <p className="text-sm text-muted-foreground">
                        Select members to add to {team.name}
                      </p>
                    </div>
                    
                    {isLoadingUsers ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        Loading users...
                      </p>
                    ) : availableUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        All available users are already in this team.
                      </p>
                    ) : (
                      <>
                        <div className="max-h-64 overflow-y-auto space-y-2 border border-border rounded-lg p-3">
                          {availableUsers.map((user) => {
                            const firstName = user.first_name || '';
                            const lastName = user.last_name || '';
                            const fullName = `${firstName} ${lastName}`.trim() || user.email;
                            const initials = firstName && lastName
                              ? `${firstName[0]}${lastName[0]}`.toUpperCase()
                              : firstName
                              ? firstName[0].toUpperCase()
                              : user.email[0].toUpperCase();
                            
                            return (
                              <div key={user.id} className="flex items-center space-x-3">
                                <Checkbox
                                  id={`add-member-${user.id}`}
                                  checked={selectedMembers.includes(user.id.toString())}
                                  onCheckedChange={() => handleMemberToggle(user.id.toString())}
                                />
                                <Label
                                  htmlFor={`add-member-${user.id}`}
                                  className="flex-1 cursor-pointer font-normal flex items-center gap-2"
                                >
                                  <Avatar className="w-6 h-6">
                                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                      {initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <span className="text-sm text-foreground">{fullName}</span>
                                    <span className="text-xs text-muted-foreground ml-2">
                                      ({user.role_display || user.role}) {!user.is_active && <span className="text-destructive">• Inactive</span>}
                                    </span>
                                  </div>
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMembers([]);
                              setIsAddMemberOpen(false);
                            }}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleAddMembers}
                            disabled={selectedMembers.length === 0}
                            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            Add {selectedMembers.length > 0 ? `(${selectedMembers.length})` : ""}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
          <div className="flex flex-wrap gap-4">
            {team.members.map((member) => (
              <div
                key={member.id}
                className="group relative flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border hover:bg-secondary/70 transition-colors"
              >
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/20 text-primary text-sm">
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
                {!isAdmin && !isMember && !(isTeamLeader && member.role === "Team Leader") && (
                  <button
                    onClick={() => handleRemoveMember(member.userId, member.name)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    title="Remove member from team"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Team Tasks */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Team Tasks</h2>
          {isLoadingTasks ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No tasks found for this team.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((task) => {
                // Format due date
                const dueDate = new Date(task.due_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
                
                // Get assignee name
                const assigneeUser = taskUsers[task.assigned_to_user_id];
                let assigneeName = `User ${task.assigned_to_user_id}`;
                if (assigneeUser) {
                  const firstName = assigneeUser.first_name || '';
                  const lastName = assigneeUser.last_name || '';
                  assigneeName = `${firstName} ${lastName}`.trim() || assigneeUser.email || assigneeName;
                }
                
                return (
                  <TaskCard
                    key={task.id}
                    task={{
                      id: task.id,
                      title: task.title,
                      status: task.status,
                      priority: task.priority,
                      dueDate,
                      assignee: assigneeName,
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default TeamDetails;
