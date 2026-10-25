FROM python:3.12-slim AS dependencies

WORKDIR /app
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim

ENV PATH="/opt/venv/bin:$PATH" PYTHONDONTWRITEBYTECODE=1
WORKDIR /app
COPY --from=dependencies /opt/venv /opt/venv
COPY main.py ./

USER 10001:10001
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
