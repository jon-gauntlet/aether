from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from typing import Optional, Dict
import json
from datetime import datetime, timedelta
from .manager import ConnectionManager
from .rate_limiter import RateLimiter, RateLimitConfig
from .pool import ConnectionPool, PoolConfig
from .recovery import RecoveryManager, RecoveryConfig
from ..core.auth import verify_websocket_token, User

router = APIRouter()
manager = ConnectionManager()
rate_limiter = RateLimiter()
connection_pool = ConnectionPool()
recovery_manager = RecoveryManager()

@router.on_event("startup")
async def startup_event():
    """Start background tasks on application startup."""
    await recovery_manager.start()

@router.websocket("/ws/{client_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    client_id: str,
    token: Optional[str] = None,
    last_sequence: Optional[int] = None
):
    """Main WebSocket endpoint for client connections."""
    try:
        # Verify authentication
        user = await verify_websocket_token(websocket, token)
        if not user:
            return
            
        # Check rate limits
        if not await rate_limiter.can_connect(user.id):
            await websocket.close(
                code=4002,
                reason="Too many connections"
            )
            return
            
        # Use user ID as part of client ID for security
        authenticated_client_id = f"{user.id}:{client_id}"
        
        # Add to connection pool
        channel_name = client_id.split("/")[0] if "/" in client_id else "default"
        if not await connection_pool.add_connection(websocket, channel_name):
            await websocket.close(
                code=4003,
                reason="Connection pool full"
            )
            return
            
        # Check for session recovery
        if last_sequence is not None:
            if await recovery_manager.can_recover(authenticated_client_id):
                # Recover session
                session = await recovery_manager.recover_session(
                    authenticated_client_id,
                    last_sequence
                )
                if session:
                    # Send missed messages
                    missed_messages = await recovery_manager.get_missed_messages(
                        authenticated_client_id,
                        last_sequence
                    )
                    for msg in missed_messages:
                        await websocket.send_json(msg)
            else:
                # Can't recover, close with recovery failed code
                await websocket.close(
                    code=4004,
                    reason="Session recovery failed"
                )
                return
        else:
            # Register new session
            await recovery_manager.register_session(
                authenticated_client_id,
                user.id,
                channel_name
            )
            
        # Add to connection manager
        await manager.connect(websocket, authenticated_client_id)
        await rate_limiter.add_connection(user.id)
        
        try:
            while True:
                data = await websocket.receive_text()
                try:
                    message = json.loads(data)
                    message_type = message.get("type", "message")
                    
                    if message_type == "heartbeat":
                        # Update session heartbeat
                        await recovery_manager.update_heartbeat(
                            authenticated_client_id
                        )
                        await websocket.send_json({
                            "type": "heartbeat_ack",
                            "timestamp": datetime.utcnow().isoformat()
                        })
                        
                    elif message_type == "typing":
                        if await rate_limiter.can_send_typing_update(user.id):
                            await manager.set_typing_status(
                                authenticated_client_id,
                                message.get("is_typing", False)
                            )
                            await rate_limiter.record_typing_update(user.id)
                            
                    elif message_type == "read_receipt":
                        await manager.mark_as_read(
                            authenticated_client_id,
                            message.get("message_id")
                        )
                        
                    elif message_type == "retry":
                        # Handle manual retry request
                        message_id = message.get("message_id")
                        if not message_id:
                            await websocket.send_text(
                                json.dumps({
                                    "type": "error",
                                    "message": "Missing message_id for retry"
                                })
                            )
                            
                    else:  # Regular message
                        if await rate_limiter.can_send_message(user.id):
                            # Add user info to message
                            message["user_id"] = user.id
                            message["client_id"] = authenticated_client_id
                            message["timestamp"] = datetime.utcnow().isoformat()
                            
                            # Record message for recovery
                            await recovery_manager.record_message(
                                authenticated_client_id,
                                message
                            )
                            
                            # Broadcast to channel and manager
                            await connection_pool.broadcast_to_channel(
                                channel_name,
                                message,
                                exclude=websocket
                            )
                            await manager.broadcast(
                                json.dumps(message),
                                exclude=authenticated_client_id
                            )
                            await rate_limiter.record_message(user.id)
                        else:
                            await websocket.send_text(
                                json.dumps({
                                    "type": "error",
                                    "message": "Rate limit exceeded"
                                })
                            )
                        
                except json.JSONDecodeError:
                    await websocket.send_text(
                        json.dumps({
                            "type": "error",
                            "message": "Invalid message format"
                        })
                    )
                    
        except WebSocketDisconnect:
            await manager.disconnect(authenticated_client_id)
            await rate_limiter.remove_connection(user.id)
            await connection_pool.remove_connection(websocket, channel_name)
            
    except Exception as e:
        await websocket.close(code=1008)  # Policy violation
        raise

