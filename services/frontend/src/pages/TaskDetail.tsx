import { useParams, Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge, PriorityBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Clock, 
  Paperclip, 
  Send,
  Edit,
  Trash2,
  Download,
  ExternalLink,
  Upload,
  X,
  Save
} from "lucide-react";
import { useState, useEffect } from "react";
import { tasksAPI, authAPI, type TaskDetails as APITaskDetails, type TaskComment, type TaskFile, type CommentFile, type User as APIUser } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState<APITaskDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [assigneeUser, setAssigneeUser] = useState<APIUser | null>(null);
  const [creatorUser, setCreatorUser] = useState<APIUser | null>(null);
  const [commentUsers, setCommentUsers] = useState<Record<number, APIUser>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [newCommentFiles, setNewCommentFiles] = useState<File[]>([]);
  const [commentFiles, setCommentFiles] = useState<Record<string, File[]>>({});
  const [uploadingCommentFiles, setUploadingCommentFiles] = useState<Record<string, boolean>>({});
  
  // Check user role (will be computed after task is loaded)
  const isAdmin = user && (user.role === 'ADMIN' || user.role_display === 'Admin');
  const isTeamLeader = user && (user.role === 'TEAM_LEADER' || user.role_display === 'Team Leader');
  const isAssignedUser = user && task && user.id === task.assigned_to_user_id;
  const canEdit = (isTeamLeader || isAssignedUser) && !isAdmin;
  const canDelete = isTeamLeader && !isAdmin;
  const canChangeStatus = (isTeamLeader || isAssignedUser) && !isAdmin;

  // Fetch task details
  useEffect(() => {
    const fetchTask = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const taskDetails = await tasksAPI.getTaskDetails(id);
        setTask(taskDetails);
        
        // Fetch user details for assignee, creator, and comment authors
        try {
          const userIdsToFetch = [
            taskDetails.assigned_to_user_id,
            taskDetails.created_by_user_id,
            ...taskDetails.comments.map(c => c.created_by_user_id),
          ].filter((id): id is number => id !== null && id !== undefined);
          
          const uniqueUserIds = [...new Set(userIdsToFetch)];
          
          if (uniqueUserIds.length > 0) {
            const users = await authAPI.getUsersByIds(uniqueUserIds);
            const usersMap: Record<number, APIUser> = {};
            users.forEach(user => {
              usersMap[user.id] = user;
            });
            
            if (taskDetails.assigned_to_user_id && usersMap[taskDetails.assigned_to_user_id]) {
              setAssigneeUser(usersMap[taskDetails.assigned_to_user_id]);
            }
            if (taskDetails.created_by_user_id && usersMap[taskDetails.created_by_user_id]) {
              setCreatorUser(usersMap[taskDetails.created_by_user_id]);
            }
            
            setCommentUsers(usersMap);
          }
        } catch (error) {
          console.error('Failed to fetch user details:', error);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch task details";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTask();
  }, [id]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !id) return;
    
    try {
      setIsAddingComment(true);
      await tasksAPI.addComment(id, newComment.trim(), newCommentFiles);
      
      // Refresh task details to get new comment
      const taskDetails = await tasksAPI.getTaskDetails(id);
      setTask(taskDetails);
      
      // Fetch user details for new comment
      try {
        const allUsers = await authAPI.getAllUsers();
        const newComment = taskDetails.comments[taskDetails.comments.length - 1];
        const commentUser = allUsers.find(u => u.id === newComment.created_by_user_id);
        if (commentUser) {
          setCommentUsers(prev => ({ ...prev, [commentUser.id]: commentUser }));
        }
      } catch (error) {
        console.error('Failed to fetch user details:', error);
      }
      
      setNewComment("");
      setNewCommentFiles([]);
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add comment";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleNewCommentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    
    setNewCommentFiles((prev) => [...prev, ...validFiles]);
  };

  const removeNewCommentFile = (index: number) => {
    setNewCommentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteTask = async () => {
    if (!id || !task) return;
    
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) {
      return;
    }
    
    try {
      await tasksAPI.deleteTask(id);
      toast({
        title: "Task deleted",
        description: "The task has been deleted successfully.",
      });
      navigate("/teams");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete task";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    if (!id || !task) return;
    
    try {
      await tasksAPI.updateTaskStatus(id, newStatus);
      
      // Refresh task details
      const taskDetails = await tasksAPI.getTaskDetails(id);
      setTask(taskDetails);
      
      toast({
        title: "Status updated",
        description: `Task status has been updated to ${newStatus}.`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update status";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl space-y-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading task details...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!task) {
    return (
      <AppLayout>
        <div className="max-w-4xl space-y-8">
          <Link
            to="/teams"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Teams
          </Link>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Task not found.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Format dates
  const dueDate = new Date(task.due_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const createdAt = new Date(task.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Get user names and initials
  const getInitials = (user: APIUser | null) => {
    if (!user) return "?";
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return (firstName || user.email || '?')[0].toUpperCase();
  };

  const getUserName = (user: APIUser | null) => {
    if (!user) return "Unknown User";
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    return `${firstName} ${lastName}`.trim() || user.email || "Unknown User";
  };

  const handleStartEdit = () => {
    setEditTitle(task.title);
    setEditDescription(task.description);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle("");
    setEditDescription("");
  };

  const handleSaveEdit = async () => {
    if (!task) return;
    
    setIsSaving(true);
    try {
      await tasksAPI.updateTask(task.id, {
        title: editTitle,
        description: editDescription,
      });
      
      // Refresh task details
      const taskDetails = await tasksAPI.getTaskDetails(task.id);
      setTask(taskDetails);
      setIsEditing(false);
      
      toast({
        title: "Task updated",
        description: "Task title and description have been updated successfully.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update task";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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
    
    setNewFiles((prev) => [...prev, ...validFiles]);
  };

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadFiles = async () => {
    if (!task || newFiles.length === 0) return;
    
    setIsUploadingFiles(true);
    try {
      await tasksAPI.attachFiles(task.id, newFiles);
      
      // Refresh task details
      const taskDetails = await tasksAPI.getTaskDetails(task.id);
      setTask(taskDetails);
      setNewFiles([]);
      
      toast({
        title: "Files uploaded",
        description: "Files have been uploaded successfully.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload files";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const handleCommentFileChange = (commentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
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
    
    setCommentFiles((prev) => ({
      ...prev,
      [commentId]: [...(prev[commentId] || []), ...validFiles],
    }));
  };

  const removeCommentFile = (commentId: string, index: number) => {
    setCommentFiles((prev) => ({
      ...prev,
      [commentId]: (prev[commentId] || []).filter((_, i) => i !== index),
    }));
  };

  const handleUploadCommentFiles = async (commentId: string) => {
    if (!task || !id || !commentFiles[commentId] || commentFiles[commentId].length === 0) return;
    
    setUploadingCommentFiles((prev) => ({ ...prev, [commentId]: true }));
    try {
      await tasksAPI.attachCommentFiles(id, commentId, commentFiles[commentId]);
      
      // Refresh task details
      const taskDetails = await tasksAPI.getTaskDetails(id);
      setTask(taskDetails);
      setCommentFiles((prev) => ({ ...prev, [commentId]: [] }));
      
      toast({
        title: "Files uploaded",
        description: "Files have been uploaded to comment successfully.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload files";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploadingCommentFiles((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const handleViewCommentFile = async (commentId: string, file: CommentFile) => {
    if (!id) return;
    try {
      const blob = await tasksAPI.downloadCommentFile(id, commentId, file.id, false);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open file",
        variant: "destructive",
      });
    }
  };

  const handleDownloadCommentFile = async (commentId: string, file: CommentFile) => {
    if (!id) return;
    try {
      const blob = await tasksAPI.downloadCommentFile(id, commentId, file.id, true);
      const url = window.URL.createObjectURL(blob);
      const fileName = file.file.split('/').pop() || file.file;
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!id || !confirm("Are you sure you want to delete this comment?")) return;
    
    try {
      await tasksAPI.deleteComment(id, commentId);
      
      // Refresh task details
      const taskDetails = await tasksAPI.getTaskDetails(id);
      setTask(taskDetails);
      
      toast({
        title: "Comment deleted",
        description: "The comment has been deleted successfully.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete comment";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDeleteCommentFile = async (commentId: string, fileId: string) => {
    if (!id || !confirm("Are you sure you want to delete this file?")) return;
    
    try {
      await tasksAPI.deleteCommentFile(id, commentId, fileId);
      
      // Refresh task details
      const taskDetails = await tasksAPI.getTaskDetails(id);
      setTask(taskDetails);
      
      toast({
        title: "File deleted",
        description: "The file has been deleted successfully.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete file";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-8">
        {/* Back Button */}
        <Link
          to="/teams"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Teams
        </Link>

        {/* Task Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {canChangeStatus && (
                <Select value={task.status} onValueChange={(value) => handleStatusChange(value as 'TODO' | 'IN_PROGRESS' | 'DONE')}>
                  <SelectTrigger className="w-32 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">TODO</SelectItem>
                    <SelectItem value="IN_PROGRESS">IN PROGRESS</SelectItem>
                    <SelectItem value="DONE">DONE</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            {isEditing ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-3xl font-bold h-auto py-2 bg-card border-border"
                placeholder="Task title"
              />
            ) : (
              <h1 className="text-3xl font-bold text-foreground">{task.title}</h1>
            )}
          </div>
          {isTeamLeader && !isAdmin && (
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    disabled={isSaving || !editTitle.trim() || !editDescription.trim()}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleStartEdit}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  {canDelete && (
                    <Button 
                      variant="outline" 
                      className="gap-2 border-destructive text-destructive hover:bg-destructive/10"
                      onClick={handleDeleteTask}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
          {canDelete && !isTeamLeader && (
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="gap-2 border-destructive text-destructive hover:bg-destructive/10"
                onClick={handleDeleteTask}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Task Info Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-xs text-muted-foreground mb-1">Assigned to</p>
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {getInitials(assigneeUser)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground">{getUserName(assigneeUser)}</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-xs text-muted-foreground mb-1">Created by</p>
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                  {getInitials(creatorUser)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground">{getUserName(creatorUser)}</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-xs text-muted-foreground mb-1">Due Date</p>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{dueDate}</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-xs text-muted-foreground mb-1">Created</p>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{createdAt}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-3">Description</h2>
          {isEditing ? (
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="min-h-[120px] bg-card border-border"
              placeholder="Task description"
            />
          ) : (
            <p className="text-muted-foreground leading-relaxed">{task.description}</p>
          )}
        </div>

        {/* Attachments */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Paperclip className="w-5 h-5" />
            Attachments
          </h2>
          
          {/* Add Files Section (Team Leader only) */}
          {isTeamLeader && !isAdmin && (
            <div className="mb-6 p-4 rounded-lg bg-secondary/50 border border-border">
              <Label htmlFor="newFiles" className="text-sm font-medium text-foreground mb-3 block">
                Add Files
              </Label>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input
                    id="newFiles"
                    type="file"
                    accept=".pdf,.jpg,.jpeg"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Label
                    htmlFor="newFiles"
                    className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg cursor-pointer hover:bg-secondary transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Files (PDF or JPG)
                  </Label>
                  {newFiles.length > 0 && (
                    <Button
                      onClick={handleUploadFiles}
                      disabled={isUploadingFiles}
                      size="sm"
                    >
                      {isUploadingFiles ? "Uploading..." : "Upload"}
                    </Button>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {newFiles.length} file(s) selected
                  </span>
                </div>
                
                {newFiles.length > 0 && (
                  <div className="space-y-2">
                    {newFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
                      >
                        <span className="text-sm text-foreground truncate flex-1">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeNewFile(index)}
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
          )}
          
          {/* Existing Files */}
          {task.files && task.files.length > 0 ? (
            <div className="space-y-2">
              {task.files.map((file) => {
                const fileName = file.file.split('/').pop() || file.file;
                
                const handleViewFile = async () => {
                  try {
                    const blob = await tasksAPI.downloadFile(task.id, file.id, false);
                    const url = window.URL.createObjectURL(blob);
                    window.open(url, '_blank');
                    // Clean up the URL after a delay
                    setTimeout(() => window.URL.revokeObjectURL(url), 100);
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to open file",
                      variant: "destructive",
                    });
                  }
                };
                
                const handleDownloadFile = async () => {
                  try {
                    const blob = await tasksAPI.downloadFile(task.id, file.id, true);
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to download file",
                      variant: "destructive",
                    });
                  }
                };
                
                const handleDeleteFile = async () => {
                  if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
                    return;
                  }
                  
                  try {
                    await tasksAPI.deleteFile(task.id, file.id);
                    toast({
                      title: "File deleted",
                      description: "The file has been deleted successfully.",
                    });
                    // Refresh task details to update file list
                    const taskDetails = await tasksAPI.getTaskDetails(task.id);
                    setTask(taskDetails);
                  } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "Failed to delete file";
                    toast({
                      title: "Error",
                      description: errorMessage,
                      variant: "destructive",
                    });
                  }
                };
                
                return (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <button
                        onClick={handleViewFile}
                        className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate flex-1 text-left"
                        title={fileName}
                      >
                        {fileName}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={handleViewFile}
                        className="p-1.5 rounded hover:bg-secondary transition-colors"
                        title="View file"
                      >
                        <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </button>
                      <button
                        onClick={handleDownloadFile}
                        className="p-1.5 rounded hover:bg-secondary transition-colors"
                        title="Download file"
                      >
                        <Download className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </button>
                      {isTeamLeader && (
                        <button
                          onClick={handleDeleteFile}
                          className="p-1.5 rounded hover:bg-destructive/10 transition-colors"
                          title="Delete file"
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No files attached.</p>
          )}
        </div>

        {/* Comments */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Comments</h2>
          
          <div className="space-y-4 mb-6">
            {task.comments && task.comments.length > 0 ? (
              task.comments.map((comment) => {
                const commentUser = commentUsers[comment.created_by_user_id];
                const commentDate = new Date(comment.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
                
                return (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {getInitials(commentUser)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground text-sm">{getUserName(commentUser)}</span>
                          <span className="text-xs text-muted-foreground">{commentDate}</span>
                        </div>
                        {user && user.id === comment.created_by_user_id && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1 rounded hover:bg-destructive/10 transition-colors"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{comment.text}</p>
                      
                      {/* Comment Files */}
                      {comment.files && comment.files.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {comment.files.map((file) => {
                            const fileName = file.file.split('/').pop() || file.file;
                            const isCommentOwner = user && user.id === comment.created_by_user_id;
                            return (
                              <div
                                key={file.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 border border-border hover:border-primary/30 transition-colors"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <Paperclip className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                  <button
                                    onClick={() => handleViewCommentFile(comment.id, file)}
                                    className="text-xs font-medium text-foreground hover:text-primary transition-colors truncate flex-1 text-left"
                                    title={fileName}
                                  >
                                    {fileName}
                                  </button>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => handleViewCommentFile(comment.id, file)}
                                    className="p-1 rounded hover:bg-secondary transition-colors"
                                    title="View file"
                                  >
                                    <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                                  </button>
                                  <button
                                    onClick={() => handleDownloadCommentFile(comment.id, file)}
                                    className="p-1 rounded hover:bg-secondary transition-colors"
                                    title="Download file"
                                  >
                                    <Download className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                                  </button>
                                  {isCommentOwner && (
                                    <button
                                      onClick={() => handleDeleteCommentFile(comment.id, file.id)}
                                      className="p-1 rounded hover:bg-destructive/10 transition-colors"
                                      title="Delete file"
                                    >
                                      <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Attach Files Section - Only for comment owner */}
                      {user && user.id === comment.created_by_user_id && (
                      <div className="mt-3 p-3 rounded-lg bg-secondary/30 border border-border">
                        <Input
                          id={`commentFiles-${comment.id}`}
                          type="file"
                          accept=".pdf,.jpg,.jpeg"
                          multiple
                          onChange={(e) => handleCommentFileChange(comment.id, e)}
                          className="hidden"
                        />
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor={`commentFiles-${comment.id}`}
                            className="flex items-center gap-1.5 px-2 py-1 text-xs border border-border rounded cursor-pointer hover:bg-secondary transition-colors"
                          >
                            <Upload className="w-3 h-3" />
                            Attach Files
                          </Label>
                          {commentFiles[comment.id] && commentFiles[comment.id].length > 0 && (
                            <>
                              <Button
                                onClick={() => handleUploadCommentFiles(comment.id)}
                                disabled={uploadingCommentFiles[comment.id]}
                                size="sm"
                                className="h-7 text-xs px-2"
                              >
                                {uploadingCommentFiles[comment.id] ? "Uploading..." : "Upload"}
                              </Button>
                              <span className="text-xs text-muted-foreground">
                                {commentFiles[comment.id].length} file(s)
                              </span>
                            </>
                          )}
                        </div>
                        {commentFiles[comment.id] && commentFiles[comment.id].length > 0 && (
                          <div className="mt-2 space-y-1">
                            {commentFiles[comment.id].map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-1.5 rounded bg-card border border-border"
                              >
                                <span className="text-xs text-foreground truncate flex-1">{file.name}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeCommentFile(comment.id, index)}
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No comments yet.</p>
            )}
          </div>

          <div className="flex gap-3">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="bg-secondary border-border resize-none"
              rows={2}
            />
            <Button 
              onClick={handleAddComment}
              disabled={isAddingComment || !newComment.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default TaskDetail;
