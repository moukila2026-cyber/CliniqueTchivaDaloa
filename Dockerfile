FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 TZ=Africa/Abidjan DATA_DIR=/app/data
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && useradd --create-home --uid 10001 clinic
COPY --chown=clinic:clinic app.py manage.py ./
COPY --chown=clinic:clinic static ./static
RUN mkdir /app/data && chown clinic:clinic /app/data && chmod 700 /app/data
USER clinic
EXPOSE 8000
CMD ["uvicorn","app:app","--host","0.0.0.0","--port","8000","--workers","1"]
