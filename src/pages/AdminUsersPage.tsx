import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Shield, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase, type Profile, type Claim } from '../lib/supabase';
import { Card, CardBody } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SkeletonCard } from '../components/ui/Skeleton';
import { initials, formatDate } from '../lib/utils';

const PAGE_SIZE = 10;

export function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    (async () => {
      const [{ data: usersData }, { data: claimsData }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('claims').select('*'),
      ]);
      setUsers(usersData as Profile[] || []);
      setClaims(claimsData as Claim[] || []);
      setLoading(false);
    })();
  }, []);

  const claimsByUser = useMemo(() => {
    const map: Record<string, number> = {};
    claims.forEach((c) => { map[c.user_id] = (map[c.user_id] || 0) + 1; });
    return map;
  }, [claims]);

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter((u) =>
      (u.full_name || '').toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.city || '').toLowerCase().includes(q)
    );
  }, [users, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-gray-500 text-sm mt-1">Manage all registered users on the platform.</p>
      </div>

      <Card>
        <CardBody>
          <Input
            placeholder="Search by name, email, or city..."
            icon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </CardBody>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : paged.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paged.map((user, i) => (
              <motion.div key={user.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card hover className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold shrink-0">
                      {initials(user.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold truncate">{user.full_name || 'Unknown'}</p>
                        <Badge variant={user.role === 'admin' ? 'primary' : 'default'}>
                          {user.role === 'admin' ? <><Shield className="w-3 h-3" />Admin</> : 'Customer'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <FileText className="w-3.5 h-3.5" />
                          {claimsByUser[user.id] || 0} claims
                        </div>
                        <div className="text-gray-500">
                          Joined {formatDate(user.created_at)}
                        </div>
                        {user.city && (
                          <div className="text-gray-500 col-span-2">
                            {user.city}{user.state ? `, ${user.state}` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="icon" disabled={page === 0} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-500">Page {page + 1} of {totalPages}</span>
              <Button variant="outline" size="icon" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardBody className="text-center py-16">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No users found</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
