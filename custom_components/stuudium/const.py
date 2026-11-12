"""Constants for the Stuudium integration."""
from datetime import timedelta

DOMAIN = "stuudium"

CONF_HOST = "host"
CONF_COOKIE = "cookie"

SCAN_INTERVAL = timedelta(minutes=30)

EVENT_NEW_GRADE = "stuudium_new_grade"
EVENT_NEW_MESSAGE = "stuudium_new_message"

RECENT_GRADES = 10
RECENT_MESSAGES = 10
