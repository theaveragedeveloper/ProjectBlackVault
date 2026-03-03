FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p app/static/uploads/firearms app/static/uploads/accessories

EXPOSE 5000

ENV FLASK_APP=run.py
ENV FLASK_DEBUG=false

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "run:app"]
