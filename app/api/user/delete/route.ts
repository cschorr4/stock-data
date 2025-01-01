// app/api/user/delete/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Delete the user from auth.users - this will trigger our CASCADE deletes
    const { error: deleteError } = await supabase.auth.updateUser({
      data: { deleted: true } // Mark as deleted first
    });
    if (deleteError) throw deleteError;

    // Actually delete the user
    const { error: adminDeleteError } = await supabase.rpc('delete_user');
    if (adminDeleteError) throw adminDeleteError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}