@router.get("/ws/status")
async def get_websocket_status():
    """Get the current status of WebSocket connections."""
    active_users = manager.get_active_users()
    typing_users = manager.get_typing_users()
    
    # Group by user ID (first part of client_id)
    unique_users = len(set(
        client_id.split(":")[0] 
        for client_id in active_users
    ))
    
    pool_metrics = connection_pool.get_metrics()
    recovery_metrics = recovery_manager.get_metrics()
    
    return {
        "active_users": len(active_users),
        "unique_users": unique_users,
        "typing_users": len(typing_users),
        "connection_health": {
            "total_connections": len(active_users),
            "pool_size": pool_metrics["total_connections"],
            "total_channels": pool_metrics["total_channels"],
            "active_sessions": recovery_metrics["active_sessions"],
            "active_channels": len(set(
                client_id.split(":")[1].split("/")[0]
                for client_id in active_users
                if ":" in client_id and "/" in client_id.split(":")[1]
            ))
        }
    }

@router.get("/ws/metrics")
async def get_websocket_metrics():
    """Get detailed WebSocket metrics."""
    active_users = manager.get_active_users()
    pool_metrics = connection_pool.get_metrics()
    recovery_metrics = recovery_manager.get_metrics()
    
    # Group users by their actual user ID
    user_connections = {}
    user_rate_metrics = {}
    
    for client_id in active_users:
        if ":" in client_id:
            user_id = client_id.split(":")[0]
            user_connections[user_id] = user_connections.get(user_id, 0) + 1
            user_rate_metrics[user_id] = rate_limiter.get_user_metrics(user_id)
    
    metrics = {
        "connections": {
            "total": len(active_users),
            "unique_users": len(user_connections),
            "by_user": user_connections,
            "by_channel": pool_metrics["channels"],
            "pool_status": {
                "total": pool_metrics["total_connections"],
                "channels": pool_metrics["total_channels"]
            }
        },
        "rate_limits": {
            "by_user": user_rate_metrics
        },
        "messages": {
            "failed": sum(
                manager.get_failed_message_count(client_id)
                for client_id in active_users
            ),
            "retry_queue": sum(
                1 for client_id in active_users
                if manager.get_failed_message_count(client_id) > 0
            )
        },
        "presence": {
            "online": len(active_users),
            "typing": len(manager.get_typing_users())
        },
        "recovery": recovery_metrics,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    return metrics

@router.get("/ws/active-users")
async def get_active_users():
    """Get the list of currently active users."""
    active_users = manager.get_active_users()
    # Remove user IDs from client IDs for privacy
    return {
        "users": [
            client_id.split(":", 1)[1] if ":" in client_id else client_id
            for client_id in active_users
        ]
    }

@router.get("/ws/typing-users")
async def get_typing_users():
    """Get the list of currently typing users."""
    typing_users = manager.get_typing_users()
    # Remove user IDs from client IDs for privacy
    return {
        "users": [
            client_id.split(":", 1)[1] if ":" in client_id else client_id
            for client_id in typing_users
        ]
    }

@router.get("/ws/client/{client_id}/status")
async def get_client_status(client_id: str):
    """Get detailed status for a specific client."""
    # Find the full client ID (with user ID)
    full_client_ids = [
        cid for cid in manager.get_active_users()
        if cid.endswith(f":{client_id}")
    ]
    
    if not full_client_ids:
        raise HTTPException(status_code=404, detail="Client not found")
        
    full_client_id = full_client_ids[0]
    user_id = full_client_id.split(":")[0]
    
    # Get rate limiting metrics
    rate_metrics = rate_limiter.get_user_metrics(user_id)
    
    # Get channel info
    channel_name = client_id.split("/")[0] if "/" in client_id else "default"
    channel_metrics = connection_pool.get_metrics()["channels"].get(channel_name, {})
    
    # Get session info
    session_metrics = recovery_manager.get_metrics()["sessions"].get(full_client_id, {})
    
    return {
        "client_id": client_id,  # Public client ID
        "user_id": user_id,
        "connected": True,
        "last_seen": manager.user_presence[full_client_id].isoformat(),
        "is_typing": full_client_id in manager.get_typing_users(),
        "failed_messages": manager.get_failed_message_count(full_client_id),
        "rate_limits": rate_metrics,
        "channel": {
            "name": channel_name,
            "connections": channel_metrics.get("connections", 0),
            "buffer_size": channel_metrics.get("buffer_size", 0),
            "last_activity": channel_metrics.get("last_activity")
        },
        "session": session_metrics
    } 