# ------- Base stage -------
FROM node:21.6 AS base
WORKDIR /app
COPY package.json package-lock.json* ./

# ------- Dev stage -------
FROM base AS dev

# Setup entrypoint
COPY docker/backend/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Allow configurable UID/GID
ARG UID=1000
ARG GID=1000
RUN if ! getent group ${GID} >/dev/null; then \
      groupadd -g ${GID} devuser; \
    fi
RUN if ! id -u ${UID} >/dev/null 2>&1; then \
      useradd -u ${UID} -g ${GID} -m devuser; \
    fi

# Fire in the hole!
ENTRYPOINT ["entrypoint.sh"]
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
