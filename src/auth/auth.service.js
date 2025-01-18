import { createClient } from '@supabase/supabase-js';
import { SystemMonitor } from '../monitoring/monitor';

const monitor = new SystemMonitor();

export class AuthService {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        
        this.monitor = monitor;
    }

    async signUp({ email, password }) {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
            });

            if (error) throw error;

            return {
                user: data.user,
                session: data.session
            };
        } catch (error) {
            this.monitor.errorTracker.track(error, { context: 'auth-signup' });
            throw error;
        }
    }

    async signIn({ email, password }) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            return {
                user: data.user,
                session: data.session
            };
        } catch (error) {
            this.monitor.errorTracker.track(error, { context: 'auth-signin' });
            throw error;
        }
    }

    async signOut(token) {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
            return true;
        } catch (error) {
            this.monitor.errorTracker.track(error, { context: 'auth-signout' });
            throw error;
        }
    }

    async getUser(token) {
        try {
            const { data: { user }, error } = await this.supabase.auth.getUser(token);
            if (error) throw error;
            return user;
        } catch (error) {
            this.monitor.errorTracker.track(error, { context: 'auth-getuser' });
            throw error;
        }
    }
} 