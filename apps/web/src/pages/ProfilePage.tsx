import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button }    from '@/components/ui/button';
import { Badge }     from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAppDispatch, useAppSelector } from '@/store';
import { logoutAction }                   from '@/store/slices/authSlice';

export default function ProfilePage() {
  const dispatch  = useAppDispatch();
  const navigate  = useNavigate();
  const user      = useAppSelector((s) => s.auth.user);

  const initial = user?.username?.[0]?.toUpperCase() ?? '?';

  const handleLogout = () => {
    dispatch(logoutAction());
    navigate('/login', { replace: true });
  };

  return (
    <div className="mx-auto max-w-sm space-y-4 p-4">
      <h1 className="text-xl font-bold text-foreground">Profile</h1>

      <Card>
        {/* Avatar + name */}
        <CardHeader className="items-center gap-3 pb-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground shadow-sm">
            {initial}
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold leading-none">{user?.username}</p>
            <Badge
              variant={user?.role === 'admin' ? 'default' : 'secondary'}
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
            <span className="text-muted-foreground">Logged in as</span>
            <span className="font-medium">{user?.username}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium capitalize">{user?.role}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">User ID</span>
            <span className="font-medium text-muted-foreground">#{user?.id}</span>
          </div>
        </CardContent>
      </Card>

      <Button variant="destructive" className="w-full" onClick={handleLogout}>
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </div>
  );
}
