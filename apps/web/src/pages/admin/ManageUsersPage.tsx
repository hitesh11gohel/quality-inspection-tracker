import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useAppSelector } from "@/store";
import type { PublicUser } from "@/services/userService";
import { userService } from "@/services/userService";
import { ChevronLeft, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ManageUsersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = useAppSelector((s) => s.auth.user);

  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    userService
      .listAll()
      .then(setUsers)
      .catch((err: Error) =>
        toast({ title: "Failed to load users", description: err.message, variant: "destructive" })
      )
      .finally(() => setLoading(false));
  }, [toast]);

  const handleRoleChange = async (userId: number, role: "supervisor" | "admin") => {
    setUpdating(userId);
    try {
      await userService.updateRole(userId, role);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      );
      toast({ title: "Role updated" });
    } catch (err) {
      toast({
        title: "Update failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Manage Users</h1>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${users.length} user${users.length !== 1 ? "s" : ""}`}
          </p>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {user.username[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {user.username}
                      {user.id === currentUser?.id && (
                        <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">ID #{user.id}</p>
                  </div>
                </div>

                <div className="shrink-0 ml-4">
                  <Select
                    value={user.role}
                    onValueChange={(v) =>
                      handleRoleChange(user.id, v as "supervisor" | "admin")
                    }
                    disabled={updating === user.id}
                  >
                    <SelectTrigger className="h-8 w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supervisor">
                        <Badge variant="secondary" className="capitalize pointer-events-none">
                          supervisor
                        </Badge>
                      </SelectItem>
                      <SelectItem value="admin">
                        <Badge variant="default" className="capitalize pointer-events-none">
                          admin
                        </Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
