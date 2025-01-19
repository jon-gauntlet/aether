"""Tests for configuration and credential loading."""
import pytest
from unittest.mock import patch, MagicMock
from rag_aether.config import load_credentials, get_secret_from_pass

def test_get_secret_from_pass_success():
    """Test successful secret retrieval from pass."""
    with patch('subprocess.run') as mock_run:
        mock_run.return_value = MagicMock(
            stdout='test-secret\n',
            stderr='',
            returncode=0
        )
        
        secret = get_secret_from_pass('test/path')
        assert secret == 'test-secret'
        mock_run.assert_called_once_with(
            ['pass', 'show', 'test/path'],
            capture_output=True,
            text=True,
            check=True
        )

def test_get_secret_from_pass_failure():
    """Test graceful handling of pass failure."""
    with patch('subprocess.run') as mock_run:
        mock_run.side_effect = Exception('pass error')
        
        secret = get_secret_from_pass('test/path')
        assert secret is None

def test_load_credentials_from_pass():
    """Test loading credentials from pass."""
    with patch('rag_aether.config.get_secret_from_pass') as mock_get_secret:
        mock_get_secret.side_effect = lambda path: {
            'openai/api_key': 'test-openai-key',
            'supabase/url': 'test-supabase-url',
            'supabase/key': 'test-supabase-key'
        }[path]
        
        creds = load_credentials()
        assert creds.openai_api_key == 'test-openai-key'
        assert creds.supabase_url == 'test-supabase-url'
        assert creds.supabase_key == 'test-supabase-key'

def test_load_credentials_from_env():
    """Test loading credentials from environment variables."""
    with patch('rag_aether.config.get_secret_from_pass') as mock_get_secret:
        mock_get_secret.return_value = None
        
        with patch.dict('os.environ', {
            'OPENAI_API_KEY': 'env-openai-key',
            'SUPABASE_URL': 'env-supabase-url',
            'SUPABASE_KEY': 'env-supabase-key'
        }):
            creds = load_credentials()
            assert creds.openai_api_key == 'env-openai-key'
            assert creds.supabase_url == 'env-supabase-url'
            assert creds.supabase_key == 'env-supabase-key'

def test_load_credentials_missing():
    """Test error handling for missing credentials."""
    with patch('rag_aether.config.get_secret_from_pass') as mock_get_secret:
        mock_get_secret.return_value = None
        
        with patch.dict('os.environ', {}, clear=True):
            with pytest.raises(ValueError) as exc_info:
                load_credentials()
            
            assert "Missing required credentials" in str(exc_info.value)
            assert "OpenAI API key" in str(exc_info.value)
            assert "Supabase URL" in str(exc_info.value)
            assert "Supabase key" in str(exc_info.value) 