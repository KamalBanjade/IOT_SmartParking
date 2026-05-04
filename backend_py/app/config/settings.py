import socket
from pydantic_settings import BaseSettings


def _get_lan_ip() -> str:
    """
    Detects the machine's LAN IP by briefly connecting to an external
    address (no data is sent). Falls back to localhost if offline.
    """
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "localhost"


class Settings(BaseSettings):
    PORT: int = 3000
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "smart_parking"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""
    MQTT_BROKER: str = "localhost"
    MQTT_PORT: int = 1883
    MQTT_TOPIC_SLOTS: str = "parking/slots/#"
    PARKING_RATE_PER_HOUR: float = 30
    JWT_SECRET: str
    JWT_OPERATOR_EXPIRES: int = 480
    JWT_CUSTOMER_EXPIRES: int = 43200
    KHALTI_SECRET_KEY: str = ""
    KHALTI_PUBLIC_KEY: str = ""
    KHALTI_BASE_URL: str = "https://khalti.com/api/v2/epayment/"
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "SmartParking"
    # Leave blank in .env to auto-detect the current LAN IP (recommended).
    # Set explicitly (e.g. FRONTEND_URL=http://192.168.1.x:5173) to override.
    FRONTEND_URL: str = ""
    ESEWA_PRODUCT_CODE: str = "EPAYTEST"
    ESEWA_SECRET_KEY: str = "8gBm/:&EnhH.1/q"
    ESEWA_PAYMENT_URL: str = "https://rc-epay.esewa.com.np/api/epay/main/v2/form"
    ESEWA_STATUS_URL: str = "https://rc.esewa.com.np/api/epay/transaction/status/"

    class Config:
        env_file = ".env"

    @property
    def frontend_url(self) -> str:
        """Returns FRONTEND_URL from .env, or auto-detects the LAN IP."""
        if self.FRONTEND_URL:
            return self.FRONTEND_URL
        return f"http://{_get_lan_ip()}:5173"


settings = Settings()
