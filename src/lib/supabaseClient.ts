import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const supabase = createClientComponentClient({
    cookieOptions: {
        name: "sb-auth-token",
        domain: "ailon.iptime.org",
        path: "/",
        sameSite: "lax",
        secure: true
    }
});
