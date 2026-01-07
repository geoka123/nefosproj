import { useState, useEffect } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { 
  Search, 
  UserCheck, 
  UserX, 
  MoreVertical,
  Trash2,
  Edit
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { cn } from "../lib/utils";
import { authAPI, type User as APIUser } from "../lib/api";
import { toast } from "../hooks/use-toast";
import { useAuth } from "../contexts/AuthContext";

interface DisplayUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  initials: string;
}

const AdminPanel = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<DisplayUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<DisplayUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const apiUsers = await authAPI.getAllUsers();
      
      // Transform API users to display format
      const transformedUsers: DisplayUser[] = apiUsers.map((user: APIUser) => {
        const firstName = user.first_name || '';
        const lastName = user.last_name || '';
        const name = `${firstName} ${lastName}`.trim() || user.email;
        const initials = 
          firstName && lastName 
            ? `${firstName[0]}${lastName[0]}`.toUpperCase()
            : firstName
            ? firstName[0].toUpperCase()
            : user.email[0].toUpperCase();
        
        return {
          id: user.id.toString(),
          name,
          email: user.email,
          role: user.role_display, // Use role_display from API
          status: user.is_active ? "active" : "inactive", // Map is_active to status
          initials,
        };
      });
      
      setUsers(transformedUsers);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch users";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChangeRoleClick = (user: DisplayUser) => {
    // Only allow role changes for Team Leader and Member (not Admin)
    if (user.role === 'Admin') {
      toast({
        title: "Cannot change role",
        description: "Admin role cannot be changed.",
        variant: "destructive",
      });
      return;
    }

    // Map display role back to API role value
    const roleMap: Record<string, string> = {
      'Member': 'MEMBER',
      'Team Leader': 'TEAM_LEADER',
    };
    setSelectedUser(user);
    setSelectedRole(roleMap[user.role] || 'MEMBER');
    setRoleDialogOpen(true);
  };

  const handleRoleUpdate = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      setIsUpdatingRole(true);
      await authAPI.updateUserRole(parseInt(selectedUser.id), selectedRole);
      
      toast({
        title: "Success",
        description: `User role updated successfully.`,
      });
      
      setRoleDialogOpen(false);
      setSelectedUser(null);
      setSelectedRole("");
      
      // Refresh users list
      await fetchUsers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update user role";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleActivateDeactivate = async (user: DisplayUser) => {
    try {
      await authAPI.activateDeactivateUser(parseInt(user.id));
      
      const action = user.status === "active" ? "deactivated" : "activated";
      toast({
        title: "Success",
        description: `User has been ${action} successfully.`,
      });
      
      // Refresh users list
      await fetchUsers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update user status";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (user: DisplayUser) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      setIsDeleting(true);
      await authAPI.deleteUser(parseInt(userToDelete.id));
      
      toast({
        title: "Success",
        description: `User has been deleted successfully.`,
      });
      
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      
      // Refresh users list
      await fetchUsers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete user";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-status-done/20 text-status-done";
      case "pending":
        return "bg-status-in-progress/20 text-status-in-progress";
      case "inactive":
        return "bg-status-todo/20 text-status-todo";
      default:
        return "";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-destructive/20 text-destructive";
      case "Moderator":
        return "bg-primary/20 text-primary";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground mt-1">Manage users</p>
        </div>

        {/* Users Section */}
        <div className="mt-6 space-y-6">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-card border-border"
            />
          </div>

          {/* Users Table */}
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No users found</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Role</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {user.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={cn("px-3 py-1 rounded-full text-xs font-medium", getRoleColor(user.role))}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={cn("px-3 py-1 rounded-full text-xs font-medium capitalize", getStatusColor(user.status))}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {user.role !== "Admin" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-secondary">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            {user.status === "inactive" && (
                              <DropdownMenuItem 
                                className="gap-2 cursor-pointer"
                                onClick={() => handleActivateDeactivate(user)}
                              >
                                <UserCheck className="w-4 h-4 text-status-done" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              className="gap-2 cursor-pointer"
                              onClick={() => handleChangeRoleClick(user)}
                            >
                              <Edit className="w-4 h-4" />
                              Change Role
                            </DropdownMenuItem>
                            {user.status === "active" && (
                              <DropdownMenuItem 
                                className="gap-2 cursor-pointer text-destructive"
                                onClick={() => handleActivateDeactivate(user)}
                              >
                                <UserX className="w-4 h-4" />
                                Deactivate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              className="gap-2 cursor-pointer text-destructive"
                              onClick={() => handleDeleteClick(user)}
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Change Role Dialog */}
        <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Change User Role</DialogTitle>
              <DialogDescription>
                Select a new role for {selectedUser?.name || selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Role</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="TEAM_LEADER">Team Leader</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRoleDialogOpen(false);
                  setSelectedUser(null);
                  setSelectedRole("");
                }}
                disabled={isUpdatingRole}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRoleUpdate}
                disabled={isUpdatingRole || !selectedRole}
              >
                {isUpdatingRole ? "Updating..." : "Update Role"}
              </Button>
            </DialogFooter>
            </DialogContent>
          </Dialog>

        {/* Delete User Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the user{" "}
                <strong>{userToDelete?.name || userToDelete?.email}</strong> and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default AdminPanel;
