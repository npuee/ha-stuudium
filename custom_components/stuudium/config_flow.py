"""Config flow for Stuudium.

Step 1 asks for the school's Stuudium address, step 2 for the two cookies in
separate fields: _stdmss (the session, required) and __stclid (the
remember-me cookie, optional). Each field takes just the cookie's value; the
first one also accepts anything containing cookies (Cookie header, Copy as
cURL, extension export...).
"""
from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import aiohttp
import voluptuous as vol

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult
from homeassistant.helpers.aiohttp_client import async_create_clientsession
from homeassistant.helpers.selector import TextSelector, TextSelectorConfig, TextSelectorType

from .api import (
    AUTOLOGIN_COOKIE,
    SESSION_COOKIE,
    StuudiumAuthError,
    StuudiumClient,
    StuudiumError,
    cookies_to_text,
    extract_cookies,
    normalize_host,
)
from .const import CONF_COOKIE, CONF_HOST, DOMAIN

FIELD = "session_cookie"
FIELD_AUTOLOGIN = "autologin_cookie"
FIELDS = ((FIELD, SESSION_COOKIE), (FIELD_AUTOLOGIN, AUTOLOGIN_COOKIE))


def _cookie_schema(defaults: Mapping[str, str] | None = None) -> vol.Schema:
    defaults = defaults or {}
    text = TextSelector(TextSelectorConfig(type=TextSelectorType.TEXT))
    return vol.Schema(
        {
            vol.Required(FIELD, default=defaults.get(FIELD, "")): text,
            vol.Optional(FIELD_AUTOLOGIN, default=defaults.get(FIELD_AUTOLOGIN, "")): text,
        }
    )


def cookies_from_form(user_input: Mapping[str, Any]) -> dict[str, str]:
    """A bare value belongs to the field's cookie; anything else is parsed for cookies."""
    cookies: dict[str, str] = {}
    for field, name in FIELDS:
        value = str(user_input.get(field) or "").strip()
        if value:
            cookies.update(extract_cookies(value) or {name: value.strip('"').strip("'")})
    return cookies


class StuudiumConfigFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 1

    def __init__(self) -> None:
        self._host: str | None = None

    def _placeholders(self, host: str) -> dict[str, str]:
        return {"host": host, "site_url": f"https://{host}", "login_url": f"https://{host}/auth/"}

    async def _validate(self, host: str, cookies: dict[str, str]) -> tuple[str | None, StuudiumClient | None]:
        if not cookies:
            return "invalid_cookie", None
        if SESSION_COOKIE not in cookies:
            return "missing_session", None
        session = async_create_clientsession(
            self.hass, cookie_jar=aiohttp.DummyCookieJar(), auto_cleanup=False
        )
        client = StuudiumClient(session, host, cookies)
        try:
            await client.get_student_ids()
            await client.get_unread()  # also learns the account guid
        except StuudiumAuthError:
            return "invalid_auth", None
        except StuudiumError:
            return "cannot_connect", None
        finally:
            await session.close()
        return None, client

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Step 1: which school."""
        errors: dict[str, str] = {}
        if user_input is not None:
            host = normalize_host(user_input[CONF_HOST])
            if host:
                self._host = host
                return await self.async_step_cookies()
            errors[CONF_HOST] = "invalid_host"
        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {vol.Required(CONF_HOST): TextSelector(TextSelectorConfig(type=TextSelectorType.URL))}
            ),
            # URLs must not be inside translation strings (hassfest)
            description_placeholders={
                "example_host": "myschool.ope.ee",
                "example_url": "https://myschool.ope.ee/s/123",
            },
            errors=errors,
        )

    async def async_step_cookies(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Step 2: the login cookies."""
        errors: dict[str, str] = {}
        assert self._host
        if user_input is not None:
            error, client = await self._validate(self._host, cookies_from_form(user_input))
            if error:
                errors["base"] = error
            else:
                await self.async_set_unique_id(client.user_guid)
                self._abort_if_unique_id_configured()
                return self.async_create_entry(
                    title=client.host,
                    data={CONF_HOST: client.host, CONF_COOKIE: cookies_to_text(client.cookies)},
                )
        return self.async_show_form(
            step_id="cookies",
            data_schema=_cookie_schema(user_input),
            description_placeholders=self._placeholders(self._host),
            errors=errors,
        )

    async def async_step_reconfigure(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Paste new cookies at any time (Settings -> Stuudium -> Reconfigure)."""
        entry = self._get_reconfigure_entry()
        host = entry.data[CONF_HOST]
        errors: dict[str, str] = {}
        if user_input is not None:
            error, client = await self._validate(host, cookies_from_form(user_input))
            if error:
                errors["base"] = error
            else:
                await self.async_set_unique_id(client.user_guid)
                self._abort_if_unique_id_mismatch(reason="wrong_account")
                return self.async_update_reload_and_abort(
                    entry, data_updates={CONF_COOKIE: cookies_to_text(client.cookies)}
                )
        return self.async_show_form(
            step_id="reconfigure",
            data_schema=_cookie_schema(user_input),
            description_placeholders=self._placeholders(host),
            errors=errors,
        )

    async def async_step_reauth(self, entry_data: Mapping[str, Any]) -> ConfigFlowResult:
        return await self.async_step_reauth_confirm()

    async def async_step_reauth_confirm(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        entry = self._get_reauth_entry()
        host = entry.data[CONF_HOST]
        errors: dict[str, str] = {}
        if user_input is not None:
            error, client = await self._validate(host, cookies_from_form(user_input))
            if error:
                errors["base"] = error
            else:
                return self.async_update_reload_and_abort(
                    entry, data_updates={CONF_COOKIE: cookies_to_text(client.cookies)}
                )
        return self.async_show_form(
            step_id="reauth_confirm",
            data_schema=_cookie_schema(user_input),
            description_placeholders=self._placeholders(host),
            errors=errors,
        )
