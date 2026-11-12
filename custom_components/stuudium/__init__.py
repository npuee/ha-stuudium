"""Stuudium (ope.ee e-school) integration: grades, homework, attendance, messages."""
from __future__ import annotations

import hashlib
from pathlib import Path

import aiohttp

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.aiohttp_client import async_create_clientsession
from homeassistant.helpers.typing import ConfigType

from .api import StuudiumClient, parse_cookie_text
from .const import CONF_COOKIE, CONF_HOST, DOMAIN
from .coordinator import StuudiumCoordinator

PLATFORMS = [Platform.SENSOR]
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

CARD_FILE = Path(__file__).parent / "frontend" / "stuudium-card.js"
CARD_URL = "/stuudium_static/stuudium-card.js"

type StuudiumConfigEntry = ConfigEntry[StuudiumCoordinator]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Serve the bundled Lovelace card and load it on every dashboard."""
    digest = await hass.async_add_executor_job(
        lambda: hashlib.sha1(CARD_FILE.read_bytes()).hexdigest()[:8]
    )
    await hass.http.async_register_static_paths(
        [StaticPathConfig(CARD_URL, str(CARD_FILE), cache_headers=False)]
    )
    # ?v=<hash> makes browsers pick up a new card version after updates.
    add_extra_js_url(hass, f"{CARD_URL}?v={digest}")
    return True


async def async_setup_entry(hass: HomeAssistant, entry: StuudiumConfigEntry) -> bool:
    # Own session with a dummy jar: cookies are managed by the client itself.
    session = async_create_clientsession(hass, cookie_jar=aiohttp.DummyCookieJar())
    client = StuudiumClient(session, entry.data[CONF_HOST], parse_cookie_text(entry.data[CONF_COOKIE]))
    coordinator = StuudiumCoordinator(hass, entry, client)
    await coordinator.async_config_entry_first_refresh()
    entry.runtime_data = coordinator
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: StuudiumConfigEntry) -> bool:
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
