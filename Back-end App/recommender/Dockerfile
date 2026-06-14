FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Instalar cron
RUN apt-get update && apt-get install -y cron && rm -rf /var/lib/apt/lists/*

COPY . .

# Cron: reentrenar todos los días a las 3am y recargar el modelo
RUN echo "0 3 * * * cd /app && python -m model.train && curl -s -X POST http://localhost:8001/reload >> /var/log/train.log 2>&1" > /etc/cron.d/retrain \
    && chmod 0644 /etc/cron.d/retrain \
    && crontab /etc/cron.d/retrain

RUN chmod +x start.sh

CMD ["./start.sh"]
