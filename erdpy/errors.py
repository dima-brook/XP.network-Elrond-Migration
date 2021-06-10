
from typing import Any, Union


class KnownError(Exception):
    inner = None

    def __init__(self, message: str, inner: Union[Any, None] = None):
        super().__init__(message)
        self.inner = inner

    def get_pretty(self) -> str:
        if self.inner:
            return f"""{self}
... {self.inner}
"""
        return str(self)


class ProgrammingError(KnownError):
    pass


class TemplateMissingError(KnownError):
    def __init__(self, template: str):
        super().__init__(f"Template missing: {template}")


class DownloadError(KnownError):
    pass


class BadUrlError(DownloadError):
    pass


class UnknownArchiveType(KnownError):
    pass


class DependencyMissing(KnownError):
    def __init__(self, name: str, tag: str):
        super().__init__(f"Dependency missing: {name} {tag}")


class UnknownDependency(KnownError):
    def __init__(self, name: str):
        super().__init__(f"Unknown dependency: {name}")


class BadDirectory(KnownError):
    def __init__(self, directory: str):
        super().__init__(f"Bad directory: {directory}")


class BadFile(KnownError):
    def __init__(self, filename: str, inner=None):
        super().__init__(f"Bad file: {filename}.", inner)


class NotSupportedProject(KnownError):
    def __init__(self, directory: str):
        super().__init__(f"Directory is not a supported project: {directory}")


class PlatformNotSupported(KnownError):
    def __init__(self, action_or_item: str, platform: str):
        super().__init__(f"[{action_or_item}] is not supported on platform [{platform}].")


class BuildError(KnownError):
    def __init__(self, message, inner=None):
        super().__init__(f"Build error: {message}.", inner)


class BadSink(ProgrammingError):
    def __init__(self, name: str):
        super().__init__(f"Bad sink:\n {name}.")


class UnknownArgumentFormat(KnownError):
    def __init__(self, argument: Any):
        super().__init__(f"Cannot handle non-hex, non-number arguments yet: {argument}.")


class ProxyRequestError(KnownError):
    def __init__(self, url: str, data: Any):
        super().__init__(f"Proxy request error for url [{url}]: {data}")


class BlockAtlasRequestError(KnownError):
    def __init__(self, url: str, data: Any):
        super().__init__(f"Block Atlas request error for url [{url}]: {data}")


class BadInputError(KnownError):
    def __init__(self, input: str, message: str):
        super().__init__(f"Bad input [{input}]: {message}")


class BadAddressFormatError(KnownError):
    def __init__(self, value: str):
        super().__init__(f"Bad address [{value}].")


class EmptyAddressError(KnownError):
    def __init__(self):
        super().__init__("Address is empty.")


class ExternalProcessError(KnownError):
    def __init__(self, command_line: str, message: str):
        super().__init__(f"""External process error:
Command line: {command_line}
Output: {message}""")


class UnknownConfigurationError(KnownError):
    def __init__(self, name: str):
        super().__init__(f"Configuration entry is not known: {name}.")


class ConfigurationShouldBeUniqueError(KnownError):
    def __init__(self, name: str):
        super().__init__(f"Configuration entry already exists: {name}.")


class ConfigurationProtectedError(KnownError):
    def __init__(self, name: str):
        super().__init__(f"This configuration name is protected: {name}.")


class UnknownDerivationFunction(KnownError):
    def __init__(self):
        super().__init__("Unknown key derivation function.")


class UnknownCipher(KnownError):
    def __init__(self, name: str):
        super().__init__(f"Unknown cipher: {name}.")


class InvalidKeystoreFilePassword(KnownError):
    def __init__(self):
        super().__init__("Provided keystore file password is invalid.")


class BadUserInput(KnownError):
    def __init__(self, message: str):
        super().__init__(f"Bad user input: {message}.")


class BadUsage(KnownError):
    def __init__(self, message: str):
        super().__init__(f"Bad usage: {message}.")


class CannotSignMessageWithBLSKey(KnownError):
    def __init__(self):
        super(CannotSignMessageWithBLSKey, self).__init__("cannot sign message with BLS key")


class CannotReadValidatorsData(KnownError):
    def __init__(self):
        super(CannotReadValidatorsData, self).__init__("cannot read validators data")


class TransactionIsNotSigned(KnownError):
    def __init__(self):
        super().__init__("Transaction is not signed.")


class NoWalletProvided(KnownError):
    def __init__(self):
        super().__init__("No wallet provided.")


class TestnetError(KnownError):
    def __init__(self, message: str):
        super().__init__(message)
