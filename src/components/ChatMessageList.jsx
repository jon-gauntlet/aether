import React from "react";
import { VStack, Text, Skeleton } from "@chakra-ui/react";
import { Message } from "./Message";
import { ErrorBoundary } from "../shared/components/ErrorBoundary";

const ChatMessageListComponent = ({ messages = [], isLoading, error }) => {
  if (error) {
    return <Text color="red.500">Error: {error.message}</Text>;
  }

  if (isLoading) {
    return (
      <VStack spacing={4} align="stretch">
        <Skeleton height="60px" />
        <Skeleton height="60px" />
        <Skeleton height="60px" />
      </VStack>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
    </VStack>
  );
};

export const ChatMessageList = (props) => (
  <ErrorBoundary>
    <ChatMessageListComponent {...props} />
  </ErrorBoundary>
); 