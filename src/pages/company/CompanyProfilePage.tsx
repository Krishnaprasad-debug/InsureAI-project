import { useState } from 'react';
import { Building2, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { initials } from '../../lib/utils';

export function CompanyProfilePage() {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [companyName, setCompanyName] = useState(profile?.company_name || 'InsureAI Underwriting Dept.');
  const [officerTitle, setOfficerTitle] = useState(profile?.officer_title || 'Senior Claims Officer');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      full_name: fullName,
      phone,
      company_name: companyName,
      officer_title: officerTitle,
    });

    if (error) {
      toast('error', 'Update Failed', error);
    } else {
      toast('success', 'Profile Updated', 'Your officer profile has been saved.');
    }
    setSaving(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-5 h-5 text-primary-600" />
          <h1 className="text-2xl font-bold">Company Officer Profile</h1>
        </div>
        <p className="text-gray-500 text-sm">Manage your insurance officer credentials and account information.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-primary-700 to-primary-900 text-white flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-xl font-bold">
            {initials(profile?.full_name || 'Officer')}
          </div>
          <div>
            <h2 className="text-xl font-bold">{profile?.full_name || 'Claims Officer'}</h2>
            <p className="text-sm text-primary-200">{profile?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="primary" className="bg-white/20 text-white border-white/30">
                Role: {profile?.role?.toUpperCase() || 'COMPANY'}
              </Badge>
              <Badge variant="outline" className="text-white border-white/30">
                Verified Officer
              </Badge>
            </div>
          </div>
        </div>

        <CardBody className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Officer Name"
            />
            <Input
              label="Email Address"
              value={profile?.email || ''}
              disabled
              placeholder="officer@insureai.com"
            />
            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 019-2834"
            />
            <Input
              label="Company / Department"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="InsureAI Underwriting Division"
            />
            <Input
              label="Officer Title"
              value={officerTitle}
              onChange={(e) => setOfficerTitle(e.target.value)}
              placeholder="Senior Claims Officer"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button onClick={handleSave} loading={saving}>
              <Save className="w-4 h-4" />
              Save Officer Profile
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
