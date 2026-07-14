"""Pont minimal entre HyperScript local et HyperInscription.

Ce module n'effectue ni scraping ni envoi à la place d'HyperScript. Il reçoit
les résultats du moteur existant, crée les démos privées et synchronise les
statuts du dashboard.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
import uuid


class HyperInscriptionBridge:
    def __init__(self, base_url: str | None = None, token: str | None = None):
        self.base_url = (base_url or os.environ.get("HYPERINSCRIPTION_API_URL", "")).rstrip("/")
        self.token = token or os.environ.get("HYPERINSCRIPTION_API_TOKEN", "")
        if not self.base_url:
            raise ValueError("HYPERINSCRIPTION_API_URL is required")

    def _post(self, path: str, payload: dict) -> dict:
        headers = {"Content-Type": "application/json", "User-Agent": "HyperScript/HyperInscription-Bridge"}
        if self.token:
            headers["Authorization"] = "Bearer " + self.token
        request = urllib.request.Request(
            self.base_url + path,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", "ignore")
            raise RuntimeError(f"HyperInscription HTTP {error.code}: {detail}") from error

    def start_run(self, city: str, activities: list[str], locale: str = "fr", run_id: str | None = None) -> dict:
        return self._post("/api/hyperscript/run", {
            "externalRunId": run_id or str(uuid.uuid4()),
            "city": city,
            "activities": activities,
            "locale": locale,
            "status": "running",
        })

    def create_demo(self, prospect: dict) -> dict:
        """prospect: organization, websiteUrl, email, activity, city, locale."""
        return self._post("/api/demo/generate", {
            "organization": prospect.get("organization"),
            "websiteUrl": prospect.get("websiteUrl"),
            "recipientEmail": prospect.get("email"),
            "firstName": prospect.get("firstName"),
            "activity": prospect.get("activity"),
            "city": prospect.get("city"),
            "locale": prospect.get("locale", "fr"),
        })

    def sync_prospect(self, prospect: dict, status: str, score: int = 0, signal: str = "", demo_slug: str = "") -> dict:
        return self._post("/api/hyperscript/prospect", {
            "externalId": prospect.get("externalId") or prospect.get("id") or str(uuid.uuid4()),
            "campaignRunId": prospect.get("campaignRunId"),
            "organization": prospect.get("organization"),
            "websiteUrl": prospect.get("websiteUrl"),
            "email": prospect.get("email"),
            "activity": prospect.get("activity"),
            "city": prospect.get("city"),
            "locale": prospect.get("locale", "fr"),
            "status": status,
            "score": score,
            "signal": signal,
            "demoSlug": demo_slug,
        })


if __name__ == "__main__":
    bridge = HyperInscriptionBridge()
    print(bridge.start_run("Le Mans", ["Danse", "Théâtre"]))
