"""Генерация VAPID-ключей для Web Push.

Использование:
    python manage.py generate_vapid_keys

Скопируйте вывод в `.env`:
    VAPID_PUBLIC_KEY=...
    VAPID_PRIVATE_KEY=...
    VAPID_CLAIMS_EMAIL=mailto:admin@aqualine.tj

Публичный ключ также автоматически отдаётся фронту через
`/api/notifications/push/vapid-public-key/`.
"""
import base64

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from django.core.management.base import BaseCommand


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


class Command(BaseCommand):
    help = "Сгенерировать пару VAPID-ключей для Web Push"

    def handle(self, *args, **opts) -> None:
        priv = ec.generate_private_key(ec.SECP256R1())
        priv_bytes = priv.private_numbers().private_value.to_bytes(32, "big")
        pub_pt = priv.public_key().public_bytes(
            encoding=serialization.Encoding.X962,
            format=serialization.PublicFormat.UncompressedPoint,
        )

        public = b64url(pub_pt)
        private = b64url(priv_bytes)

        self.stdout.write(self.style.SUCCESS("VAPID keys generated:\n"))
        self.stdout.write(f"VAPID_PUBLIC_KEY={public}")
        self.stdout.write(f"VAPID_PRIVATE_KEY={private}")
        self.stdout.write("VAPID_CLAIMS_EMAIL=mailto:admin@aqualine.tj")
        self.stdout.write(
            self.style.WARNING(
                "\nДобавьте эти три строки в backend/.env и перезапустите backend + celery."
            )
        )
