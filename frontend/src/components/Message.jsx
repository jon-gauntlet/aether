import React, { useState, useCallback } from 'react';
import { Box, Text, VStack, HStack, Avatar, IconButton, Button, useToast } from '@chakra-ui/react';
import { FaceSmileIcon, FaceFrownIcon, HandThumbUpIcon, HeartIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const REACTIONS = [
    { icon: HandThumbUpIcon, value: '👍' },
    { icon: HeartIcon, value: '❤️' },
    { icon: FaceSmileIcon, value: '😊' },
    { icon: FaceFrownIcon, value: '😢' }
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
            p={4} 
            borderWidth="1px" 
            borderRadius="lg" 
            position="relative"
            _hover={{ '& .message-actions': { opacity: 1 } }}
        >
            <HStack spacing={4} align="flex-start">
                <Avatar 
                    size="sm" 
                    name={message.sender.name || 'Anonymous'} 
                    src={message.sender.avatar} 
                />
                <VStack align="stretch" flex={1} spacing={1}>
                    <HStack justify="space-between">
                        <Text fontWeight="bold">
                            {message.sender.name || 'Anonymous'}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                            {format(new Date(message.timestamp), 'MMM d, h:mm a')}
                        </Text>
                    </HStack>
                    <Text>{message.content}</Text>
                    {message.reactions && message.reactions.length > 0 && (
                        <HStack spacing={2} mt={2}>
                            {message.reactions.map((reaction, index) => (
                                <Button
                                    key={index}
                                    size="xs"
                                    variant="ghost"
                                    leftIcon={<Text>{reaction.emoji}</Text>}
                                >
                                    {reaction.count}
                                </Button>
                            ))}
                        </HStack>
                    )}
                </VStack>
            </HStack>
            
            <HStack 
                className="message-actions" 
                position="absolute" 
                right={2} 
                bottom={2}
                opacity={0}
                transition="opacity 0.2s"
                bg="white" 
                p={1} 
                borderRadius="md" 
                shadow="md"
            >
                <IconButton
                    icon={<ArrowUturnLeftIcon className="h-4 w-4" />}
                    aria-label="Reply"
                    size="sm"
                    variant="ghost"
                    onClick={handleReply}
                />
                <IconButton
                    icon={<FaceSmileIcon className="h-4 w-4" />}
                    aria-label="Add reaction"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowReactions(!showReactions)}
                />
            </HStack>

            {showReactions && (
                <Box
                    position="absolute"
                    right={2}
                    bottom={12}
                    bg="white"
                    p={2}
                    borderRadius="md"
                    shadow="lg"
                    zIndex={1}
                >
                    <HStack>
                        {REACTIONS.map(({ icon: Icon, value }) => (
                            <IconButton
                                key={value}
                                icon={<Icon className="h-4 w-4" />}
                                aria-label={`React with ${value}`}
                                size="sm"
                                variant="ghost"
                                onClick={() => handleReaction(value)}
                            />
                        ))}
                    </HStack>
                </Box>
            )}
        </Box>
    );
} 