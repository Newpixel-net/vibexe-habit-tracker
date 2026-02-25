# Auth & Access Control

## Authentication Providers

> Auth settings not configured. Defaults apply (email/password enabled).

## Entity Access Policies

> No custom access policies configured. Default: read=public, write=authenticated, delete=authenticated.

## Access Level Reference

| Level | Description |
|-------|-------------|
| `public` | Anyone, no authentication required |
| `authenticated` | Signed-in users only |
| `owner` | Only the record creator (matched by owner field) |
| `role` | Specific user roles only |
