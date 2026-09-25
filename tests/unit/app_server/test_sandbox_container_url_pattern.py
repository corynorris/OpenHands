"""Tests for OH_SANDBOX_CONTAINER_URL_PATTERN handling.

Covers:
- config_from_env reading OH_SANDBOX_CONTAINER_URL_PATTERN (documented name)
  and the legacy unprefixed SANDBOX_CONTAINER_URL_PATTERN fallback.
- Surfacing the pattern + OH_WEB_URL to the frontend via WebClientConfig.
"""

import os
from types import SimpleNamespace
from unittest.mock import patch

import pytest


@pytest.fixture(autouse=True)
def reset_global_config():
    """Reset the global config before and after each test."""
    import openhands.app_server.config as config_module

    original_config = config_module._global_config
    config_module._global_config = None
    yield
    config_module._global_config = original_config


def _get_clean_env():
    """Get a base environment dict with essential system vars preserved."""
    env = {}
    for key in ['PATH', 'HOME', 'PYTHONPATH', 'VIRTUAL_ENV', 'TMPDIR', 'TMP', 'TEMP']:
        if key in os.environ:
            env[key] = os.environ[key]
    return env


class TestConfigFromEnvSandboxContainerUrlPattern:
    """Test the sandbox container URL pattern env var handling."""

    def test_reads_oh_prefixed_env_var(self):
        """OH_SANDBOX_CONTAINER_URL_PATTERN (the documented name) is read."""
        from openhands.app_server.config import config_from_env
        from openhands.app_server.sandbox.docker_sandbox_service import (
            DockerSandboxServiceInjector,
        )

        env = _get_clean_env()
        env['OH_SANDBOX_CONTAINER_URL_PATTERN'] = 'https://openhands-{port}.example.com'
        with patch.dict(os.environ, env, clear=True):
            config = config_from_env()

            assert isinstance(config.sandbox, DockerSandboxServiceInjector)
            assert config.sandbox.container_url_pattern == (
                'https://openhands-{port}.example.com'
            )

    def test_falls_back_to_legacy_env_var_name(self):
        """The unprefixed SANDBOX_CONTAINER_URL_PATTERN still works."""
        from openhands.app_server.config import config_from_env
        from openhands.app_server.sandbox.docker_sandbox_service import (
            DockerSandboxServiceInjector,
        )

        env = _get_clean_env()
        env['SANDBOX_CONTAINER_URL_PATTERN'] = 'http://sandbox-{port}.example.com'
        with patch.dict(os.environ, env, clear=True):
            config = config_from_env()

            assert isinstance(config.sandbox, DockerSandboxServiceInjector)
            assert config.sandbox.container_url_pattern == (
                'http://sandbox-{port}.example.com'
            )

    def test_oh_prefixed_takes_precedence(self):
        """OH_SANDBOX_CONTAINER_URL_PATTERN wins over the legacy name."""
        from openhands.app_server.config import config_from_env

        env = _get_clean_env()
        env['OH_SANDBOX_CONTAINER_URL_PATTERN'] = 'https://openhands-{port}.example.com'
        env['SANDBOX_CONTAINER_URL_PATTERN'] = 'http://legacy-{port}.example.com'
        with patch.dict(os.environ, env, clear=True):
            config = config_from_env()
            assert config.sandbox.container_url_pattern == (
                'https://openhands-{port}.example.com'
            )

    def test_defaults_to_localhost_pattern_when_unset(self):
        """Without the env var the default localhost pattern applies."""
        from openhands.app_server.config import config_from_env
        from openhands.app_server.sandbox.docker_sandbox_service import (
            DockerSandboxServiceInjector,
        )

        env = _get_clean_env()
        with patch.dict(os.environ, env, clear=True):
            config = config_from_env()

            assert isinstance(config.sandbox, DockerSandboxServiceInjector)
            assert config.sandbox.container_url_pattern == ('http://localhost:{port}')


class TestWebClientConfigSandboxUrlFields:
    """Test that the sandbox URL pattern and web URL reach the frontend."""

    def test_web_client_config_includes_pattern_and_web_url(self):
        """get_web_client_config surfaces both new fields."""
        import openhands.app_server.config as config_module
        from openhands.app_server.web_client.default_web_client_config_injector import (
            DefaultWebClientConfigInjector,
        )

        env = _get_clean_env()
        env['OH_SANDBOX_CONTAINER_URL_PATTERN'] = 'https://openhands-{port}.example.com'
        env['OH_WEB_URL'] = 'https://openhands.example.com'
        with patch.dict(os.environ, env, clear=True):
            config_module._global_config = config_module.config_from_env()
            injector = DefaultWebClientConfigInjector()

            import asyncio

            result = asyncio.run(injector.get_web_client_config())

            assert result.sandbox_container_url_pattern == (
                'https://openhands-{port}.example.com'
            )
            assert result.web_url == 'https://openhands.example.com'

    def test_web_client_config_pattern_null_for_localhost_default(self):
        """The default localhost pattern is not surfaced (frontend keeps legacy behavior)."""
        import openhands.app_server.config as config_module
        from openhands.app_server.web_client.default_web_client_config_injector import (
            DefaultWebClientConfigInjector,
        )

        env = _get_clean_env()
        with patch.dict(os.environ, env, clear=True):
            config_module._global_config = config_module.config_from_env()
            injector = DefaultWebClientConfigInjector()

            import asyncio

            result = asyncio.run(injector.get_web_client_config())

            assert result.sandbox_container_url_pattern is None

    def test_get_web_url_returns_none_when_unset(self):
        from openhands.app_server.web_client.default_web_client_config_injector import (
            _get_web_url,
        )

        with patch.dict(os.environ, {'OH_WEB_URL': '', 'WEB_URL': ''}, clear=True):
            assert _get_web_url() is None

    def test_get_web_url_reads_oh_prefixed_name(self):
        from openhands.app_server.web_client.default_web_client_config_injector import (
            _get_web_url,
        )

        with patch.dict(os.environ, {'OH_WEB_URL': 'https://openhands.example.com'}):
            assert _get_web_url() == 'https://openhands.example.com'


class TestGetSandboxContainerUrlPatternHelper:
    """Test the helper that decides whether to surface the pattern."""

    def test_returns_pattern_for_external_host(self):
        from openhands.app_server.sandbox.docker_sandbox_service import (
            DockerSandboxServiceInjector,
        )
        from openhands.app_server.web_client.default_web_client_config_injector import (
            _get_sandbox_container_url_pattern,
        )

        sandbox = DockerSandboxServiceInjector(
            container_url_pattern='https://openhands-{port}.example.com'
        )
        config = SimpleNamespace(sandbox=sandbox)
        assert _get_sandbox_container_url_pattern(config) == (
            'https://openhands-{port}.example.com'
        )

    def test_returns_none_for_localhost_pattern(self):
        from openhands.app_server.sandbox.docker_sandbox_service import (
            DockerSandboxServiceInjector,
        )
        from openhands.app_server.web_client.default_web_client_config_injector import (
            _get_sandbox_container_url_pattern,
        )

        sandbox = DockerSandboxServiceInjector(
            container_url_pattern='http://localhost:{port}'
        )
        config = SimpleNamespace(sandbox=sandbox)
        assert _get_sandbox_container_url_pattern(config) is None

    def test_returns_none_when_sandbox_is_not_docker(self):
        from openhands.app_server.web_client.default_web_client_config_injector import (
            _get_sandbox_container_url_pattern,
        )

        config = SimpleNamespace(sandbox=None)
        assert _get_sandbox_container_url_pattern(config) is None
