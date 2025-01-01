'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from '@/utils/supabase/client';
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from '@/components/providers/AuthProvider';

interface Profile {
  first_name: string;
  last_name: string;
  username: string;
}

export function UserProfileForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    first_name: '',
    last_name: '',
    username: '',
  });
  
  const supabase = createClient();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      getProfile();
    }
  }, [user]);

  async function getProfile() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, username')
        .eq('id', user?.id)
        .single();

      if (error) {
        throw error;
      }

      setProfile({
        first_name: data?.first_name || '',
        last_name: data?.last_name || '',
        username: data?.username || '',
      });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading profile",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile() {
    if (!user) return;

    try {
      setSaving(true);

      // Check if username is already taken (excluding current user)
      if (profile.username) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', profile.username)
          .neq('id', user.id)
          .single();

        if (existingUser) {
          throw new Error('Username is already taken');
        }
      }

      const updates = {
        id: user.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        username: profile.username,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={user?.email || ''} disabled />
      </div>

      <div className="space-y-2">
        <Label htmlFor="firstName">First Name</Label>
        <Input
          id="firstName"
          value={profile.first_name}
          onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastName">Last Name</Label>
        <Input
          id="lastName"
          value={profile.last_name}
          onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={profile.username}
          onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
        />
      </div>

      <Button 
        onClick={updateProfile} 
        disabled={saving}
        className="w-full"
      >
        {saving ? "Saving..." : "Update Profile"}
      </Button>
    </div>
  );
}