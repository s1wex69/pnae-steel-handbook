import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function AccountPage() {
  const { user, loading, changeEmail, changePassword } = useAuth();

  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailSaving, setEmailSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  if (!loading && !user) return <Navigate to="/login" replace />;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(null);
    setEmailSaving(true);
    try {
      const updated = await changeEmail(newEmail, emailPassword);
      setEmailSuccess(`Логин изменён на ${updated.email}`);
      setNewEmail("");
      setEmailPassword("");
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Не удалось сменить email");
    } finally {
      setEmailSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    if (newPassword !== newPasswordConfirm) {
      setPasswordError("Новые пароли не совпадают");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Новый пароль не менее 6 символов");
      return;
    }
    setPasswordSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess("Пароль успешно изменён");
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Не удалось сменить пароль");
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading || !user) {
    return <p className="text-[var(--color-muted-foreground)]">Загрузка…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Учётная запись</h1>
        <p className="text-[var(--color-muted-foreground)]">
          Текущий логин: <strong>{user.email}</strong>
          {user.name ? ` · ${user.name}` : ""}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Смена логина (email)</CardTitle>
          <CardDescription>Для подтверждения нужен текущий пароль</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newEmail">Новый email</Label>
              <Input
                id="newEmail"
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailPassword">Текущий пароль</Label>
              <Input
                id="emailPassword"
                type="password"
                required
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            {emailError && <p className="text-sm text-[var(--color-destructive)]">{emailError}</p>}
            {emailSuccess && (
              <p className="text-sm text-green-600 dark:text-green-400">{emailSuccess}</p>
            )}
            <Button type="submit" disabled={emailSaving}>
              {emailSaving ? "Сохранение…" : "Сменить логин"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Смена пароля</CardTitle>
          <CardDescription>Минимум 6 символов</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Текущий пароль</Label>
              <Input
                id="currentPassword"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Новый пароль</Label>
              <Input
                id="newPassword"
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPasswordConfirm">Повтор нового пароля</Label>
              <Input
                id="newPasswordConfirm"
                type="password"
                required
                minLength={6}
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            {passwordError && (
              <p className="text-sm text-[var(--color-destructive)]">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-sm text-green-600 dark:text-green-400">{passwordSuccess}</p>
            )}
            <Button type="submit" disabled={passwordSaving}>
              {passwordSaving ? "Сохранение…" : "Сменить пароль"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-sm text-[var(--color-muted-foreground)]">
        <Link to="/" className="text-[var(--color-primary)] hover:underline">
          На главную
        </Link>
      </p>
    </div>
  );
}
