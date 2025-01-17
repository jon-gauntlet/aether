import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestWrapper } from './TestWrapper';
import { FileUpload } from '../components/FileUpload';

describe('FileUpload', () => {
  test('renders upload area and button', () => {
    render(<FileUpload />, { wrapper: TestWrapper });
    
    expect(screen.getByText(/drag & drop a file here/i)).toBeInTheDocument();
    expect(screen.getByText(/supported formats/i)).toBeInTheDocument();
    expect(screen.getByTestId('file-input')).toBeInTheDocument();
  });

  test('shows loading state with progress', () => {
    render(
      <FileUpload 
        isUploading={true} 
        progress={50} 
      />, 
      { wrapper: TestWrapper }
    );
    
    expect(screen.getByTestId('upload-progress')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  test('handles drag and drop interactions', () => {
    render(<FileUpload />, { wrapper: TestWrapper });
    
    const dropzone = screen.getByTestId('upload-area');
    
    fireEvent.dragEnter(dropzone);
    expect(screen.getByText(/drag & drop a file here/i)).toBeInTheDocument();
    
    fireEvent.dragLeave(dropzone);
    expect(screen.getByText(/drag & drop a file here/i)).toBeInTheDocument();
  });

  test('handles invalid file types', async () => {
    const onFileUpload = vi.fn();
    const user = userEvent.setup();
    
    render(<FileUpload onFileUpload={onFileUpload} />, { wrapper: TestWrapper });
    
    const file = new File(['test'], 'test.xyz', { type: 'application/xyz' });
    const input = screen.getByTestId('file-input');
    
    await user.upload(input, file);
    expect(onFileUpload).not.toHaveBeenCalled();
  });

  test('handles successful file upload', async () => {
    const onFileUpload = vi.fn();
    const user = userEvent.setup();
    
    render(<FileUpload onFileUpload={onFileUpload} />, { wrapper: TestWrapper });
    
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('file-input');
    
    await user.upload(input, file);
    expect(onFileUpload).toHaveBeenCalledWith(file);
  });
}); 