import { useState } from 'react';
import {
  User, Mail, Phone, MapPin, Briefcase, Camera, Lock, Bell,
  Trash2, Save, Shield,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Checkbox } from '../components/ui/Misc';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { initials, formatDate } from '../lib/utils';

export function ProfilePage() {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    occupation: profile?.occupation || '',
    annual_income: profile?.annual_income || '',
    city: profile?.city || '',
    state: profile?.state || '',
    pin_code: profile?.pin_code || '',
  });
  const [notifSettings, setNotifSettings] = useState(profile?.notification_settings || { email: true, push: true });
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      full_name: form.full_name,
      phone: form.phone,
      occupation: form.occupation,
      annual_income: form.annual_income ? parseFloat(form.annual_income as string) : null,
      city: form.city,
      state: form.state,
      pin_code: form.pin_code,
    });
    setSaving(false);
    if (error) toast('error', 'Update failed', error);
    else toast('success', 'Profile updated', 'Your profile has been saved.');
  };

  const handleSaveNotifs = async () => {
    const { error } = await updateProfile({ notification_settings: notifSettings });
    if (error) toast('error', 'Update failed', error);
    else toast('success', 'Settings saved', 'Notification preferences updated.');
  };

  const handleChangePassword = async () => {
    if (passwordForm.next !== passwordForm.confirm) {
      toast('error', 'Passwords do not match');
      return;
    }
    if (passwordForm.next.length < 6) {
      toast('error', 'Password too short', 'Must be at least 6 characters.');
      return;
    }
    setSavingPassword(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: passwordForm.next });
    setSavingPassword(false);
    if (updateError) toast('error', 'Password change failed', updateError.message);
    else {
      toast('success', 'Password changed', 'Your password has been updated.');
      setPasswordForm({ current: '', next: '', confirm: '' });
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast('error', 'Type DELETE to confirm');
      return;
    }
    await supabase.auth.admin?.deleteUser?.(profile?.id || '') || {};
    toast('info', 'Account deletion', 'Please contact support to delete your account.');
    setDeleteOpen(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your personal information and settings.</p>
      </div>

      {/* Profile header */}
      <Card>
        <CardBody className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-2xl font-bold">
              {initials(profile?.full_name)}
            </div>
            <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-md hover:scale-110 transition-transform">
              <Camera className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{profile?.full_name || 'User'}</h2>
            <p className="text-sm text-gray-500">{profile?.email}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant={profile?.role === 'admin' ? 'primary' : 'default'}>
                <Shield className="w-3 h-3" />
                {profile?.role === 'admin' ? 'Administrator' : 'Customer'}
              </Badge>
              <Badge variant="outline">Member since {formatDate(profile?.created_at || new Date())}</Badge>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Personal info */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" icon={<User className="w-4 h-4" />} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <Input label="Email" icon={<Mail className="w-4 h-4" />} value={profile?.email || ''} disabled hint="Email cannot be changed" />
            <Input label="Phone" icon={<Phone className="w-4 h-4" />} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
            <Input label="Occupation" icon={<Briefcase className="w-4 h-4" />} value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} />
            <Input label="Annual Income ($)" type="number" value={form.annual_income} onChange={(e) => setForm({ ...form, annual_income: e.target.value })} />
            <Input label="City" icon={<MapPin className="w-4 h-4" />} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            <Input label="PIN Code" value={form.pin_code} onChange={(e) => setForm({ ...form, pin_code: e.target.value })} />
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} loading={saving}>
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Password change */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Current Password" type="password" icon={<Lock className="w-4 h-4" />} value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} />
            <Input label="New Password" type="password" icon={<Lock className="w-4 h-4" />} value={passwordForm.next} onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })} />
            <Input label="Confirm Password" type="password" icon={<Lock className="w-4 h-4" />} value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
          </div>
          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={handleChangePassword} loading={savingPassword}>
              Update Password
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <Checkbox
              checked={notifSettings.email}
              onChange={(v) => setNotifSettings({ ...notifSettings, email: v })}
              label={<><Bell className="w-4 h-4 inline mr-2" />Email notifications for claim updates and predictions</>}
            />
            <Checkbox
              checked={notifSettings.push}
              onChange={(v) => setNotifSettings({ ...notifSettings, push: v })}
              label="Push notifications for real-time alerts"
            />
          </div>
          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={handleSaveNotifs}>
              Save Preferences
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Danger zone */}
      <Card className="border-danger-200 dark:border-danger-800">
        <CardHeader>
          <CardTitle className="text-danger-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-medium text-sm">Delete Account</p>
              <p className="text-xs text-gray-500">Permanently delete your account and all associated data.</p>
            </div>
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="w-4 h-4" />
              Delete Account
            </Button>
          </div>
        </CardBody>
      </Card>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Account" size="sm">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-danger-50 dark:bg-danger-900/20">
            <Trash2 className="w-5 h-5 text-danger-600" />
            <p className="text-sm text-danger-700 dark:text-danger-400">This action is permanent and cannot be undone.</p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Type <span className="font-bold">DELETE</span> to confirm account deletion.
          </p>
          <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="DELETE" />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" className="flex-1" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
