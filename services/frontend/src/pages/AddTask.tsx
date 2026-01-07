import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { ArrowLeft, CalendarIcon, Upload, X } from "lucide-react";
import { toast } from "../hooks/use-toast";
import { cn } from "../lib/utils";
import { teamsAPI, tasksAPI, authAPI, type TeamDetails as APITeamDetails, type TeamMember as APITeamMember, type User as APIUser } from "../lib/api";

const AddTask = () => {
  const { id: _id } = useParams();
  const navigate = useNavigate();
  
  const [team, setTeam] = useState<APITeamDetails | null>(null);
  const [teamMembers, setTeamMembers] = useState<APITeamMember[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);
  
  const [formData, setFormData] = useState({
    taskName: "",
    description: "",
    dueDate: undefined as Date | undefined,
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH",
    assignedMemberId: "" as string | number,
    attachments: [] as File[],
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch team details
  useEffect(() => {
    const fetchTeam = async () => {
      if (!_id) return;
      
      try {
        setIsLoadingTeam(true);
        const teamDetails = await teamsAPI.getTeamDetails(parseInt(_id));
        setTeam(teamDetails);
        setTeamMembers(teamDetails.members);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch team details";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        navigate(`/teams/${_id}`);
      } finally {
        setIsLoadingTeam(false);
      }
    };
    
    fetchTeam();
  }, [_id, navigate]);

  const handleInputChange = (field: string, value: string | Date | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMemberSelect = (memberId: number) => {
    setFormData((prev) => ({
      ...prev,
      assignedMemberId: prev.assignedMemberId === memberId ? "" : memberId,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(
      (file) => file.type === "application/pdf" || file.type === "image/jpeg" || file.type === "image/jpg"
    );
    
    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid file type",
        description: "Only PDF and JPG files are allowed.",
        variant: "destructive",
      });
    }
    
    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...validFiles],
    }));
  };

  const removeAttachment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.taskName || !formData.description || !formData.dueDate || !formData.priority || !formData.assignedMemberId) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields including assigned member.",
        variant: "destructive",
      });
      return;
    }

    if (!_id || !team) {
      toast({
        title: "Error",
        description: "Team information is missing.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Format due date to ISO string
      const dueDateISO = formData.dueDate.toISOString();
      
      // Create task with files via API using FormData
      await tasksAPI.createTaskWithFiles({
        title: formData.taskName,
        description: formData.description,
        assigned_to_user_id: typeof formData.assignedMemberId === 'string' ? parseInt(formData.assignedMemberId) : formData.assignedMemberId,
        team_id: parseInt(_id),
        priority: formData.priority,
        due_date: dueDateISO,
        status: 'TODO',
      }, formData.attachments);
      
      toast({
        title: "Task created!",
        description: `${formData.taskName} has been created successfully.`,
      });
      
      navigate(`/teams/${_id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create task";
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
          to={`/teams/${_id}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Team
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create New Task</h1>
          <p className="text-muted-foreground mt-1">
            {isLoadingTeam ? "Loading team..." : team ? `Add a new task to ${team.name}` : "Add a new task"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Name */}
          <div className="space-y-2">
            <Label htmlFor="taskName">
              Task Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="taskName"
              value={formData.taskName}
              onChange={(e) => handleInputChange("taskName", e.target.value)}
              placeholder="Enter task name"
              className="h-12 bg-card border-border"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Task Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter task description"
              className="min-h-[120px] bg-card border-border"
              required
            />
          </div>

          {/* Due Date and Priority Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">
                Due Date <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate ? formData.dueDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : undefined;
                    handleInputChange("dueDate", date);
                  }}
                  className="pl-10 h-12 bg-card border-border"
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">
                Priority <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                <SelectTrigger className="h-12 bg-card border-border">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assigned Member */}
          <div className="space-y-2">
            <Label>
              Assigned Member <span className="text-destructive">*</span>
            </Label>
            {isLoadingTeam ? (
              <p className="text-sm text-muted-foreground">Loading team members...</p>
            ) : teamMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No team members available</p>
            ) : (
              <div className="p-4 rounded-lg border border-border bg-card space-y-3 max-h-64 overflow-y-auto">
                {teamMembers.map((member) => (
                  <div key={member.user_id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`member-${member.user_id}`}
                      checked={formData.assignedMemberId === member.user_id}
                      onCheckedChange={() => handleMemberSelect(member.user_id)}
                    />
                    <Label
                      htmlFor={`member-${member.user_id}`}
                      className="flex-1 cursor-pointer font-normal"
                    >
                      {member.user_full_name} <span className="text-muted-foreground">({member.role})</span>
                    </Label>
                  </div>
                ))}
              </div>
            )}
            {!formData.assignedMemberId && (
              <p className="text-sm text-muted-foreground">Select a team member to assign this task</p>
            )}
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label htmlFor="attachments">Attachments (Optional)</Label>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  id="attachments"
                  type="file"
                  accept=".pdf,.jpg,.jpeg"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Label
                  htmlFor="attachments"
                  className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg cursor-pointer hover:bg-secondary transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload Files (PDF or JPG)
                </Label>
                <span className="text-sm text-muted-foreground">
                  {formData.attachments.length} file(s) selected
                </span>
              </div>
              
              {formData.attachments.length > 0 && (
                <div className="space-y-2">
                  {formData.attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                    >
                      <span className="text-sm text-foreground truncate flex-1">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/teams/${_id}`)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? "Creating Task..." : "Create Task"}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default AddTask;

