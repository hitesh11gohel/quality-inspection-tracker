import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useAppDispatch, useAppSelector } from "@/store";
import { logoutAction, updateUsernameThunk } from "@/store/slices/authSlice";
import { ChevronLeft, LogOut, Pencil } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = useAppSelector((s) => s.auth.user);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftUsername, setDraftUsername] = useState("");
  const [saving, setSaving] = useState(false);

  const initial = user?.username?.[0]?.toUpperCase() ?? "?";

  const handleLogout = () => {
    dispatch(logoutAction());
    navigate("/login", { replace: true });
  };

  const openDialog = () => {
    setDraftUsername(user?.username ?? "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const trimmed = draftUsername.trim();
    if (!trimmed || trimmed === user?.username) {
      setDialogOpen(false);
      return;
    }
    setSaving(true);
    const result = await dispatch(updateUsernameThunk(trimmed));
    setSaving(false);
    if (updateUsernameThunk.fulfilled.match(result)) {
      setDialogOpen(false);
      toast({ title: "Username updated" });
    } else {
      toast({
        title: "Update failed",
        description: result.payload as string,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mx-auto max-w-sm space-y-4 p-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>
      <h1 className="text-xl font-bold text-foreground">Profile</h1>

      <Card>
        {/* Avatar + name */}
        <CardHeader className="items-center gap-3 pb-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground shadow-sm">
            {initial}
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold leading-none">
              {user?.username}
            </p>
            <Badge
              variant={user?.role === "admin" ? "default" : "secondary"}
              className="capitalize"
            >
              {user?.role}
            </Badge>
          </div>
        </CardHeader>

        <Separator />

        {/* Detail rows */}
        <CardContent className="space-y-3 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Username</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{user?.username}</span>
              <button
                type="button"
                onClick={openDialog}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Edit username"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium capitalize">{user?.role}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">User ID</span>
            <span className="font-medium text-muted-foreground">
              #{user?.id}
            </span>
          </div>
        </CardContent>
      </Card>

      <Button variant="destructive" className="w-full" onClick={handleLogout}>
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>

      {/* ── Edit username modal ─────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Username</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="new-username">New username</Label>
            <Input
              id="new-username"
              value={draftUsername}
              onChange={(e) => setDraftUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              disabled={saving}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
