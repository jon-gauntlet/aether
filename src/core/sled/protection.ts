import { useFlowState } from '../../hooks/useFlowState';

interface ProtectionOptions {
  allowOverride?: boolean;
  message?: string;
}

export const withProtection = async <T>(
  action: () => Promise<T>,
  options: ProtectionOptions = {}
): Promise<T> => {
  const { isProtected } = useFlowState();
  
  if (isProtected && !options.allowOverride) {
    throw new Error(options.message || 'Action blocked: Flow state is protected');
  }

  try {
    return await action();
  } catch (error) {
    console.error(`Protected action failed:`, error);
    throw error;
  }
};