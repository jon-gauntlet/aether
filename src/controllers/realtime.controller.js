import { RealtimeService } from '../realtime/realtime.service';
import { SystemMonitor } from '../monitoring/monitor';

const realtimeService = new RealtimeService();
const monitor = new SystemMonitor();

export class RealtimeController {
    static async subscribe(req, res) {
        try {
            const { channel, event } = req.body;
            
            await realtimeService.subscribe(channel, event, (payload) => {
                // Handle the real-time event
                // This could emit to WebSocket, Server-Sent Events, etc.
                console.log('Realtime event received:', payload);
            });

            res.status(200).json({
                message: 'Subscribed successfully',
                channel,
                event
            });
        } catch (error) {
            monitor.errorTracker.track(error, {
                context: 'realtime-controller-subscribe',
                body: req.body
            });
            res.status(500).json({
                error: error.message
            });
        }
    }

    static async unsubscribe(req, res) {
        try {
            const { channel, event } = req.body;
            
            await realtimeService.unsubscribe(channel, event);

            res.status(200).json({
                message: 'Unsubscribed successfully',
                channel,
                event
            });
        } catch (error) {
            monitor.errorTracker.track(error, {
                context: 'realtime-controller-unsubscribe',
                body: req.body
            });
            res.status(500).json({
                error: error.message
            });
        }
    }

    static async broadcast(req, res) {
        try {
            const { channel, event, payload } = req.body;
            
            await realtimeService.broadcast(channel, event, payload);

            res.status(200).json({
                message: 'Broadcast sent successfully',
                channel,
                event
            });
        } catch (error) {
            monitor.errorTracker.track(error, {
                context: 'realtime-controller-broadcast',
                body: req.body
            });
            res.status(500).json({
                error: error.message
            });
        }
    }

    static async getStatus(req, res) {
        try {
            const metrics = realtimeService.getMetrics();
            res.status(200).json(metrics);
        } catch (error) {
            monitor.errorTracker.track(error, {
                context: 'realtime-controller-status'
            });
            res.status(500).json({
                error: error.message
            });
        }
    }
} 