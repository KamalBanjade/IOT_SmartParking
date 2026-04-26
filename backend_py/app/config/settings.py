from pydantic_settings import BaseSettings

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
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"

settings = Settings()
