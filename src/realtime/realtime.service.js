import { createClient } from '@supabase/supabase-js';
import { SystemMonitor } from '../monitoring/monitor';

const monitor = new SystemMonitor();

export class RealtimeService {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        
        this.subscriptions = new Map();
        this.channels = new Map();
        this.monitor = monitor;
    }

    async createChannel(channelName, options = {}) {
        try {
            const channel = this.supabase.channel(channelName, {
                config: {
                    presence: {
                        key: options.presenceKey || 'default',
                    },
                    broadcast: {
                        self: options.broadcastSelf || false
                    }
                }
            });

            this.channels.set(channelName, channel);
            
            // Track channel creation
            this.monitor.logger.info({
                event: 'channel_created',
                channel: channelName,
                options
            });

            return channel;
        } catch (error) {
            this.monitor.errorTracker.track(error, {
                context: 'realtime-create-channel',
                channelName,
                options
            });
            throw error;
        }
    }

    async subscribe(channelName, event, callback) {
        try {
            let channel = this.channels.get(channelName);
            
            if (!channel) {
                channel = await this.createChannel(channelName);
            }

            const subscription = channel
                .on(event, (payload) => {
                    try {
                        callback(payload);
                        
                        this.monitor.logger.debug({
                            event: 'subscription_event',
                            channel: channelName,
                            eventType: event,
                            payload
                        });
                    } catch (error) {
                        this.monitor.errorTracker.track(error, {
                            context: 'realtime-subscription-callback',
                            channel: channelName,
                            event,
                            payload
                        });
                    }
                })
                .subscribe((status) => {
                    this.monitor.logger.info({
                        event: 'subscription_status',
                        channel: channelName,
                        status
                    });
                });

            const subKey = `${channelName}:${event}`;
            this.subscriptions.set(subKey, subscription);

            return subscription;
        } catch (error) {
            this.monitor.errorTracker.track(error, {
                context: 'realtime-subscribe',
                channelName,
                event
            });
            throw error;
        }
    }

    async unsubscribe(channelName, event) {
        try {
            const subKey = `${channelName}:${event}`;
            const channel = this.channels.get(channelName);
            
            if (channel) {
                await channel.unsubscribe();
                this.channels.delete(channelName);
                this.subscriptions.delete(subKey);
                
                this.monitor.logger.info({
                    event: 'unsubscribed',
                    channel: channelName,
                    event
                });
            }
        } catch (error) {
            this.monitor.errorTracker.track(error, {
                context: 'realtime-unsubscribe',
                channelName,
                event
            });
            throw error;
        }
    }

    async broadcast(channelName, event, payload) {
        try {
            const channel = this.channels.get(channelName);
            
            if (!channel) {
                throw new Error(`Channel ${channelName} not found`);
            }

            await channel.send({
                type: 'broadcast',
                event,
                payload
            });

            this.monitor.logger.debug({
                event: 'broadcast_sent',
                channel: channelName,
                eventType: event,
                payload
            });
        } catch (error) {
            this.monitor.errorTracker.track(error, {
                context: 'realtime-broadcast',
                channelName,
                event,
                payload
            });
            throw error;
        }
    }

    getChannelStatus(channelName) {
        const channel = this.channels.get(channelName);
        return channel ? channel.state : 'not_found';
    }

    getMetrics() {
        return {
            activeChannels: this.channels.size,
            activeSubscriptions: this.subscriptions.size,
            channels: Array.from(this.channels.keys()).map(name => ({
                name,
                status: this.getChannelStatus(name)
            }))
        };
    }
} 