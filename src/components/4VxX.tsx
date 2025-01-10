import React, { useState, useRef, ChangeEvent } from 'react';
import styled from 'styled-components';
import { ChatSystem } from '../../core/chat/ChatSystem';

interface MessageInputProps {
  chatSystem: ChatSystem;
  channelId: string;
  threadId?: string;
  userId: string;
}

const Container = styled.div`
  padding: 16px;
  background: #2c2c2c;
  border-top: 1px solid #1c1c1c;
`;

const InputWrapper = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-end;
`;

const TextArea = styled.textarea`
  flex: 1;
  min-height: 44px;
  max-height: 200px;
  padding: 12px;
  background: #3c3c3c;
  border: 1px solid #4c4c4c;
  border-radius: 4px;
  color: #ffffff;
  font-size: 14px;
  line-height: 1.4;
  resize: none;
  overflow-y: auto;

  &:focus {
    outline: none;
    border-color: #5865f2;
  }

  &::placeholder {
    color: #a0a0a0;
  }
`;

const AttachButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: #3c3c3c;
  border: 1px solid #4c4c4c;
  border-radius: 4px;
  color: #a0a0a0;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #4c4c4c;
    color: #ffffff;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const AttachmentPreview = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

const FilePreview = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #3c3c3c;
  border-radius: 4px;
  color: #ffffff;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: #a0a0a0;
  cursor: pointer;
  padding: 4px;
  font-size: 16px;

  &:hover {
    color: #ffffff;
  }
`;

interface FileWithPreview {
  file: File;
  id: string;
  preview?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  chatSystem,
  channelId,
  threadId,
  userId
}) => {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (message.trim() || files.length > 0) {
      const uploadedFiles = await Promise.all(
        files.map(async ({ file }) => {
          // Here you would typically upload the file to your server
          // and get back a URL. For now, we'll create a mock URL
          return {
            id: Math.random().toString(36).substring(7),
            name: file.name,
            type: file.type,
            url: URL.createObjectURL(file)
          };
        })
      );

      chatSystem.sendMessage(
        channelId,
        userId,
        message.trim(),
        threadId,
        uploadedFiles
      );

      setMessage('');
      setFiles([]);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles: FileWithPreview[] = selectedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      preview: file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : undefined
    }));

    setFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const updatedFiles = prev.filter(f => f.id !== id);
      // Clean up any object URLs we created
      const removedFile = prev.find(f => f.id === id);
      if (removedFile?.preview) {
        URL.revokeObjectURL(removedFile.preview);
      }
      return updatedFiles;
    });
  };

  return (
    <Container>
      {files.length > 0 && (
        <AttachmentPreview>
          {files.map(({ id, file, preview }) => (
            <FilePreview key={id}>
              {preview ? (
                <img src={preview} alt={file.name} style={{ width: 32, height: 32 }} />
              ) : (
                <span>📎</span>
              )}
              <span>{file.name}</span>
              <RemoveButton onClick={() => removeFile(id)}>×</RemoveButton>
            </FilePreview>
          ))}
        </AttachmentPreview>
      )}
      <InputWrapper>
        <TextArea
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`Message ${threadId ? 'thread' : 'channel'}...`}
          rows={1}
        />
        <AttachButton onClick={() => fileInputRef.current?.click()}>
          📎
        </AttachButton>
        <FileInput
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
        />
      </InputWrapper>
    </Container>
  );
}; 