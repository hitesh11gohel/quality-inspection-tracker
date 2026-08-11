import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scissors, Loader2 } from 'lucide-react';
import { Button }  from '@/components/ui/button';
import { Input }   from '@/components/ui/input';
import { Label }   from '@/components/ui/label';
import {
  Card, CardContent, CardDescription,
  CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAppDispatch, useAppSelector } from '@/store';
import { registerThunk }                  from '@/store/slices/authSlice';
import { toast }                          from '@/components/ui/use-toast';

export default function RegisterPage() {
  const dispatch      = useAppDispatch();
  const navigate      = useNavigate();
  const { isLoading } = useAppSelector((s) => s.auth);

  const [username,        setUsername]        = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role,            setRole]            = useState('supervisor');
  const [confirmError,    setConfirmError]    = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match');
      return;
    }
    setConfirmError('');

    const result = await dispatch(registerThunk({ username, password, role }));
    if (registerThunk.fulfilled.match(result)) {
      navigate('/dashboard');
    } else {
      toast({
        variant:     'destructive',
        title:       'Registration failed',
        description: (result.payload as string) ?? 'Could not create account. Try a different username.',
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-sm shadow-lg">
        {/* Logo + branding */}
        <CardHeader className="items-center space-y-3 pb-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <Scissors className="h-7 w-7" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">Create Account</CardTitle>
            <CardDescription className="mt-0.5">Quality Inspection Tracker</CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-4">
            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-username">Username</Label>
              <Input
                id="reg-username"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-password">Password</Label>
              <Input
                id="reg-password"
                type="password"
                placeholder="Choose a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-confirm">Confirm Password</Label>
              <Input
                id="reg-confirm"
                type="password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (confirmError) setConfirmError('');
                }}
                autoComplete="new-password"
                required
                aria-invalid={!!confirmError}
              />
              {confirmError && (
                <p className="text-xs text-destructive">{confirmError}</p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="reg-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>

          <CardFooter className="flex-col gap-3 pt-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
                : 'Register'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
