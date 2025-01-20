import React, { useState, useCallback } from 'react';
import { Box, Text, VStack, HStack, Avatar, IconButton, Button, useToast } from '@chakra-ui/react';
import { EmojiHappyIcon, EmojiSadIcon, ThumbUpIcon, HeartIcon, ReplyIcon } from '@heroicons/react/outline';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const REACTIONS = [
    { icon: ThumbUpIcon, value: '👍' },
    { icon: HeartIcon, value: '❤️' },
    { icon: EmojiHappyIcon, value: '😊' },
    { icon: EmojiSadIcon, value: '😢' }
];

export function Message({ message, onReaction, onReply, onViewThread }) {
    const [showReactions, setShowReactions] = useState(false);
    const { user } = useAuth();
    const toast = useToast();
    
    const handleReaction = useCallback((reaction) => {
        if (!user) {
            toast({
                title: "Cannot add reaction",
                description: "You must be logged in to react to messages",
                status: "error",
                duration: 3000,
            });
            return;
        }
        
        onReaction(message.id, reaction);
        setShowReactions(false);
    }, [message.id, onReaction, user, toast]);
    
    const handleReply = useCallback(() => {
        if (!user) {
            toast({
                title: "Cannot reply",
                description: "You must be logged in to reply to messages",
                status: "error",
                duration: 3000,
            });
            return;
        }
        
        onReply(message.id);
    }, [message.id, onReply, user, toast]);
    
    const handleViewThread = useCallback(() => {
        onViewThread(message.id);
    }, [message.id, onViewThread]);
    
    const hasReacted = useCallback((reaction) => {
        return message.reactions?.some(r => 
            r.user_id === user?.id && r.reaction === reaction
        );
    }, [message.reactions, user]);
    
    const getReactionCount = useCallback((reaction) => {
        return message.reactions?.filter(r => r.reaction === reaction).length || 0;
    }, [message.reactions]);
    
    return (
        <Box 
            p={2} 
            borderRadius="md" 
            bg={message.user_id === user?.id ? "blue.50" : "gray.50"}
            position="relative"
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
        >
            <HStack spacing={2} mb={1}>
                <Text fontWeight="bold">{message.user_id}</Text>
                <Text fontSize="sm" color="gray.500">
                    {format(new Date(message.timestamp), 'HH:mm')}
                </Text>
            </HStack>
            
            <Text>{message.content}</Text>
            
            {/* Thread info */}
            {message.is_thread_starter && message.reply_count > 0 && (
                <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<ReplyIcon className="h-4 w-4" />}
                    onClick={handleViewThread}
                    mt={2}
                >
                    {message.reply_count} {message.reply_count === 1 ? 'reply' : 'replies'}
                </Button>
            )}
            
            {/* Reply button */}
            <IconButton
                icon={<ReplyIcon className="h-4 w-4" />}
                size="sm"
                variant="ghost"
                position="absolute"
                top={2}
                right={2}
                onClick={handleReply}
                aria-label="Reply to message"
            />
            
            {/* Reaction buttons */}
            {showReactions && (
                <HStack 
                    position="absolute" 
                    top="-8" 
                    right="0" 
                    bg="white" 
                    shadow="md" 
                    borderRadius="md" 
                    p={1}
                >
                    {REACTIONS.map(({ icon: Icon, value }) => (
                        <IconButton
                            key={value}
                            icon={<Icon className="h-4 w-4" />}
                            size="sm"
                            variant="ghost"
                            colorScheme={hasReacted(value) ? "blue" : "gray"}
                            onClick={() => handleReaction(value)}
                            aria-label={`React with ${value}`}
                        />
                    ))}
                </HStack>
            )}
            
            {/* Reaction display */}
            {message.reactions?.length > 0 && (
                <HStack spacing={2} mt={2}>
                    {REACTIONS.map(({ value }) => {
                        const count = getReactionCount(value);
                        if (count === 0) return null;
                        
                        return (
                            <Box
                                key={value}
                                px={2}
                                py={1}
                                borderRadius="full"
                                bg={hasReacted(value) ? "blue.100" : "gray.100"}
                                fontSize="sm"
                            >
                                {value} {count}
                            </Box>
                        );
                    })}
                </HStack>
            )}
        </Box>
    );
} 