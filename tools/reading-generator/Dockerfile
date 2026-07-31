FROM python:3.13-slim
WORKDIR /app
COPY pyproject.toml generator.py README.md ./
RUN pip install --no-cache-dir .
USER nobody
CMD ["faena-reading-generator"]
