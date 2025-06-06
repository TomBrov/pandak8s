FROM python:3.13-alpine3.21

WORKDIR /app

# Install dependencies
RUN pip install poetry

COPY pyproject.toml README.md ./
RUN poetry install --no-root

COPY main.py k8s_client.py logger.py ./

EXPOSE 8080

CMD ["poetry", "run", "python", "main.py"]