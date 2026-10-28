FROM python:3.13-slim AS dev

COPY --from=ghcr.io/astral-sh/uv:0.8.23 /uv /uvx /bin/

# Keep the venv outside /app so the host .venv mounted with the code is never used.
ENV UV_PROJECT_ENVIRONMENT=/opt/venv \
    UV_LINK_MODE=copy \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project

COPY . .

EXPOSE 8010
CMD ["uv", "run", "python", "manage.py", "runserver", "0.0.0.0:8010"]


FROM python:3.13-slim AS prod

COPY --from=ghcr.io/astral-sh/uv:0.8.23 /uv /bin/

ENV UV_PROJECT_ENVIRONMENT=/opt/venv \
    UV_LINK_MODE=copy \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

COPY . .

# The code stays owned by root: the app user only writes uploads and collected static files.
RUN useradd --system --uid 1000 app \
    && mkdir -p media staticfiles \
    && chown app:app media staticfiles
USER app

EXPOSE 8000
ENTRYPOINT ["./entrypoint.sh"]
